import React from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabaseClient';

export const Sidebar = ({ user }: { user: any }) => {
  const { sidebarOpen, activeTab, setActiveTab, setSidebarOpen } = useAppStore();

  if (!sidebarOpen) return null;

  return (
    <>
       {/* Mobile Overlay */}
       <div 
         className="md:hidden fixed inset-0 bg-black/20 z-40"
         onClick={() => setSidebarOpen(false)}
       />
       
       <aside className="w-[240px] border-r border-gray-200 bg-[#FAFAFA] flex flex-col h-full shrink-0 fixed md:static z-50">
        <div className="p-4 flex items-center justify-between">
          <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center text-white font-serif font-bold text-xl leading-none">N</div>
          <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-200 rounded md:hidden">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-gray-200 rounded hidden md:block">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          </button>
        </div>
        
        <div className="px-3 py-2 space-y-1 flex-1">
          <button 
             onClick={() => { setActiveTab('search'); window.location.reload(); }}
             className="w-full flex items-center gap-3 px-3 py-2 text-[14px] font-semibold text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> New Thread
          </button>
          
          <button 
             onClick={() => setActiveTab('search')}
             className={`w-full flex items-center gap-3 px-3 py-2 text-[14px] rounded-lg transition-colors mt-2 ${activeTab === 'search' ? 'bg-gray-200 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Home
          </button>
          
          <button 
             onClick={() => setActiveTab('library')}
             className={`w-full flex items-center gap-3 px-3 py-2 text-[14px] rounded-lg transition-colors ${activeTab === 'library' ? 'bg-gray-200 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg> My Library
          </button>
          
          <button 
             onClick={() => setActiveTab('history')}
             className={`w-full flex items-center gap-3 px-3 py-2 text-[14px] rounded-lg transition-colors ${activeTab === 'history' ? 'bg-gray-200 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> History
          </button>

          <div className="mt-8 mb-2 px-3 text-xs font-semibold text-gray-400">Tools</div>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-[14px] font-semibold text-teal-700 rounded-lg bg-teal-50">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> Paper search
          </button>
        </div>

        <div className="p-4 border-t border-gray-200">
           <div className="flex items-center justify-between">
               <div className="flex items-center gap-3 cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-medium">
                     {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-sm font-medium text-gray-700">{user?.email?.split('@')[0] || 'User'}</span>
                  </div>
               </div>
               <button 
                 onClick={async () => { await supabase.auth.signOut(); window.location.href='/login'; }}
                 className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                 title="Logout"
               >
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
               </button>
           </div>
        </div>
      </aside>
    </>
  );
};