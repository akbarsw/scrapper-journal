import React, { useState, useRef, useEffect } from "react";
import { Search, Plus, Filter, Mic, Sparkles, Activity, FileText, ArrowRight, Loader2, ChevronDown } from "lucide-react";

/* ============================================================
   TOKENS — Warna Spesifik Consensus
   ============================================================ */
const T = {
  surface: "#FFFFFF",
  bg: "#F9FAFB", // Sangat light grey untuk luar sidebar
  ink: "#111827",
  inkSoft: "#6B7280",
  inkFaint: "#9CA3AF",
  border: "#E5E7EB",
  accentBlue: "#3B82F6", 
  accentTeal: "#14B8A6", 
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

    // Auto-resize textarea
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
        <div className="w-full max-w-[800px] mx-auto flex flex-col items-center">
            
            {/* Header / Logo Besar */}
            <div className="flex flex-col items-center mb-8 gap-3">
                <h1 className="text-4xl font-bold tracking-tight" style={{ color: T.ink }}>Research starts here.</h1>
            </div>

            {/* Main Search Box */}
            <div className="w-full bg-white rounded-3xl border shadow-[0_2px_15px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.08)] focus-within:border-gray-300 flex flex-col pt-4 pb-2 px-4 relative z-10" style={{ borderColor: T.border }}>
                
                {/* Filter Panel Dropdown (Absolute Positioning agar numpuk ke atas kalo dibuka) */}
                {showFilters && (
                    <div className="absolute bottom-full left-0 mb-4 w-full p-5 bg-white border border-gray-200 rounded-2xl shadow-lg animate-fade-in z-50">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Filter className="w-4 h-4" /> Advanced Filters
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
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
                                    <option value="both">Both (All)</option>
                                    <option value="id">Indonesian Only</option>
                                    <option value="en">English Only</option>
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
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                            <input type="checkbox" id="scopus" checked={scopus} onChange={(e) => setScopus(e.target.checked)} className="w-4 h-4 text-teal-500 rounded border-gray-300" />
                            <label htmlFor="scopus" className="text-sm text-gray-600 cursor-pointer select-none">Include Scopus Search (Slower)</label>
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
                    className="w-full bg-transparent border-0 outline-none text-[17px] text-gray-900 placeholder:text-gray-400 resize-none overflow-hidden leading-relaxed mb-3 pl-2"
                    rows={1}
                    autoFocus
                />
                
                {/* Bottom Row Tools */}
                <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-9 px-3 flex items-center gap-1.5 rounded-full text-sm font-medium transition-colors ml-1 border ${showFilters ? 'bg-gray-100 border-gray-200 text-gray-800' : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Filter className="w-4 h-4" /> Filter
                        </button>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!hasContent || isLoading}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all shrink-0 ${hasContent && !isLoading ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg' : 'bg-blue-100 text-blue-300'}`}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Suggested Actions (Pills) */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button className="h-9 px-4 rounded-full bg-white border border-gray-200 text-[13px] font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50 shadow-sm transition-all">
                    <Sparkles className="w-4 h-4 text-gray-500" /> Find studies by method
                </button>
                <button className="h-9 px-4 rounded-full bg-white border border-gray-200 text-[13px] font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50 shadow-sm transition-all">
                    <Sparkles className="w-4 h-4 text-blue-500" /> Run a Deep review
                </button>
                <button className="h-9 px-4 rounded-full bg-white border border-gray-200 text-[13px] font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50 shadow-sm transition-all">
                    <Activity className="w-4 h-4 text-gray-500" /> How research has evolved
                </button>
            </div>
        </div>
    );
};
export default ConsensusSearchInput;
