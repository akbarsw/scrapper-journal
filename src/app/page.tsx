"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ConsensusSearchInput from "@/components/ConsensusSearchInput";
import ResultDisplay from "@/components/ResultDisplay";
import { Sidebar } from "@/components/Sidebar";
import { useAppStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { sidebarOpen, activeTab, loadLocalData, saveHistory, savedPapers, removePaper } = useAppStore();

  useEffect(() => {
    // Only load local data on the client to avoid hydration mismatch
    if (typeof window !== 'undefined') {
       loadLocalData();
    }
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setLoadingAuth(false);
      }
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push("/login");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [router, loadLocalData]);

  const handleSubmit = useCallback(async (formData: any) => {
    setLoading(true);
    setError(null);
    setResult(null);
    useAppStore.getState().setActiveTab('search');
    
    // Save to local history immediately
    const q = formData.vars || formData.query || "";
    if (q) saveHistory(q);

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
  }, [saveHistory]);

  if (loadingAuth) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans">
      <Sidebar user={user} />

      <main className={`flex-1 flex flex-col h-full overflow-y-auto relative bg-white transition-all duration-300`}>
        {/* Toggle Button (Always visible on Desktop when sidebar closed, or always on Mobile) */}
        {!sidebarOpen && (
           <button 
             onClick={() => useAppStore.getState().setSidebarOpen(true)}
             className="absolute top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 flex items-center justify-center transition-all"
           >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
           </button>
        )}

        {/* Gunakan justify-center kalo belum ada result, tapi pake justify-start (atas) lalu di-padding atasnya kalo udah ada result, supaya kotak pencarian nggak terbang ke atas */}
        <div className={`flex-1 w-full max-w-4xl mx-auto px-6 flex flex-col ${(!result && !loading && activeTab === 'search') ? 'justify-center pb-[10vh]' : 'justify-start pt-[5vh] md:pt-[10vh]'}`}>
          
          {/* Main Search View */}
          {activeTab === 'search' && (
            <>
              {!result && !loading && (
                 <div className="flex flex-col items-center mb-6 gap-3 mt-10">
                     <div className="flex items-center gap-2">
                         <div className="w-7 h-7 rounded bg-teal-600 flex items-center justify-center text-white font-serif font-bold text-lg leading-none">N</div>
                         <span className="text-xl font-bold tracking-tight text-gray-900">Nemu Jurnal</span>
                     </div>
                     <h1 className="text-[28px] font-medium tracking-tight text-gray-900">Tanya dan temukan jurnalmu disini</h1>
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
            </>
          )}

          {/* Library View */}
          {activeTab === 'library' && (
             <div className="w-full pt-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  My Library
                </h1>
                
                {savedPapers.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-gray-500 font-medium">Belum ada jurnal yang disimpan.</p>
                    <p className="text-gray-400 text-sm mt-1">Cari jurnal dan klik ikon bookmark untuk menyimpannya ke library.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedPapers.map((paper: any) => (
                      <div key={paper.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative group">
                        <button 
                           onClick={() => removePaper(paper.paper_id)}
                           className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                           title="Hapus dari Library"
                        >
                           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                        <h3 className="font-serif font-bold text-lg text-gray-900 pr-10">{paper.title}</h3>
                        {paper.abstract && (
                           <p className="text-gray-600 text-sm mt-2 line-clamp-3 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">{paper.abstract}</p>
                        )}
                        <div className="mt-4 flex items-center justify-between">
                           <span className="text-xs text-gray-400 font-medium">{new Date(paper.created_at).toLocaleDateString()}</span>
                           {paper.url && (
                             <a href={paper.url} target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-700 text-sm font-semibold flex items-center gap-1">
                               Buka Jurnal <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                             </a>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          )}

          {/* History View (Minimalist List) */}
          {activeTab === 'history' && (
             <div className="w-full pt-10">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Search History
                </h1>
                
                {useAppStore.getState().history.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-gray-500 font-medium">Belum ada riwayat pencarian.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {useAppStore.getState().history.map((item: any) => (
                      <button 
                        key={item.id} 
                        onClick={() => {
                          const queryObj = typeof item.query === 'string' ? JSON.parse(item.query) : item.query;
                          handleSubmit({ vars: queryObj.vars || queryObj.query || "" });
                        }}
                        className="w-full text-left bg-white p-4 rounded-xl border border-gray-200 hover:border-teal-500 hover:shadow-sm transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                          </div>
                          <span className="font-medium text-gray-900">
                            {typeof item.query === 'string' ? (JSON.parse(item.query).vars || JSON.parse(item.query).query) : (item.query?.vars || "Unknown query")}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                      </button>
                    ))}
                  </div>
                )}
             </div>
          )}

        </div>

        {!result && !loading && activeTab === 'search' && (
          <div className="absolute bottom-6 w-full text-center">
            <div className="w-6 h-[2px] bg-gray-200 mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm font-medium">The new standard for academic research</p>
          </div>
        )}
      </main>
    </div>
  );
}
