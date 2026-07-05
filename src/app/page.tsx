"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ConsensusSearchInput from "@/components/ConsensusSearchInput";
import ResultDisplay from "@/components/ResultDisplay";
import { Sidebar } from "@/components/Sidebar";
import { useAppStore } from "@/lib/store";
import FAQ from "@/components/FAQ";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { sidebarOpen, activeTab, loadLocalData, saveHistory, savedPapers, removePaper } = useAppStore();

  // Cek session tapi JANGAN redirect. Simpan user kalau ada, null kalau tidak.
  useEffect(() => {
    if (typeof window !== "undefined") {
      loadLocalData();
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [loadLocalData]);

  const handleSubmit = useCallback(async (formData: any) => {
    // Kalau belum login, redirect ke login dulu
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    useAppStore.getState().setActiveTab("search");

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
  }, [saveHistory, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans">
      {/* Sidebar hanya tampil kalau sudah login */}
      {user && <Sidebar user={user} />}

      <main className="flex-1 flex flex-col h-full overflow-y-auto relative bg-white transition-all duration-300">
        {/* Toggle Sidebar — hanya untuk user yang sudah login & sidebar tertutup */}
        {user && !sidebarOpen && (
          <button
            onClick={() => useAppStore.getState().setSidebarOpen(true)}
            className="absolute top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 flex items-center justify-center transition-all"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}

        {/* Top-right login/logout button untuk guest */}
        {!user && (
          <div className="absolute top-5 right-6 z-50">
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-all"
            >
              Masuk
            </button>
          </div>
        )}

        {/* Wrapper utama — search box SELALU di tengah vertikal, result scroll di bawahnya */}
        <div className="flex-1 w-full max-w-4xl mx-auto px-6 flex flex-col">

          {/* Main Search View */}
          {activeTab === "search" && (
            <>
              {/* Area tengah — search box + header, patokan Claude AI */}
              <div className={`flex flex-col items-center w-full ${!result && !loading ? 'mt-[28vh]' : 'pt-8'}`}>
                {/* Header — hilang setelah ada result */}
                {!result && !loading && (
                  <div className="flex flex-col items-center mb-6 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-teal-600 flex items-center justify-center text-white font-serif font-bold text-lg leading-none">N</div>
                      <span className="text-xl font-bold tracking-tight text-gray-900">Nemu Jurnal</span>
                    </div>
                    <h1 className="text-[28px] font-medium tracking-tight text-gray-900">Tanya dan temukan jurnalmu disini</h1>
                  </div>
                )}

                {/* Search box — selalu ada */}
                <div className="w-full z-10 relative">
                  <ConsensusSearchInput onSendMessage={handleSubmit} isLoading={loading} />
                </div>

                {/* Claude-style suggestion pills — di ATAS tagline */}
                {!result && !loading && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                    <button className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      Tulis
                    </button>
                    <button className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                      Learn
                    </button>
                    <button className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                      Life stuff
                    </button>
                    <button 
                      onClick={() => { const el = document.getElementById('faq-section'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-gray-200 text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      FAQ
                    </button>
                  </div>
                )}

                {/* Tagline — di BAWAH pills */}
                {!result && !loading && (
                  <p className="text-sm text-gray-400 mt-4 text-center">
                    Connected with 200M+ Paper Research Database
                  </p>
                )}
              </div>

              {/* Area bawah — loading / result / FAQ muncul di sini, push ke bawah */}
              <div className="w-full pb-10 mt-8">
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
                {!result && !loading && !error && <FAQ />}
              </div>
            </>
          )}

          {/* Library View — hanya untuk user login */}
          {activeTab === "library" && (
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
                            Buka Jurnal
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History View */}
          {activeTab === "history" && (
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
                        let queryText = "";
                        try {
                          const queryObj = typeof item.query === "string" ? JSON.parse(item.query) : item.query;
                          queryText = queryObj.vars || queryObj.query || queryObj;
                        } catch (e) {
                          queryText = item.query;
                        }
                        handleSubmit({ vars: queryText });
                      }}
                      className="w-full text-left bg-white p-4 rounded-xl border border-gray-200 hover:border-teal-500 hover:shadow-sm transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <span className="font-medium text-gray-900">
                          {(() => {
                            try {
                              const obj = typeof item.query === "string" ? JSON.parse(item.query) : item.query;
                              return obj.vars || obj.query || item.query;
                            } catch (e) {
                              return item.query;
                            }
                          })()}
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

      </main>
    </div>
  );
}
