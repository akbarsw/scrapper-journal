// Supabase helper — history + caching
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface HistoryEntry {
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
  const { error } = await supabase.from("search_history").insert([entry]);
  if (error) console.error("saveHistory error:", error.message);
}

export async function getHistory(limit = 10) {
  const { data, error } = await supabase
    .from("search_history")
    .select("*")
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

// Simple in-memory rate limit (per IP)
// Since Vercel serverless functions are stateless, we use Supabase for this too
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, maxPerHour = 20): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600_000 });
    return true;
  }

  if (entry.count >= maxPerHour) {
    return false;
  }

  entry.count++;
  return true;
}
