"use client";
import React, { useState } from "react";
import {
  Calendar, Quote, Lock, Globe2, Bookmark, BookmarkCheck, ExternalLink, Sparkles, Activity
} from "lucide-react";
import { useAppStore } from "@/lib/store";

/* ============================================================
   TOKENS — identitas sendiri (hijau tinta jurnal)
   ============================================================ */
const T = {
  paper: "#FAFAF8",
  surface: "#FFFFFF",
  ink: "#1C2321",
  inkSoft: "#666F6B",
  inkFaint: "#9A9F97",
  border: "#E5E3DB",
  accent: "#2F6F5E",
  accentSoft: "#E7F0EC",
  accentHover: "#265C4E",
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
  };
}

/* --- RESULT CARD COMPONENT --- */
function ResultCard({ paper }: { paper: any }) {
  const { savedPapers, savePaper, removePaper } = useAppStore();
  const isSaved = savedPapers.some(p => p.paper_id === (paper.id || paper.doi));
  
  // Dummy stance logic until LLM reranker is implemented
  const mockStance = paper._relevanceScore > 20 ? "yes" : (paper._relevanceScore > 10 ? "possibly" : "no");
  const stanceColor = { yes: T.yes, possibly: T.possibly, no: T.no }[mockStance as "yes" | "possibly" | "no"];

  const handleSaveToggle = () => {
    const id = paper.id || paper.doi;
    if (isSaved) {
      removePaper(id);
    } else {
      savePaper({
        id: id,
        title: paper.title,
        abstract: paper.abstract,
        url: paper.doi ? `https://doi.org/${paper.doi}` : ''
      });
    }
  };

  return (
    <div
      className="rounded-2xl p-5 transition-shadow hover:shadow-[0_4px_16px_rgba(28,35,33,0.06)] mb-3"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      {/* Badge row */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider"
          style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
        >
          {paper.source === "scopus" ? "Scopus" : (paper.source === "semantic-scholar" ? "SemanticScholar" : (paper.source === "openalex" ? "OpenAlex" : paper.source))}
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
        className="text-[15.5px] font-semibold leading-snug mb-2.5 cursor-pointer hover:underline"
        style={{ color: T.ink, fontFamily: "'Source Serif 4', Georgia, serif" }}
      >
        {paper.title}
      </h3>

      {/* Extracted abstract box */}
      {paper.abstract && (
         <div
           className="rounded-xl px-3.5 py-3 text-[13px] leading-relaxed mb-3 line-clamp-3"
           style={{ background: T.extractBg, color: "#3B3F3A" }}
         >
           {paper.abstract}
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
             {paper._aiVerified && <span className="text-xs text-blue-600 bg-blue-50 px-1 rounded ml-1">AI Verified</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSaveToggle} aria-label="Simpan">
            {isSaved
              ? <BookmarkCheck className="w-4 h-4 text-teal-600" />
              : <Bookmark className="w-4 h-4" style={{ color: T.inkFaint }} />}
          </button>
          {paper.doi && (
             <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer">
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
  if (!data) return null;

  return (
    <div className="space-y-4 font-sans" style={{ background: T.paper, padding: '16px', borderRadius: '16px' }}>
      
      {/* 1. STATUS HEADER */}
      <div className="flex items-center justify-between px-2 mb-4 bg-teal-50/50 p-4 rounded-xl border border-teal-100">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-700 shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
           </div>
           <div>
             <h3 className="font-bold text-[15px] text-gray-900 tracking-tight">Referensia Found {data.total} Results</h3>
             <p className="text-[12px] text-gray-500 mt-0.5">Found in {data.time / 1000}s from {data.sources.filter(s => s.count > 0).length} sources</p>
           </div>
         </div>
         <div className="flex gap-1.5 text-[11px] font-medium">
           {data.sources.map((s) => (
             <span key={s.name} className={`px-2.5 py-1 rounded-full border ${s.count > 0 ? 'bg-white border-teal-200 text-teal-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
               {s.name} ({s.count > 0 ? 'Id' : '0'})
             </span>
           ))}
         </div>
      </div>

      {/* 2. PAPERS LIST */}
      <div className="flex flex-col">
        {data.papers.map((p: any, i: number) => (
           <ResultCard key={p.doi || i} paper={p} />
        ))}
      </div>
    </div>
  );
}
