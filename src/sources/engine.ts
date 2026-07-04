// Orchestrator: panggil semua source paralel → merge → dedup → filter
import type { Paper, SourceResult } from "./types";
import { search as openalex } from "./openalex";
import { search as semanticscholar } from "./semanticscholar";
import { search as crossref } from "./crossref";
import { search as scopus } from "./scopus";
import { generateKeywords, ExtractedIntent } from "./llm";

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
  
  // Kueri yang dilempar ke API eksternal harus String, bukan JSON
  // Kita gabungin Inggris OR Indo biar jangkauan tangkapan (Recall) luas
  const apiQueryString = intent.query_english 
    ? `(${intent.query_english}) OR ("${intent.query_indo}")`
    : `"${intent.query_indo}"`;

  // Panggil paralel
  const sources: Promise<SourceResult>[] = [
    openalex(apiQueryString, params.yearFrom, params.yearTo, params.minCited, params.limit),
    semanticscholar(apiQueryString, params.yearFrom, params.yearTo, params.minCited, params.limit),
    crossref(apiQueryString, params.yearFrom, params.yearTo, params.minCited, params.limit),
  ];
  if (params.scopus) {
    sources.push(scopus(apiQueryString, params.yearFrom, params.yearTo, params.minCited, params.limit));
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
    llmQuery: apiQueryString,
  };
}

