"use client";
import React, { useState } from "react";
import {
  Calendar, Quote, Lock, Globe2, Bookmark, BookmarkCheck, ExternalLink, Sparkles, ChevronDown
} from "lucide-react";
import { useAppStore } from "@/lib/store";

const T = {
  paper: "#FAFAF8",
  surface: "#FFFFFF",
  ink: "#1C2321",
  inkSoft: "#666F6B",
  inkFaint: "#9A9F97",
  border: "#E5E3DB",
  accent: "#2F6F5E",
  accentSoft: "#E7F0EC",
  yes: "#2F7D5A",
  possibly: "#B8862E",
  no: "#B0503F",
  extractBg: "#F3F2ED",
};

interface Props {
  data: {
    papers: any[];
    total: number;
    sources: { name: string; count: number; error?: string }[];
    time: number;
    llmQuery?: string;
    limit?: number;
    searchId?: string;
    feedbacks?: Record<string, "up" | "down">;
  };
}

/* --- RESULT CARD --- */
function ResultCard({ 
  paper, 
  searchId, 
  fallbackId,
  feedbacks 
}: { 
  paper: any; 
  searchId?: string; 
  fallbackId: string;
  feedbacks?: Record<string, "up" | "down">;
}) {
  const [showAbstract, setShowAbstract] = useState(false);
  
  const votes = useAppStore((state) => state.votes);
  const setVoteStore = useAppStore((state) => state.setVote);
  
  const paperKey = paper.doi || fallbackId;
  const storeVote = votes[`${searchId}_${paperKey}`];
  const dbVote = feedbacks?.[paperKey];
  const vote = storeVote !== undefined ? storeVote : (dbVote || null);
  const { savedPapers, savePaper, removePaper } = useAppStore();
  const isSaved = savedPapers.some(p => p.paper_id === (paper.id || paper.doi));

  const handleSaveToggle = () => {
    const id = paper.id || paper.doi;
    if (isSaved) {
      removePaper(id);
    } else {
      savePaper({
        id,
        title: paper.title,
        abstract: paper.abstract,
        url: paper.doi ? `https://doi.org/${paper.doi}` : ""
      });
    }
  };

  const handleFeedback = async (type: "up" | "down") => {
    if (!searchId) return;
    setVoteStore(`${searchId}_${paperKey}`, type);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchId,
          paperDoi: paper.doi || fallbackId,
          feedback: type,
        }),
      });
      if (!res.ok) {
        setVoteStore(`${searchId}_${paperKey}`, null);
      }
    } catch {
      setVoteStore(`${searchId}_${paperKey}`, null);
    }
  };

  const sourceLabel =
    paper.source === "scopus" ? "Scopus"
    : paper.source === "semantic-scholar" ? "SemanticScholar"
    : paper.source === "openalex" ? "OpenAlex"
    : paper.source;

  return (
    <div
      className="rounded-2xl p-5 mb-3 transition-shadow hover:shadow-[0_4px_16px_rgba(28,35,33,0.07)] font-sans"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      {/* Badge row */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
          {sourceLabel}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: T.inkSoft }}>
          <Calendar className="w-3.5 h-3.5" /> {paper.year}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: T.inkSoft }}>
          {paper.doi ? <Globe2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          {paper.doi ? "Available" : "Limited"}
        </span>
      </div>

      {/* Title */}
      <h3
        className="text-[15.5px] font-serif font-semibold leading-snug mb-3"
        style={{ color: T.ink }}
      >
        {paper.title}
      </h3>

      {/* Abstract toggle — hanya muncul kalau ada abstrak */}
      {paper.abstract && (
        <div className="mb-3">
          <button
            onClick={() => setShowAbstract(v => !v)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full border transition-all cursor-pointer"
            style={{
              borderColor: showAbstract ? T.accent : T.border,
              color: showAbstract ? T.accent : T.inkSoft,
              background: showAbstract ? T.accentSoft : "transparent"
            }}
          >
            Abstrak
            <ChevronDown
              className="w-3.5 h-3.5 transition-transform duration-200"
              style={{ transform: showAbstract ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {showAbstract && (
            <div
              className="mt-2 rounded-xl px-3.5 py-3 text-[13px] leading-relaxed"
              style={{ background: T.extractBg, color: "#3B3F3A" }}
            >
              {paper.abstract}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[12px]" style={{ color: T.inkSoft }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="italic line-clamp-1 max-w-[200px]">{paper.journal || "Unknown Journal"}</span>
          <span className="inline-flex items-center gap-1">
            <Quote className="w-3 h-3" /> {paper.cited} sitasi
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="font-semibold text-xs text-green-700">+{paper._relevanceScore} score</span>
            {paper._aiVerified && (
              <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1">AI Verified</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {searchId && (
            <div className="flex items-center gap-1.5 mr-2 border-r pr-2 border-gray-200">
              <button 
                onClick={() => handleFeedback("up")} 
                title="Bermanfaat"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                  vote === "up" 
                    ? "bg-green-50 text-green-600 border border-green-200" 
                    : "hover:bg-gray-50 text-gray-400 hover:text-gray-600"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                </svg>
              </button>
              <button 
                onClick={() => handleFeedback("down")} 
                title="Kurang relevan"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
                  vote === "down" 
                    ? "bg-red-50 text-red-500 border border-red-200" 
                    : "hover:bg-gray-50 text-gray-400 hover:text-red-400"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm8-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                </svg>
              </button>
            </div>
          )}
          <button onClick={handleSaveToggle} aria-label="Simpan" className="cursor-pointer">
            {isSaved
              ? <BookmarkCheck className="w-4 h-4 text-teal-600" />
              : <Bookmark className="w-4 h-4" style={{ color: T.inkFaint }} />}
          </button>
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer" className="cursor-pointer">
              <ExternalLink className="w-4 h-4" style={{ color: T.inkFaint }} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* --- MAIN RENDER --- */
export default function ResultDisplay({ data }: Props) {
  const [activeSourceFilter, setActiveSourceFilter] = useState<string | null>(null);

  if (!data) return null;

  // Filter papers based on clicked source pill
  const filteredPapers = activeSourceFilter
    ? data.papers.filter((p: any) => {
        if (p.sourceKey) {
          return p.sourceKey === activeSourceFilter;
        }
        // Fallback for cached results
        const filterLower = activeSourceFilter.toLowerCase();
        const paperSourceLower = (p.source || "").toLowerCase();
        if (filterLower.includes("scopus") && paperSourceLower === "scopus") return true;
        if (filterLower.includes("openalex") && paperSourceLower === "openalex") return true;
        if (filterLower.includes("semanticscholar") && paperSourceLower === "semantic-scholar") return true;
        if (filterLower.includes("semantic-scholar") && paperSourceLower === "semantic-scholar") return true;
        return false;
      })
    : data.papers.slice(0, data.limit || 20); // Default to top ranked papers based on limit

  return (
    <div className="font-sans">
      {/* STATUS HEADER */}
      <div className="flex items-center justify-between px-3 py-3 mb-3 bg-teal-50/60 rounded-xl border border-teal-100 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-teal-700">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[14px] text-gray-900 tracking-tight">Ditemukan {data.total} Jurnal</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {data.time / 1000}s · {data.sources.filter(s => s.count > 0).length} sumber
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {data.sources.map((s) => {
            const isActive = activeSourceFilter === s.name;
            return (
              <button
                key={s.name}
                disabled={s.count === 0}
                onClick={() => setActiveSourceFilter(isActive ? null : s.name)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium transition-all ${
                  s.count > 0
                    ? isActive
                      ? "bg-teal-700 border-teal-700 text-white shadow-sm font-semibold cursor-pointer transform scale-105"
                      : "bg-white border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300 cursor-pointer active:scale-95"
                    : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
                title={s.count > 0 ? `Filter hanya tampilkan ${s.name}` : "Tidak ada hasil dari sumber ini"}
              >
                {s.name} {s.count > 0 ? `(${s.count})` : "(0)"}
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER STATUS MESSAGE */}
      {activeSourceFilter && (
        <div className="flex items-center justify-between px-3 py-2 mb-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 transition-all">
          <span>Menampilkan <strong>{filteredPapers.length}</strong> jurnal dari <strong>{activeSourceFilter}</strong></span>
          <button 
            onClick={() => setActiveSourceFilter(null)}
            className="text-teal-600 hover:text-teal-700 font-semibold cursor-pointer transition-colors"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* PAPERS LIST */}
      <div className="flex flex-col">
        {filteredPapers.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 text-gray-400 text-sm">
            Tidak ada jurnal yang sesuai dengan filter ini.
          </div>
        ) : (
          filteredPapers.map((p: any, i: number) => {
            const originalIndex = data.papers.findIndex(
              (x: any) => (x.doi && x.doi === p.doi) || x.title === p.title
            );
            const fallbackId = `local_${originalIndex !== -1 ? originalIndex : i}`;
            return (
              <ResultCard 
                key={p.doi || `${p.title}_${i}`} 
                paper={p} 
                searchId={data.searchId} 
                fallbackId={fallbackId} 
                feedbacks={data.feedbacks}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
