// Orchestrator: panggil semua source paralel → merge → dedup → filter
import type { Paper, SourceResult } from "./types";
import { search as openalex } from "./openalex";
import { search as semanticscholar } from "./semanticscholar";
import { search as crossref } from "./crossref";
import { search as scopus } from "./scopus";
import { generateKeywords, ExtractedIntent, rerankPapers } from "./llm";

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

function normalizeDoi(doi: string): string {
  return doi
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '')
    .replace(/^doi:\s*/, '')
    .trim();
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD') // pecah diacritics
    .replace(/[\u0300-\u036f]/g, '') // hapus diacritics
    .replace(/&amp;/g, 'and')
    .replace(/[^\w\s]/g, '') // buang semua punctuation, bukan cuma slice
    .replace(/\s+/g, ' ')
    .trim();
}

function dedup(papers: Paper[]): Paper[] {
  const seen = new Set<string>();
  return papers.filter((p) => {
    const key = p.doi
      ? `doi:${normalizeDoi(p.doi)}`
      : `title:${normalizeTitle(p.title)}`; // full title, no slice

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function calculateLexicalScore(paper: Paper, intent: ExtractedIntent): number {
  const text = (paper.title + " " + (paper.abstract || "")).toLowerCase();

  // BM25 Simplified: Cek berapa banyak "core concept" (Inggris + Indo) yang muncul di teks
  let matches = 0;
  for (const concept of intent.core_concepts) {
    if (text.includes(concept)) matches++;
  }

  if (intent.core_concepts.length === 0 || matches === 0) return 0;

  // Poin proporsional (max 20)
  return (matches / intent.core_concepts.length) * 20;
}

function applyFiltersAndScore(papers: Paper[], params: SearchParams, intent: ExtractedIntent): Paper[] {
  let filtered = [...papers];

  // Year filter
  if (params.yearFrom) {
    filtered = filtered.filter((p) => p.year >= params.yearFrom!);
  }
  if (params.yearTo) {
    filtered = filtered.filter((p) => p.year <= params.yearTo!);
  }

  // Citations filter
  if (params.minCited) {
    filtered = filtered.filter((p) => p.cited >= params.minCited!);
  }

  // Apply exclude filters
  let excludeList: string[] = [];
  if (typeof params.exclude === 'string') {
    excludeList = params.exclude.split(',').map((e: string) => e.trim().toLowerCase()).filter((e: string) => e);
  } else if (Array.isArray(params.exclude)) {
    excludeList = (params.exclude as any[]).map((e: any) => String(e).trim().toLowerCase()).filter((e: string) => e);
  }

  if (excludeList.length > 0) {
    filtered = filtered.filter(p => {
      const txt = (p.title + " " + (p.abstract || "")).toLowerCase();
      return !excludeList.some(ex => txt.includes(ex));
    });
  }

  // Score each paper
  filtered.forEach(p => {
    let score = 0;

    // 1. Lexical Relevance (Dynamic BM25)
    score += calculateLexicalScore(p, intent);

    // 2. Citation Impact
    if (p.cited > 0) {
      score += Math.log10(p.cited + 1) * 2;
    }

    // 3. Recency Bonus
    if (p.year) {
      const currentYear = new Date().getFullYear();
      if (p.year === currentYear || p.year === currentYear - 1) score += 3;
      else if (p.year < currentYear - 10) score -= 2;
    }

    (p as any)._relevanceScore = Number(score.toFixed(2));
  });

  return filtered;
}

export interface SearchResult {
  papers: Paper[];
  total: number;
  sources: { name: string; count: number; error?: string }[];
  time: number;
  llmQuery?: string;
}

export async function searchAll(params: SearchParams): Promise<SearchResult> {
  const start = Date.now();

  // Tembak LLM 9Router buat dapet Intent JSON
  const intent = await generateKeywords(params.vars);

  // Double Shoot Strategy (Daripada OR yang bikin API ngaco, tembak 2x terpisah lalu merge)
  const apiQueryEn = intent.query_english.replace(/"/g, "").replace(/ AND /g, " ");
  const apiQueryId = intent.query_indo.replace(/"/g, "").replace(/ AND /g, " ");

  const sources: Promise<SourceResult>[] = [];
  
  // Tembak Inggris
  if (apiQueryEn.length > 3) {
    sources.push(openalex(apiQueryEn, params.yearFrom, params.yearTo, params.minCited, params.limit));
    sources.push(semanticscholar(apiQueryEn, params.yearFrom, params.yearTo, params.minCited, params.limit));
    if (params.scopus) {
      sources.push(scopus(apiQueryEn, params.yearFrom, params.yearTo, params.minCited, params.limit));
    }
  }
  
  // Tembak Indo
  if (apiQueryId.length > 3) {
    sources.push(openalex(apiQueryId, params.yearFrom, params.yearTo, params.minCited, params.limit));
    sources.push(semanticscholar(apiQueryId, params.yearFrom, params.yearTo, params.minCited, params.limit));
    if (params.scopus) {
      sources.push(scopus(apiQueryId, params.yearFrom, params.yearTo, params.minCited, params.limit));
    }
  }

  const results = await Promise.allSettled(sources);
  const sourceMeta: { name: string; count: number; error?: string }[] = [];
  const allPapers: Paper[] = [];

  const sourceNames: string[] = [];
  if (apiQueryEn.length > 3) {
    sourceNames.push("OpenAlex (En)", "SemanticScholar (En)");
    if (params.scopus) {
      sourceNames.push("Scopus (En)");
    }
  }
  if (apiQueryId.length > 3) {
    sourceNames.push("OpenAlex (Id)", "SemanticScholar (Id)");
    if (params.scopus) {
      sourceNames.push("Scopus (Id)");
    }
  }

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

  // 1. HARD FILTER BAHASA (Lebih Cerdas & Aman)
  if (params.lang === "id") {
    papers = papers.filter(p => {
       const text = (p.title + " " + (p.abstract || "")).toLowerCase();
       const isObviousEnglish = text.match(/\b(the|of|and|in|to|a|is|for|on|with|by|an|this|study|results|we)\b/g);
       const isObviousIndo = text.match(/\b(dan|yang|di|dari|untuk|pada|dengan|ini|itu|sebagai|adalah|pengaruh|analisis|kemitraan|susu|sapi|perah|koperasi|peternak)\b/g);

       if (!isObviousEnglish) return true;
       if (isObviousIndo && isObviousIndo.length >= isObviousEnglish.length) return true;
       return false;
    });
  } else if (params.lang === "en") {
    papers = papers.filter(p => {
       const text = (p.title + " " + (p.abstract || "")).toLowerCase();
       const isObviousIndo = text.match(/\b(dan|yang|di|dari|untuk|pada|dengan|ini|itu|sebagai|adalah|pengaruh|analisis)\b/g);
       if (!isObviousIndo) return true;
       return false;
    });
  }

  // Apply filters and score
  papers = applyFiltersAndScore(papers, params, intent);

  // Sort by BM25 Lexical Score first to get the initial top candidates
  papers.sort((a, b) => {
    const scoreA = (a as any)._relevanceScore || 0;
    const scoreB = (b as any)._relevanceScore || 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return (b.cited || 0) - (a.cited || 0);
  });

  // SEMANTIC RERANKING (Panggil Gemini buat ngebuang jurnal nyasar)
  // Biar gak timeout, kita kirim maksimal 15 teratas hasil lexical ke LLM
  const candidatesForRerank = papers.slice(0, 15).map((p, i) => ({
    id: p.doi || `local_${i}`, // Pake DOI atau ID palsu kalo gada DOI
    title: p.title
  }));

  const rerankedIds = await rerankPapers(params.vars, candidatesForRerank);

  // Terapkan hasil reranking
  if (rerankedIds.length > 0) {
    const rerankedPapers = [];
    const remainingPapers = [...papers.slice(15)]; // Sisa yang gak masuk LLM

    // Susun 15 teratas sesuai urutan JSON keluaran Gemini
    for (const id of rerankedIds) {
      const idx = papers.findIndex((p, i) => (p.doi || `local_${i}`) === id);
      if (idx !== -1 && idx < 15) {
        rerankedPapers.push(papers[idx]);
        (papers[idx] as any)._aiVerified = true; // Tandai kalo ini udah dilulusin AI
      }
    }

    // Kalau Gemini ngebuang jurnal (misal rendang sapi di-drop), dia gak akan dimasukin lagi
    // Gabungin hasil reranking + sisa jurnal biasa
    papers = [...rerankedPapers, ...remainingPapers];
  }

  // Terapkan limit akhir setelah LLM beres nyortir
  if (params.limit && params.limit > 0) {
    papers = papers.slice(0, params.limit);
  }

  return {
    papers,
    total: papers.length,
    sources: sourceMeta,
    time: Date.now() - start,
    llmQuery: `${apiQueryEn} | ${apiQueryId}`,
  };
}
