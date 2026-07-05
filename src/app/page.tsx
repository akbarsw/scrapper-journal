"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ConsensusSearchInput from "@/components/ConsensusSearchInput";
import ResultDisplay from "@/components/ResultDisplay";

export default function Home() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setLoadingAuth(false);
      }
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push("/login");
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loadingAuth) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans">
      <aside className="w-[240px] border-r border-gray-200 bg-[#FAFAFA] flex flex-col h-full shrink-0 hidden md:flex">
        <div className="p-4 flex items-center justify-between">
          <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center text-white font-serif font-bold text-xl leading-none">N</div>
          <button className="p-1 hover:bg-gray-200 rounded"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg></button>
        </div>
        
        <div className="px-3 py-2 space-y-1 flex-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-[14px] font-semibold text-gray-900 rounded-lg hover:bg-gray-200 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> New Thread
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-[14px] text-gray-600 rounded-lg hover:bg-gray-200 transition-colors mt-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Home
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-[14px] text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> My Library
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-[14px] text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> History
          </button>

          <div className="mt-8 mb-2 px-3 text-xs font-semibold text-gray-400">Tools</div>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-[14px] font-semibold text-gray-900 rounded-lg bg-gray-200/60">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Paper search
          </button>
        </div>

        <div className="p-4 border-t border-gray-200">
           <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-medium">U</div>
              <span className="text-sm font-medium text-gray-700">User</span>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-y-auto relative bg-white">
        <div className="flex-1 w-full max-w-4xl mx-auto px-6 flex flex-col justify-center pb-[10vh]">
          
          {!result && !loading && (
             <div className="flex flex-col items-center mb-6 gap-3">
                 <div className="flex items-center gap-2">
                     <div className="w-7 h-7 rounded bg-teal-600 flex items-center justify-center text-white font-serif font-bold text-lg leading-none">N</div>
                     <span className="text-xl font-bold tracking-tight text-gray-900">Nemu Jurnal</span>
                 </div>
                 <h1 className="text-[28px] font-medium tracking-tight text-gray-900">Research starts here</h1>
             </div>
          )}

          <div className="w-full z-10 relative">
             <ConsensusSearchInput onSendMessage={handleSubmit} isLoading={loading} />
          </div>

          <div className="w-full mt-8">
              {loading && (
                <div className="text-center py-12 space-y-4">
                  <div className="inline-block w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500 text-sm">Scanning databases...</p>
                </div>
              )}
              {result && <ResultDisplay data={result} />}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <p className="text-red-600 text-sm">❌ {error}</p>
                </div>
              )}
          </div>
        </div>

        {!result && !loading && (
          <div className="absolute bottom-6 w-full text-center">
            <div className="w-6 h-[2px] bg-gray-200 mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm font-medium">The new standard for academic research</p>
          </div>
        )}
      </main>
    </div>
  );
}
