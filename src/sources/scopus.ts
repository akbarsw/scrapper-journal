// Scopus API — requires institutional API key
// https://dev.elsevier.com/documentation/ScopusSearchAPI.wjadl
import type { Paper, SourceResult } from "./types";

const BASE = "https://api.elsevier.com/content/search/scopus";
const API_KEY = process.env.SCOPUS_API_KEY || "1295a56fe8f7348015503dd1fb9b1d75";

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
    // Build Scopus query syntax — simple query, no year in API call
    let scopusQuery = query.split(",").map(s => `TITLE-ABS-KEY("${s.trim()}")`).join(" OR ");

    // Manual URL build — URLSearchParams causes 401 on Vercel
    const url = `${BASE}?query=${encodeURIComponent(scopusQuery)}&count=${Math.min(limit, 25)}&sort=-citedby-count`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "X-ELS-APIKey": API_KEY,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Scopus rate limited");
      const body = await res.text().catch(() => "");
      throw new Error(`Scopus ${res.status}: ${body.slice(0, 60)}`);
    }

    const data = await res.json();
    const entries = data?.["search-results"]?.entry || [];
    const papers: Paper[] = entries
      .filter((e: any) => e["prism:doi"] || e.doi)
      .map((e: any) => {
        const year = parseInt(e["prism:coverDate"]?.substring(0, 4)) || 0;
        const cited = parseInt(e["citedby-count"]) || 0;

        if (yearFrom && year < yearFrom) return null;
        if (yearTo && year > yearTo) return null;
        if (minCited && cited < minCited) return null;

        return {
          title: e["dc:title"] || "Untitled",
          authors: (e.author || []).map((a: any) => `${a["given-name"] || ""} ${a["surname"] || ""}`.trim() || "Unknown"),
          year,
          journal: e["prism:publicationName"] || e["prism:aggregationType"] || "N/A",
          doi: e["prism:doi"] || e.doi || null,
          cited,
          url: e["prism:url"] || `https://doi.org/${e["prism:doi"] || ""}`,
          source: "Scopus",
          abstract: e["dc:description"] || null,
        };
      })
      .filter(Boolean) as Paper[];

    return { papers, total: papers.length };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { papers: [], total: 0, error: "Scopus timeout" };
    }
    return { papers: [], total: 0, error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}
