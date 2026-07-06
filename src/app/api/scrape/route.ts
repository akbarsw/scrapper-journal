import { searchAll } from "@/sources/engine";
import type { SearchParams } from "@/sources/engine";
import { supabase, getCached, setCache, makeCacheHash, checkRateLimit } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    // Rate limit
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
    if (!(await checkRateLimit(ip, 20))) {
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
      let feedbacks: Record<string, string> = {};
      const cachedSearchId = (cached as any).searchId;
      if (cachedSearchId) {
        const { data: fbData } = await supabase
          .from("paper_feedback")
          .select("paper_doi, feedback")
          .eq("search_id", cachedSearchId);
        if (fbData) {
          fbData.forEach(row => {
            if (row.paper_doi && row.feedback) {
              feedbacks[row.paper_doi] = row.feedback;
            }
          });
        }
      }
      
      const cachedPapers = (cached as any).papers || [];
      const paperDois = cachedPapers.map((p: any, i: number) => p.doi || `local_${i}`).filter(Boolean);
      let globalVotes: Record<string, { up: number, down: number }> = {};
      if (paperDois.length > 0) {
        const { data: voteData } = await supabase
          .from("paper_feedback")
          .select("paper_doi, feedback")
          .in("paper_doi", paperDois)
          .in("feedback", ["up", "down"]);
        if (voteData) {
          paperDois.forEach((doi: string) => {
            globalVotes[doi] = { up: 0, down: 0 };
          });
          voteData.forEach(row => {
            if (row.paper_doi && row.feedback) {
              if (!globalVotes[row.paper_doi]) {
                globalVotes[row.paper_doi] = { up: 0, down: 0 };
              }
              if (row.feedback === "up") globalVotes[row.paper_doi].up++;
              if (row.feedback === "down") globalVotes[row.paper_doi].down++;
            }
          });
        }
      }
      return Response.json({ 
        ...(cached as any), 
        cached: true, 
        limit: params.limit, 
        feedbacks,
        globalVotes 
      });
    }

    // Extract authorization user ID
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    let userId: string | undefined = undefined;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Execute search with userId passed
    const result = await searchAll(params, userId);

    // Save to cache (60 min TTL)
    await setCache(cacheKey, result, 60);

    // Fetch global votes for fresh results
    const freshPapers = result.papers || [];
    const paperDois = freshPapers.map((p, i) => p.doi || `local_${i}`).filter(Boolean);
    let globalVotes: Record<string, { up: number, down: number }> = {};
    if (paperDois.length > 0) {
      const { data: voteData } = await supabase
        .from("paper_feedback")
        .select("paper_doi, feedback")
        .in("paper_doi", paperDois)
        .in("feedback", ["up", "down"]);
      if (voteData) {
        paperDois.forEach((doi: string) => {
          globalVotes[doi] = { up: 0, down: 0 };
        });
        voteData.forEach(row => {
          if (row.paper_doi && row.feedback) {
            if (!globalVotes[row.paper_doi]) {
              globalVotes[row.paper_doi] = { up: 0, down: 0 };
            }
            if (row.feedback === "up") globalVotes[row.paper_doi].up++;
            if (row.feedback === "down") globalVotes[row.paper_doi].down++;
          }
        });
      }
    }

    // DEBUG: Inject llm_query ke balikan JSON biar user bisa lihat di inspector jaringan
    const debugResult = { 
      ...result, 
      limit: params.limit,
      globalVotes,
      llm_query_used: (result as any).llmQuery || "kosong/fallback" 
    };
    
    return Response.json(debugResult);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
