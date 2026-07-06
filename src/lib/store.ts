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
  
  loadLocalData: () => Promise<void>
  saveHistory: (query: string) => void
  savePaper: (paper: any) => Promise<void>
  removePaper: (paperId: string) => Promise<void>
  votes: Record<string, 'up' | 'down' | null>
  setVote: (key: string, type: 'up' | 'down' | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  activeTab: 'search',
  setActiveTab: (tab) => set({ activeTab: tab }),

  savedPapers: [],
  history: [],

  loadLocalData: async () => {
    try {
      const hist = localStorage.getItem('nemu_jurnal_history')
      if (hist) set({ history: JSON.parse(hist) })
      
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data, error } = await supabase
          .from('saved_papers')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!error && data) {
          set({ savedPapers: data })
        }
      }
    } catch (e) {
      console.error('Failed to load local data', e)
    }
  },

  saveHistory: (query: string) => {
    try {
      const newEntry = {
        id: Math.random().toString(36).substr(2, 9),
        query,
        created_at: new Date().toISOString()
      }
      
      set((state) => {
        // Prevent exact duplicates at the top
        if (state.history.length > 0 && state.history[0].query === query) {
           return state;
        }
        const updated = [newEntry, ...state.history].slice(0, 20) // Keep last 20
        localStorage.setItem('nemu_jurnal_history', JSON.stringify(updated))
        return { history: updated }
      })
    } catch (e) {
      console.error('Failed to save history', e)
    }
  },

  savePaper: async (paper: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const paperId = paper.id || paper.doi || Math.random().toString()
      const newPaper = {
        user_id: session.user.id,
        paper_id: paperId,
        title: paper.title,
        abstract: paper.abstract || '',
        url: paper.url || (paper.doi ? `https://doi.org/${paper.doi}` : ''),
      }

      // Prevent duplicates locally
      const current = get().savedPapers
      if (current.some(p => p.paper_id === newPaper.paper_id)) {
         return;
      }

      const { data, error } = await supabase
        .from('saved_papers')
        .insert([newPaper])
        .select('*')
        .single()

      if (!error && data) {
        set((state) => ({ savedPapers: [data, ...state.savedPapers] }))
      } else if (error) {
        console.error('Failed to save paper to DB:', error.message)
      }
    } catch (e) {
      console.error('Failed to save paper', e)
    }
  },

  removePaper: async (paperId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from('saved_papers')
        .delete()
        .eq('paper_id', paperId)
        .eq('user_id', session.user.id)

      if (!error) {
        set((state) => ({
          savedPapers: state.savedPapers.filter(p => p.paper_id !== paperId)
        }))
      } else {
        console.error('Failed to remove paper from DB:', error.message)
      }
    } catch (e) {
      console.error('Failed to remove paper', e)
    }
  },

  votes: {},
  setVote: (key, type) => set((state) => ({
    votes: { ...state.votes, [key]: type }
  }))
}))
