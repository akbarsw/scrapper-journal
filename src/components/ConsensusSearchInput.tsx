import React, { useState, useRef, useEffect } from "react";
import { Search, Plus, Filter, Mic, Sparkles, Activity, FileText, ArrowRight, Loader2, ChevronDown } from "lucide-react";

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
            
            {/* Main Search Box */}
            <div className="w-full bg-white rounded-[24px] border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] focus-within:shadow-[0_4px_16px_rgba(0,0,0,0.06)] focus-within:border-gray-300 flex flex-col pt-4 pb-2 px-4 relative z-10">
                
                {/* Filter Panel Dropdown (Absolute Positioning agar numpuk ke atas) */}
                {showFilters && (
                    <div className="absolute bottom-full left-0 mb-3 w-full p-5 bg-white border border-gray-200 rounded-[20px] shadow-lg animate-fade-in z-50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Filter className="w-4 h-4" /> Filters
                            </h3>
                            <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Year From</label>
                                <input type="number" value={yearFrom} onChange={e => setYearFrom(e.target.value ? Number(e.target.value) : "")} placeholder="e.g. 2018" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Year To</label>
                                <input type="number" value={yearTo} onChange={e => setYearTo(e.target.value ? Number(e.target.value) : "")} placeholder="e.g. 2024" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Language</label>
                                <select value={lang} onChange={e => setLang(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white cursor-pointer">
                                    <option value="both">All</option>
                                    <option value="id">Indonesian</option>
                                    <option value="en">English</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Results</label>
                                <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white cursor-pointer">
                                    <option value={10}>Top 10</option>
                                    <option value={20}>Top 20</option>
                                    <option value={50}>Top 50</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

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

            {/* Suggested Actions (Pills) */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                <button className="h-8 px-4 rounded-full bg-white border border-gray-200 text-[12px] font-medium text-gray-600 flex items-center gap-1.5 hover:bg-gray-50 transition-all">
                    <span className="text-gray-400 text-sm font-bold">TRY</span> <span className="text-gray-300">·</span> Hubungan CSR dengan profitabilitas ↑
                </button>
                <button className="h-8 px-4 rounded-full bg-white border border-gray-200 text-[12px] font-medium text-gray-600 flex items-center gap-1.5 hover:bg-gray-50 transition-all">
                    <span className="text-gray-400 text-sm font-bold">TRY</span> <span className="text-gray-300">·</span> Pengaruh E-WOM pada Gen Z ↑
                </button>
            </div>
        </div>
    );
};
export default ConsensusSearchInput;
