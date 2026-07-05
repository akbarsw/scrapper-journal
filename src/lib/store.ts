import { create } from 'zustand'
import { supabase } from './supabaseClient'

interface SearchHistory {
  id: string
  query: string
  created_at: string
}

interface SavedPaper {
  id: string
  paper_id: string
  title: string
  abstract: string
  url: string
  created_at: string
}

interface AppState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  activeTab: 'search' | 'library' | 'history'
  setActiveTab: (tab: 'search' | 'library' | 'history') => void

  savedPapers: SavedPaper[]
  history: SearchHistory[]
  
  fetchHistory: (userId: string) => Promise<void>
  fetchSavedPapers: (userId: string) => Promise<void>
  savePaper: (userId: string, paper: any) => Promise<void>
  removePaper: (userId: string, paperId: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  activeTab: 'search',
  setActiveTab: (tab) => set({ activeTab: tab }),

  savedPapers: [],
  history: [],

  fetchHistory: async (userId) => {
    try {
      const { data } = await supabase
        .from('HistoryEntry')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) set({ history: data as any })
    } catch (e) {
      console.error('Failed to fetch history', e)
    }
  },

  fetchSavedPapers: async (userId) => {
    try {
      const { data } = await supabase
        .from('SavedPapers')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) set({ savedPapers: data })
    } catch (e) {
      console.error('Failed to fetch saved papers', e)
    }
  },

  savePaper: async (userId, paper) => {
    try {
      const newPaper = {
        user_id: userId,
        paper_id: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        url: paper.url || paper.doi || '',
      }
      const { data, error } = await supabase.from('SavedPapers').insert([newPaper]).select()
      if (data && !error) {
        set((state) => ({ savedPapers: [data[0], ...state.savedPapers] }))
      }
    } catch (e) {
      console.error('Failed to save paper', e)
    }
  },

  removePaper: async (userId, paperId) => {
    try {
      await supabase.from('SavedPapers').delete().match({ user_id: userId, paper_id: paperId })
      set((state) => ({ savedPapers: state.savedPapers.filter(p => p.paper_id !== paperId) }))
    } catch (e) {
      console.error('Failed to remove paper', e)
    }
  }
}))
