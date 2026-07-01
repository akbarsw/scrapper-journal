// Scopus API — requires institutional API key
// https://dev.elsevier.com/documentation/ScopusSearchAPI.wadl
import type { Paper, SourceResult } from "./types";

const BASE = "https://api.elsevier.com/content/search/scopus";
const API_KEY = "1295a56fe8f7348015503dd1fb9b1d75";

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
    // Build Scopus query syntax
    let scopusQuery = `TITLE-ABS-KEY(${query.replace(/[^a-zA-Z0-9\s_]/g, " ").split(",").map(s => `"${s.trim()}"`).join(" OR ")})`;
    if (yearFrom) scopusQuery += ` AND PUBYEAR > ${yearFrom - 1}`;
    if (yearTo) scopusQuery += ` AND PUBYEAR < ${yearTo + 1}`;

    const params = new URLSearchParams({
      query: scopusQuery,
      count: String(Math.min(limit, 25)),
      sort: "-citedby-count",
      view: "COMPLETE",
    });

    const res = await fetch(`${BASE}?${params}`, {
      signal: controller.signal,
      headers: {
        "X-ELS-APIKey": API_KEY,
        "X-ELS-ResourceVersion": "XOCS",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      // Scopus often returns 4xx for query errors, don't crash the whole request
      if (res.status === 429) throw new Error("Scopus rate limited");
      throw new Error(`Scopus ${res.status}`);
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
