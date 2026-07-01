// Orchestrator: panggil semua source paralel → merge → dedup → filter
import type { Paper, SourceResult } from "./types";
import { search as openalex } from "./openalex";
import { search as semanticscholar } from "./semanticscholar";
import { search as crossref } from "./crossref";
import { search as scopus } from "./scopus";

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

function applyFilters(papers: Paper[], params: SearchParams): Paper[] {
  let filtered = [...papers];

  // Language filter (simple heuristic)
  if (params.lang && params.lang !== "both") {
    const idChars = /[^a-zA-Z0-9\s.,;:!?()\-"'\[\]]/;
    filtered = filtered.filter((p) => {
      if (!p.abstract) return true; // keep if no abstract to check
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
  const query = params.vars.replace(/[,_]+/g, " ").trim();

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

  // Apply filters
  papers = applyFilters(papers, params);

  // Sort by cited count desc
  papers.sort((a, b) => b.cited - a.cited);

  // Limit
  papers = papers.slice(0, params.limit);

  return {
    papers,
    total: papers.length,
    sources: sourceMeta,
    time: Date.now() - start,
  };
}

