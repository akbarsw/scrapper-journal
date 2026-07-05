import React, { useState, useRef, useEffect } from "react";
import { Search, Plus, Filter, Mic, Sparkles, Activity, FileText, ArrowRight, Loader2, ChevronDown } from "lucide-react";
import { FilterSidebar } from "./FilterSidebar";

/* ============================================================
   TOKENS — Warna Spesifik Consensus
   ============================================================ */
const T = {
  surface: "#FFFFFF",
  bg: "#F9FAFB",
  ink: "#111827",
  inkSoft: "#6B7280",
  border: "#E5E7EB",
};

interface ConsensusSearchInputProps {
    onSendMessage: (data: any) => void;
    isLoading?: boolean;
}

export const ConsensusSearchInput: React.FC<ConsensusSearchInputProps> = ({ onSendMessage, isLoading }) => {
    const [message, setMessage] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    
    // State Filter ScrapJurnal
    const [yearFrom, setYearFrom] = useState<number | "">("");
    const [yearTo, setYearTo] = useState<number | "">("");
    const [limit, setLimit] = useState<number>(10);
    const [lang, setLang] = useState<string>("both");
    const [scopus, setScopus] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
        }
    }, [message]);

    const handleSend = () => {
        if (!message.trim()) return;
        onSendMessage({
            vars: message,
            yearFrom: yearFrom || undefined,
            yearTo: yearTo || undefined,
            limit: limit,
            minCited: 0,
            lang: lang,
            exclude: [],
            scopus: scopus
        });
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasContent = message.trim().length > 0;

    return (
        <div className="w-full max-w-[760px] mx-auto flex flex-col items-center">
            
            <FilterSidebar 
                isOpen={showFilters} 
                onClose={() => setShowFilters(false)}
                onApply={(filters) => {
                    setYearFrom(filters.yearFrom || "");
                    setYearTo(filters.yearTo || "");
                    setLimit(filters.limit);
                    setLang(filters.lang);
                    // OpenAccess and citations are prepared but handled later in engine
                }}
            />

            {/* Main Search Box */}
            <div className="w-full bg-white rounded-[24px] border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.06)] focus-within:border-gray-300 flex flex-col pt-4 pb-2 px-4 relative z-10">
                
                {/* Text Area */}
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask the research..."
                    disabled={isLoading}
                    className="w-full bg-transparent border-0 outline-none text-[16px] text-gray-900 placeholder:text-gray-400 resize-none overflow-hidden leading-relaxed mb-3 pl-2"
                    rows={1}
                    autoFocus
                />
                
                {/* Bottom Row Tools */}
                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-9 px-3 flex items-center gap-1.5 rounded-full text-[13px] font-medium transition-colors ml-1 border ${showFilters ? 'bg-gray-100 border-gray-200 text-gray-800' : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-100'}`}
                        >
                            <Filter className="w-4 h-4" /> Filter
                        </button>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!hasContent || isLoading}
                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all shrink-0 ${hasContent && !isLoading ? 'bg-[#3b82f6] text-white hover:bg-blue-600 shadow-sm' : 'bg-[#e0e7ff] text-[#93c5fd]'}`}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" strokeWidth={2.5} />}
                    </button>
                </div>
            </div>

            {/* Suggested Actions — hanya tampil saat belum ada input */}
            {!hasContent && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                <button
                  onClick={() => setMessage("Hubungan CSR dengan profitabilitas")}
                  className="h-8 px-4 rounded-full bg-white border border-gray-200 text-[12px] font-medium text-gray-600 flex items-center gap-1.5 hover:bg-gray-50 transition-all"
                >
                  <span className="text-gray-400 text-sm font-bold">TRY</span> <span className="text-gray-300">·</span> Hubungan CSR dengan profitabilitas ↑
                </button>
                <button
                  onClick={() => setMessage("Pengaruh E-WOM pada Gen Z")}
                  className="h-8 px-4 rounded-full bg-white border border-gray-200 text-[12px] font-medium text-gray-600 flex items-center gap-1.5 hover:bg-gray-50 transition-all"
                >
                  <span className="text-gray-400 text-sm font-bold">TRY</span> <span className="text-gray-300">·</span> Pengaruh E-WOM pada Gen Z ↑
                </button>
              </div>
            )}
        </div>
    );
};
export default ConsensusSearchInput;
