"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import ClaudeChatInput from "@/components/ClaudeChatInput";
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
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 space-y-8 font-sans">
        
        {/* Chat Input UI Baru */}
        <ClaudeChatInput onSendMessage={handleSubmit} isLoading={loading} />

        {loading && (
          <div className="text-center py-12 space-y-4">
            <div className="inline-block w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-600 text-lg">AI is extracting intent & scanning 4 databases...</p>
            <p className="text-zinc-400 text-sm">Takes ±5-12 seconds</p>
          </div>
        )}
        {result && <ResultDisplay data={result} />}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium">❌ {error}</p>
          </div>
        )}
        {!loading && !result && !error && (
           <div className="bg-white border rounded-xl p-6 shadow-sm">
             <h3 className="text-sm font-semibold text-gray-500 mb-4 border-b pb-2">Recent Searches</h3>
             <History refreshKey={refreshKey} />
           </div>
        )}
      </main>
      <footer className="text-center py-6 text-zinc-400 text-sm border-t">
        ScrapJurnal AI v3.0 &mdash; Intelligent Academic Discovery
      </footer>
    </>
  );
}
