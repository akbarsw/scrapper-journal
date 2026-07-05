import { create } from 'zustand'

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
  
  // LocalStorage Actions (since Supabase tables need manual setup via UI)
  loadLocalData: () => void
  saveHistory: (query: string) => void
  savePaper: (paper: any) => void
  removePaper: (paperId: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  activeTab: 'search',
  setActiveTab: (tab) => set({ activeTab: tab }),

  savedPapers: [],
  history: [],

  loadLocalData: () => {
    try {
      const hist = localStorage.getItem('referensia_history')
      if (hist) set({ history: JSON.parse(hist) })
      
      const lib = localStorage.getItem('referensia_library')
      if (lib) set({ savedPapers: JSON.parse(lib) })
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
        localStorage.setItem('referensia_history', JSON.stringify(updated))
        return { history: updated }
      })
    } catch (e) {
      console.error('Failed to save history', e)
    }
  },

  savePaper: (paper: any) => {
    try {
      const newPaper = {
        id: Math.random().toString(36).substr(2, 9),
        paper_id: paper.id || Math.random().toString(),
        title: paper.title,
        abstract: paper.abstract,
        url: paper.url || paper.doi || '',
        created_at: new Date().toISOString()
      }
      
      set((state) => {
        // Prevent duplicates
        if (state.savedPapers.some(p => p.paper_id === newPaper.paper_id)) {
           return state;
        }
        const updated = [newPaper, ...state.savedPapers]
        localStorage.setItem('referensia_library', JSON.stringify(updated))
        return { savedPapers: updated }
      })
    } catch (e) {
      console.error('Failed to save paper', e)
    }
  },

  removePaper: (paperId: string) => {
    try {
      set((state) => {
        const updated = state.savedPapers.filter(p => p.paper_id !== paperId)
        localStorage.setItem('referensia_library', JSON.stringify(updated))
        return { savedPapers: updated }
      })
    } catch (e) {
      console.error('Failed to remove paper', e)
    }
  }
}))
