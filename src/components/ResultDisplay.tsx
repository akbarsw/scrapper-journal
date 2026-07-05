"use client";
import React, { useState } from "react";
import {
  Calendar, Quote, Lock, Globe2, Bookmark, BookmarkCheck, ExternalLink, Sparkles
} from "lucide-react";

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
  const [saved, setSaved] = useState(false);
  
  // Dummy stance logic until LLM reranker is implemented
  const mockStance = paper._relevanceScore > 20 ? "yes" : (paper._relevanceScore > 10 ? "possibly" : "no");
  const stanceColor = { yes: T.yes, possibly: T.possibly, no: T.no }[mockStance as "yes" | "possibly" | "no"];

  return (
    <div
      className="rounded-2xl p-5 transition-shadow hover:shadow-[0_4px_16px_rgba(28,35,33,0.06)] mb-3"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      {/* Badge row */}
      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium"
          style={{ background: T.accentSoft, color: T.accent }}
        >
          {paper.source}
        </span>
        <span className="inline-flex items-center gap-1 text-[10.5px]" style={{ color: T.inkFaint }}>
          <Calendar className="w-3 h-3" /> {paper.year}
        </span>
        <span className="inline-flex items-center gap-1 text-[10.5px]" style={{ color: T.inkFaint }}>
          {paper.doi ? <Globe2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {paper.doi ? "Available" : "Limited"}
        </span>
        {/*
        <span
          className="ml-auto w-2 h-2 rounded-full"
          style={{ background: stanceColor }}
          title={mockStance}
        />
        */}
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
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSaved((v) => !v)} aria-label="Simpan">
            {saved
              ? <BookmarkCheck className="w-4 h-4" style={{ color: T.accent }} />
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
      <div className="flex items-center justify-between px-2 mb-2">
         <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: T.accent }}>
              <Sparkles className="w-4 h-4 text-white" />
           </div>
           <div>
             <h3 className="font-semibold text-sm" style={{ color: T.ink }}>Referensia Found {data.total} Results</h3>
             <p className="text-[11px]" style={{ color: T.inkFaint }}>Found in {data.time / 1000}s from {data.sources.filter(s => s.count > 0).length} sources</p>
           </div>
         </div>
         <div className="flex gap-1 text-[10px]">
           {data.sources.map((s) => (
             <span key={s.name} className={`px-2 py-0.5 rounded-full border ${s.count > 0 ? 'bg-white border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
               {s.name}
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
