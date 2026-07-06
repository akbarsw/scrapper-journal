// Supabase helper — history + caching
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface HistoryEntry {
  user_id?: string;
  query: string;
  llm_query?: string;
  year_from?: number;
  year_to?: number;
  min_cited?: number;
  lang?: string;
  exclude?: string;
  scopus?: boolean;
  limit_count?: number;
  total_results: number;
  sources: { name: string; count: number; error?: string }[];
  time_ms: number;
}

export async function saveHistory(entry: HistoryEntry) {
  const { data, error } = await supabase.from("search_history").insert([entry]).select("id").single();
  if (error) {
    console.error("saveHistory error:", error.message);
    return null;
  }
  return data?.id;
}

export async function getHistory(limit = 10, userId?: string) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("search_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

export async function getCached(hash: string) {
  const { data, error } = await supabase
    .from("search_cache")
    .select("*")
    .eq("query_hash", hash)
    .single();

  if (error || !data) return null;

  // Check TTL
  const age = Date.now() - new Date(data.created_at).getTime();
  const ttl = (data.ttl_minutes || 60) * 60 * 1000;
  if (age > ttl) {
    await supabase.from("search_cache").delete().eq("query_hash", hash);
    return null;
  }

  return data.results;
}

export async function setCache(hash: string, results: any, ttl = 60) {
  const { error } = await supabase.from("search_cache").upsert(
    { query_hash: hash, results, ttl_minutes: ttl, created_at: new Date().toISOString() },
    { onConflict: "query_hash" }
  );
  if (error) console.error("setCache error:", error.message);
}

export function makeCacheHash(params: Record<string, any>): string {
  // Create deterministic hash from params
  const keys = Object.keys(params).sort();
  const str = keys.map((k) => `${k}=${params[k] ?? ""}`).join("&");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// Rate limit (per IP) using Supabase table
export async function checkRateLimit(ip: string, maxPerHour = 20): Promise<boolean> {
  try {
    const now = new Date();
    const { data, error } = await supabase
      .from("rate_limits")
      .select("*")
      .eq("ip", ip)
      .single();

    if (error || !data) {
      await supabase.from("rate_limits").upsert({
        ip,
        count: 1,
        window_start: now.toISOString(),
      });
      return true;
    }

    const windowStart = new Date(data.window_start);
    const timePassed = now.getTime() - windowStart.getTime();

    if (timePassed > 3600_000) {
      await supabase.from("rate_limits").upsert({
        ip,
        count: 1,
        window_start: now.toISOString(),
      });
      return true;
    }

    if (data.count >= maxPerHour) {
      return false;
    }

    await supabase.from("rate_limits").upsert({
      ip,
      count: data.count + 1,
      window_start: data.window_start,
    });

    return true;
  } catch (err) {
    console.error("checkRateLimit error:", err);
    return true;
  }
}

export async function saveFeedbackSnapshots(rows: any[]) {
  if (rows.length === 0) return;
  const { error } = await supabase.from("paper_feedback").insert(rows);
  if (error) console.error("saveFeedbackSnapshots error:", error.message);
}
