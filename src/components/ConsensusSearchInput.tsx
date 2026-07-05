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

            {/* Main Search Box with SVG Moving Border */}
            <div className="relative w-full bg-white rounded-[24px] border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex flex-col pt-4 pb-2 px-4 z-10">

                {/* SVG Animated Border Overlay (Dual Solid Trails) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-[24px]" style={{ margin: '-1.2px', width: 'calc(100% + 2.4px)', height: 'calc(100% + 2.4px)' }}>
                    <rect
                        x="0.6"
                        y="0.6"
                        width="calc(100% - 1.2px)"
                        height="calc(100% - 1.2px)"
                        rx="24"
                        ry="24"
                        fill="transparent"
                        stroke="#111827"
                        strokeWidth="1.3"
                        strokeDasharray="160 900"
                        className="animate-border-flow"
                    />
                </svg>

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

        </div>
     );
 };
export default ConsensusSearchInput;