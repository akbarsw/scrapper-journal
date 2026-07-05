import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus, ChevronDown, ArrowUp, X, FileText, Loader2, Check, Archive, Settings2 } from "lucide-react";

/* --- ICONS --- */
export const Icons = {
    Logo: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="presentation" {...props}>
            <defs>
                <ellipse id="petal-pair" cx="100" cy="100" rx="90" ry="22" />
            </defs>
            <g fill="#D46B4F" fillRule="evenodd">
                <use href="#petal-pair" transform="rotate(0 100 100)" />
                <use href="#petal-pair" transform="rotate(45 100 100)" />
                <use href="#petal-pair" transform="rotate(90 100 100)" />
                <use href="#petal-pair" transform="rotate(135 100 100)" />
            </g>
        </svg>
    ),
    Plus: Plus,
    Settings2: Settings2, // Buat icon filter
    Thinking: (props: React.SVGProps<SVGSVGElement>) => <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}><path d="M10.3857 2.50977C14.3486 2.71054 17.5 5.98724 17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 9.72386 2.72386 9.5 3 9.5C3.27614 9.5 3.5 9.72386 3.5 10C3.5 13.5899 6.41015 16.5 10 16.5C13.5899 16.5 16.5 13.5899 16.5 10C16.5 6.5225 13.7691 3.68312 10.335 3.50879L10 3.5L9.89941 3.49023C9.67145 3.44371 9.5 3.24171 9.5 3C9.5 2.72386 9.72386 2.5 10 2.5L10.3857 2.50977ZM10 5.5C10.2761 5.5 10.5 5.72386 10.5 6V9.69043L13.2236 11.0527C13.4706 11.1762 13.5708 11.4766 13.4473 11.7236C13.3392 11.9397 13.0957 12.0435 12.8711 11.9834L12.7764 11.9473L9.77637 10.4473C9.60698 10.3626 9.5 10.1894 9.5 10V6C9.5 5.72386 9.72386 5.5 10 5.5ZM3.66211 6.94141C4.0273 6.94159 4.32303 7.23735 4.32324 7.60254C4.32324 7.96791 4.02743 8.26446 3.66211 8.26465C3.29663 8.26465 3 7.96802 3 7.60254C3.00021 7.23723 3.29676 6.94141 3.66211 6.94141ZM4.95605 4.29395C5.32146 4.29404 5.61719 4.59063 5.61719 4.95605C5.6171 5.3214 5.3214 5.61709 4.95605 5.61719C4.59063 5.61719 4.29403 5.32146 4.29395 4.95605C4.29395 4.59057 4.59057 4.29395 4.95605 4.29395ZM7.60254 3C7.96802 3 8.26465 3.29663 8.26465 3.66211C8.26446 4.02743 7.96791 4.32324 7.60254 4.32324C7.23736 4.32302 6.94159 4.0273 6.94141 3.66211C6.94141 3.29676 7.23724 3.00022 7.60254 3Z"></path></svg>,
    SelectArrow: ChevronDown,
    ArrowUp: ArrowUp,
    X: X,
    FileText: FileText,
    Loader2: Loader2,
    Check: Check,
    Archive: Archive,
};

/* --- UTILS --- */
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

interface AttachedFile {
    id: string;
    file: File;
    type: string;
    preview: string | null;
    uploadStatus: string;
    content?: string;
}

interface ClaudeChatInputProps {
    onSendMessage: (data: any) => void;
    isLoading?: boolean;
}

export const ClaudeChatInput: React.FC<ClaudeChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [message, setMessage] = useState("");
    const [isThinkingEnabled, setIsThinkingEnabled] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    
    // State Filter ScrapJurnal aslinya
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
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 384) + "px";
        }
    }, [message]);

    const handleSend = () => {
        if (!message.trim()) return;
        
        // Panggil fungsi submit dengan struktur data yang cocok buat mesin ScrapJurnal lu
        onSendMessage({
            vars: message,
            yearFrom: yearFrom || undefined,
            yearTo: yearTo || undefined,
            limit: limit,
            minCited: 0,
            lang: lang,
            exclude: [], // Biarkan kosong kalau belum dibikin UI inputnya
            scopus: scopus
        });
        
        // Sengaja nggak ngehapus chat message biar user gampang edit
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
        <div className="relative w-full max-w-3xl mx-auto transition-all duration-300 font-sans">
            {/* Filter Panel (Animasi dari atas ke bawah) */}
            {showFilters && (
                <div className="mb-4 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm animate-fade-in transition-all">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Icons.Settings2 className="w-4 h-4" /> Search Filters
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Year From</label>
                            <input 
                                type="number" 
                                value={yearFrom} 
                                onChange={e => setYearFrom(e.target.value ? Number(e.target.value) : "")}
                                placeholder="2010" 
                                className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" 
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Year To</label>
                            <input 
                                type="number" 
                                value={yearTo} 
                                onChange={e => setYearTo(e.target.value ? Number(e.target.value) : "")}
                                placeholder="2024" 
                                className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" 
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Language</label>
                            <select 
                                value={lang} 
                                onChange={e => setLang(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                                <option value="both">Both (All)</option>
                                <option value="id">Indonesian Only</option>
                                <option value="en">English Only</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-gray-500">Max Results</label>
                            <select 
                                value={limit} 
                                onChange={e => setLimit(Number(e.target.value))}
                                className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                                <option value={10}>Top 10</option>
                                <option value={20}>Top 20</option>
                                <option value={50}>Top 50</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="scopus" 
                            checked={scopus} 
                            onChange={(e) => setScopus(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded" 
                        />
                        <label htmlFor="scopus" className="text-sm text-gray-600 cursor-pointer">Include Scopus (May be slow)</label>
                    </div>
                </div>
            )}

            {/* Main Chat Box */}
            <div className={`
                !box-content flex flex-col items-stretch transition-all duration-200 relative z-10 rounded-2xl cursor-text border border-gray-300 
                shadow-[0_0_15px_rgba(0,0,0,0.05)] hover:shadow-[0_0_20px_rgba(0,0,0,0.08)]
                focus-within:shadow-[0_0_25px_rgba(0,0,0,0.12)] focus-within:border-gray-400
                bg-white font-sans antialiased
            `}>
                <div className="flex flex-col px-4 pt-4 pb-2 gap-2">
                    
                    {/* Input Area */}
                    <div className="relative mb-2">
                        <div className="max-h-96 w-full overflow-y-auto custom-scrollbar font-sans break-words transition-opacity duration-200 min-h-[3rem] pl-1">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Cari jurnal skripsi..."
                                disabled={isLoading}
                                className="w-full bg-transparent border-0 outline-none text-gray-800 text-[16px] placeholder:text-gray-400 resize-none overflow-hidden py-0 leading-relaxed block font-normal antialiased"
                                rows={1}
                                autoFocus
                                style={{ minHeight: '1.5em' }}
                            />
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-2 w-full items-center">
                        {/* Left Tools (Filters) */}
                        <div className="relative flex-1 flex items-center shrink min-w-0 gap-1">
                            
                            {/* Toggle Filter Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center justify-center relative shrink-0 transition-colors duration-200 h-9 px-3 rounded-xl active:scale-95 text-sm font-medium ${showFilters ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                type="button"
                            >
                                <Icons.Settings2 className="w-4 h-4 mr-2" />
                                Filters
                            </button>
                        </div>

                        {/* Right Tools */}
                        <div className="flex flex-row items-center min-w-0 gap-2">
                            {/* Send Button */}
                            <div>
                                <button
                                    onClick={handleSend}
                                    disabled={!hasContent || isLoading}
                                    className={`
                                        inline-flex items-center justify-center relative shrink-0 transition-colors rounded-full active:scale-95 !h-10 !w-10
                                        ${hasContent && !isLoading
                                            ? 'bg-black text-white hover:bg-gray-800 shadow-md'
                                            : 'bg-gray-100 text-gray-400 cursor-default'}
                                    `}
                                    type="button"
                                >
                                    {isLoading ? (
                                        <Icons.Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Icons.ArrowUp className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center mt-4">
                <p className="text-xs text-gray-400">
                    ScrapJurnal AI extracts variables and hunts for academic papers across multiple databases.
                </p>
            </div>
        </div>
    );
};
export default ClaudeChatInput;
