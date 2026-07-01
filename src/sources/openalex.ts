// OpenAlex API — free, no key required
// https://docs.openalex.org/
import type { Paper, SourceResult } from "./types";

const BASE = "https://api.openalex.org";
const EMAIL = process.env.OPENALEX_EMAIL || "apakahbenar@ryznrouter.dev";
const API_KEY = process.env.OPENALEX_API_KEY || "";

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
    const filter: string[] = [];
    if (yearFrom) filter.push(`from_publication_date:${yearFrom}-01-01`);
    if (yearTo) filter.push(`to_publication_date:${yearTo}-12-31`);
    if (minCited && minCited > 0) filter.push(`cited_by_count:>${minCited}`);

    const params = new URLSearchParams({
      search: query,
      per_page: String(Math.min(limit, 50)),
      sort: "cited_by_count:desc",
      mailto: EMAIL,
    });
    // Add API key if available to avoid rate limiting
    if (API_KEY) params.set("api_key", API_KEY);
    if (filter.length) params.set("filter", filter.join(","));

    const res = await fetch(`${BASE}/works?${params}`, {
      signal: controller.signal,
      headers: { "User-Agent": "ScrapJurnal/1.0 (mailto:apakahbenar@ryznrouter.dev)" },
    });
    if (!res.ok) throw new Error(`OpenAlex ${res.status}`);

    const data = await res.json();
    const papers: Paper[] = (data.results || []).map((w: any) => ({
      title: w.title || "Untitled",
      authors: (w.authorships || []).map((a: any) => a.author?.display_name || "Unknown"),
      year: w.publication_year || 0,
      journal: w.primary_location?.source?.display_name || w.primary_location?.source?.display_name || "N/A",
      doi: w.doi ? w.doi.replace("https://doi.org/", "") : null,
      cited: w.cited_by_count || 0,
      url: w.doi || w.id || "",
      source: "OpenAlex",
      abstract: w.abstract_inverted_index ? "Abstract available" : null,
    }));

    return { papers, total: papers.length };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { papers: [], total: 0, error: "OpenAlex timeout" };
    }
    return { papers: [], total: 0, error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}
