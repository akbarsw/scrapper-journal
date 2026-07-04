// Orchestrator: panggil semua source paralel → merge → dedup → filter
import type { Paper, SourceResult } from "./types";
import { search as openalex } from "./openalex";
import { search as semanticscholar } from "./semanticscholar";
import { search as crossref } from "./crossref";
import { search as scopus } from "./scopus";
import { generateKeywords } from "./llm";

export interface SearchParams {
  vars: string;
  yearFrom?: number;
  yearTo?: number;
  minCited?: number;
  limit: number;
  lang?: string;
  exclude?: string;
  scopus?: boolean;
}

function dedup(papers: Paper[]): Paper[] {
  const seen = new Set<string>();
  return papers.filter((p) => {
    const key = p.doi || p.title.toLowerCase().trim().slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function applyFiltersAndScore(papers: Paper[], params: SearchParams, booleanQuery: string): Paper[] {
  let filtered = [...papers];

  // Language filter (simple heuristic)
  if (params.lang && params.lang !== "both") {
    const idChars = /[^a-zA-Z0-9\s.,;:!?()\-"'\[\]]/;
    filtered = filtered.filter((p) => {
      if (!p.abstract) return true;
      const hasIndo = idChars.test(p.abstract) || /\b(di|dan|yang|dari|dengan|pada|untuk|dalam|adalah|ini|itu)\b/i.test(p.abstract);
      return params.lang === "id" ? hasIndo : !hasIndo;
    });
  }

  // Exclude keywords
  if (params.exclude) {
    const excludes = params.exclude.split(",").map((s) => s.trim().toLowerCase());
    filtered = filtered.filter((p) => {
      const text = `${p.title} ${p.abstract || ""} ${p.journal}`.toLowerCase();
      return !excludes.some((ex) => text.includes(ex));
    });
  }

  // Extract core keywords from the boolean query for relevance scoring
  // E.g., '"supply chain" AND "coffee"' -> ['supply chain', 'coffee']
  const queryTerms = booleanQuery
    .replace(/ AND /g, ',')
    .replace(/ OR /g, ',')
    .replace(/["()]/g, '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 2);

  // Score each paper
  filtered.forEach(p => {
    let score = 0;
    const title = (p.title || "").toLowerCase();
    const abstract = (p.abstract || "").toLowerCase();

    // 1. Topic Relevance (Heaviest Weight)
    let matchCount = 0;
    for (const term of queryTerms) {
      if (title.includes(term)) {
        score += 15; // Sangat relevan jika ada di Judul
        matchCount++;
      } else if (abstract.includes(term)) {
        score += 5;  // Cukup relevan jika ada di Abstrak
        matchCount++;
      }
    }

    // HAPUS PENALTI -50
    // Biarkan matchCount === 0 skornya tetap 0 (tidak dihukum mati, hanya tenggelam ke bawah)

    // 2. Citation Impact (Logarithmic Weight)
    // 10 cit = +2 pts | 100 cit = +4 pts | 1000 cit = +6 pts
    // Citations are important but won't outrank a highly relevant 0-citation new paper
    if (p.cited > 0) {
      score += Math.log10(p.cited + 1) * 2;
    }

    // 3. Recency Bonus
    if (p.year) {
      const currentYear = new Date().getFullYear();
      if (p.year === currentYear || p.year === currentYear - 1) score += 3;
      else if (p.year < currentYear - 10) score -= 2; // Old paper penalty
    }

    (p as any)._relevanceScore = score;
  });

  // JANGAN FILTER OUT. Cuma ngurutin aja. Yang relevansinya jelek taruh bawah.
  // filtered = filtered.filter(p => (p as any)._relevanceScore > -10);

  return filtered;
}

export interface SearchResult {
  papers: Paper[];
  total: number;
  sources: { name: string; count: number; error?: string }[];
  time: number;
}

export async function searchAll(params: SearchParams): Promise<SearchResult> {
  const start = Date.now();
  
  // Tembak LLM 9Router buat dapet Boolean query (Atau fallback regex kalo gagal)
  const query = await generateKeywords(params.vars);

  // Panggil paralel
  const sources: Promise<SourceResult>[] = [
    openalex(query, params.yearFrom, params.yearTo, params.minCited, params.limit),
    semanticscholar(query, params.yearFrom, params.yearTo, params.minCited, params.limit),
    crossref(query, params.yearFrom, params.yearTo, params.minCited, params.limit),
  ];
  if (params.scopus) {
    sources.push(scopus(query, params.yearFrom, params.yearTo, params.minCited, params.limit));
  }

  const results = await Promise.allSettled(sources);
  const sourceMeta: { name: string; count: number; error?: string }[] = [];
  const allPapers: Paper[] = [];

  const sourceNames = ["OpenAlex", "SemanticScholar", "Crossref", ...(params.scopus ? ["Scopus"] : [])];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      allPapers.push(...r.value.papers);
      sourceMeta.push({ name: sourceNames[i], count: r.value.papers.length, error: r.value.error });
    } else {
      sourceMeta.push({ name: sourceNames[i], count: 0, error: r.reason?.message || "Failed" });
    }
  });

  // Dedup
  let papers = dedup(allPapers);

  // Apply filters and score
  papers = applyFiltersAndScore(papers, params, query);

  // Sort by RELEVANCE SCORE first, then by citation count
  papers.sort((a, b) => {
    const scoreA = (a as any)._relevanceScore || 0;
    const scoreB = (b as any)._relevanceScore || 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.cited - a.cited;
  });

  // Limit
  papers = papers.slice(0, params.limit);

  return {
    papers,
    total: papers.length,
    sources: sourceMeta,
    time: Date.now() - start,
    llmQuery: query, // Pass LLM query biar kesimpen di database / response debug
  };
}

