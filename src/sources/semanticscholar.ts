// Semantic Scholar API — requires API key
// https://api.semanticscholar.org/
import type { Paper, SourceResult } from "./types";

const BASE = "https://api.semanticscholar.org/graph/v1";
const API_KEY = process.env.S2_API_KEY || "";

export async function search(
  query: string,
  yearFrom?: number,
  yearTo?: number,
  minCited?: number,
  limit: number = 20
): Promise<SourceResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const fields = "title,authors,year,journal,externalIds,citationCount,abstract,url";
    const params = new URLSearchParams({
      query,
      limit: String(Math.min(limit, 30)),
      fields,
      sort: "citationCount:desc",
    });

    const headers: Record<string, string> = {};
    if (API_KEY) headers["x-api-key"] = API_KEY;

    const res = await fetch(`${BASE}/paper/search?${params}`, {
      signal: controller.signal,
      headers,
    });
    if (!res.ok) throw new Error(`SemanticScholar ${res.status}`);

    const data = await res.json();
    const papers: Paper[] = (data.data || []).map((p: any) => {
      // Year range filter manually if needed
      const year = p.year || 0;
      if (yearFrom && year < yearFrom) return null;
      if (yearTo && year > yearTo) return null;
      if (minCited && (p.citationCount || 0) < minCited) return null;

      return {
        title: p.title || "Untitled",
        authors: (p.authors || []).map((a: any) => a.name || "Unknown"),
        year,
        journal: p.journal?.name || "N/A",
        doi: p.externalIds?.DOI || null,
        cited: p.citationCount || 0,
        url: p.url || `https://api.semanticscholar.org/CorpusID:${p.paperId}`,
        source: "SemanticScholar",
        abstract: p.abstract || null,
      };
    }).filter(Boolean) as Paper[];

    return { papers, total: papers.length };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { papers: [], total: 0, error: "SemanticScholar timeout" };
    }
    return { papers: [], total: 0, error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}
