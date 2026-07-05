"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import ConsensusSearchInput from "@/components/ConsensusSearchInput";
import ResultDisplay from "@/components/ResultDisplay";
import History from "@/components/History";

type JobStatus = "idle" | "pending" | "running" | "done" | "failed";

export default function Home() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Authentication Guard (Layer Auth)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Kalau belum login, lempar ke halaman login
        router.push("/login");
      } else {
        setLoadingAuth(false);
      }
    };

    checkAuth();

    // Dengerin kalau user tiba-tiba logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSubmit = useCallback(async (formData: any) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResult(data);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tampilkan layar putih/loading sebentar pas ngecek login
  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><span className="animate-pulse text-gray-500">Checking authentication...</span></div>;
  }

  return (
    <>
      <main className="flex-1 w-full mx-auto px-4 py-20 font-sans bg-white min-h-screen">
        
        {/* Chat Input UI Consensus Style */}
        <div className="mb-12">
            <ConsensusSearchInput onSendMessage={handleSubmit} isLoading={loading} />
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
            {loading && (
              <div className="text-center py-12 space-y-4">
                <div className="inline-block w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-600 text-lg">AI is extracting intent & scanning 4 databases...</p>
                <p className="text-zinc-400 text-sm">Takes ±5-12 seconds</p>
              </div>
            )}
            
            {result && <ResultDisplay data={result} />}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center shadow-sm">
                <p className="text-red-600 font-medium">❌ {error}</p>
              </div>
            )}
        </div>
      </main>
    </>
  );
}
