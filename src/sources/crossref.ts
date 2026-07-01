// Crossref API — free, no key required
// https://api.crossref.org/
import type { Paper, SourceResult } from "./types";

const BASE = "https://api.crossref.org/works";
const MAILTO = "apakahbenar@ryznrouter.dev";

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
    const params = new URLSearchParams({
      query,
      rows: String(Math.min(limit, 50)),
      sort: "relevance",
      order: "desc",
      mailto: MAILTO,
    });
    if (yearFrom) params.set("filter", `from-pub-date:${yearFrom}-01-01`);
    if (yearTo) params.set("filter", params.get("filter") ? `${params.get("filter")},until-pub-date:${yearTo}-12-31` : `until-pub-date:${yearTo}-12-31`);

    const res = await fetch(`${BASE}?${params}`, {
      signal: controller.signal,
      headers: { "User-Agent": `ScrapJurnal/1.0 (mailto:${MAILTO})` },
    });
    if (!res.ok) throw new Error(`Crossref ${res.status}`);

    const data = await res.json();
    const items = data.message?.items || [];
    const papers: Paper[] = items.map((w: any) => {
      const year = w.published?.dateParts?.[0]?.[0] || w.created?.dateParts?.[0]?.[0] || 0;
      if (yearFrom && year < yearFrom) return null;
      if (yearTo && year > yearTo) return null;
      if (minCited && (w.isReferencedByCount || 0) < minCited) return null;

      return {
        title: w.title?.[0] || "Untitled",
        authors: (w.author || []).map((a: any) => `${a.given || ""} ${a.family || ""}`.trim() || "Unknown"),
        year,
        journal: w.containerTitle?.[0] || w["container-title"]?.[0] || "N/A",
        doi: w.DOI || null,
        cited: w.isReferencedByCount || 0,
        // Take first usable URL
        url: w.DOI ? `https://doi.org/${w.DOI}` : (w.url || ""),
        source: "Crossref",
        abstract: w.abstract || null,
      };
    }).filter(Boolean) as Paper[];

    return { papers, total: papers.length };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { papers: [], total: 0, error: "Crossref timeout" };
    }
    return { papers: [], total: 0, error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}
