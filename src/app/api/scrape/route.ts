import { searchAll } from "@/sources/engine";
import type { SearchParams } from "@/sources/engine";
import { saveHistory, getCached, setCache, makeCacheHash, checkRateLimit } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    // Rate limit
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    if (!checkRateLimit(ip, 20)) {
      return Response.json({ error: "Rate limit: maksimal 20 pencarian per jam" }, { status: 429 });
    }

    const body = await request.json();
    const params: SearchParams = {
      vars: body.vars || "",
      yearFrom: body.yearFrom || body.year || undefined,
      yearTo: body.yearTo || undefined,
      minCited: body.min_cited ?? body.minCited ?? 0,
      limit: body.limit || 20,
      lang: body.lang || "both",
      exclude: body.exclude || undefined,
      scopus: body.scopus ?? true,
      sources: body.sources || undefined,
    };

    if (!params.vars.trim()) {
      return Response.json({ error: "Variabel penelitian wajib diisi" }, { status: 400 });
    }

    // Check cache
    const cacheKey = makeCacheHash(params);
    const cached = await getCached(cacheKey);
    if (cached) {
      return Response.json({ ...(cached as any), cached: true });
    }

    // Execute search
    const result = await searchAll(params);

    // Save to cache (60 min TTL)
    await setCache(cacheKey, result, 60);

    // Save history to Supabase
    try {
      await saveHistory({
        query: params.vars,
        llm_query: (result as any).llmQuery || "",
        year_from: params.yearFrom,
        year_to: params.yearTo,
        min_cited: params.minCited,
        lang: params.lang,
        exclude: params.exclude,
        scopus: params.scopus,
        limit_count: params.limit,
        total_results: result.total,
        sources: result.sources,
        time_ms: result.time,
      });
    } catch {
      // Non-blocking — history save failure won't crash response
    }

    // DEBUG: Inject llm_query ke balikan JSON biar user bisa lihat di inspector jaringan
    const debugResult = { ...result, llm_query_used: (result as any).llmQuery || "kosong/fallback" };
    
    return Response.json(debugResult);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
