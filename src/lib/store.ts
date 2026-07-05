import { create } from 'zustand'

export interface SearchHistory {
  id: string
  query: string
  created_at: string
}

export interface SavedPaper {
  id: string
  paper_id: string
  title: string
  abstract: string
  url: string
  created_at: string
}

export interface ToolHistoryEntry {
  id: string
  toolName: string
  sequenceName: string
  sequenceType: 'DNA' | 'RNA' | 'Protein' | 'Unknown'
  sequenceLength: number
  sequenceData: string
  created_at: string
}

interface AppState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  activeTab: 'search' | 'library' | 'history' | 'dna_analyzer'
  setActiveTab: (tab: 'search' | 'library' | 'history' | 'dna_analyzer') => void

  savedPapers: SavedPaper[]
  history: SearchHistory[]
  toolHistory: ToolHistoryEntry[]
  
  // BioAnalyzer state sharing
  analyzerSequenceName: string
  analyzerSequenceData: string
  setAnalyzerSequence: (name: string, data: string) => void

  // LocalStorage Actions
  loadLocalData: () => void
  saveHistory: (query: string) => void
  saveToolHistory: (name: string, seq: string, type: 'DNA' | 'RNA' | 'Protein' | 'Unknown', length: number) => void
  deleteHistoryItem: (id: string, type: 'search' | 'tool') => void
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
  toolHistory: [],

  analyzerSequenceName: '',
  analyzerSequenceData: '',
  setAnalyzerSequence: (name, data) => set({ analyzerSequenceName: name, analyzerSequenceData: data }),

  loadLocalData: () => {
    try {
      const hist = localStorage.getItem('referensia_history')
      if (hist) set({ history: JSON.parse(hist) })
      
      const lib = localStorage.getItem('referensia_library')
      if (lib) set({ savedPapers: JSON.parse(lib) })

      const toolHist = localStorage.getItem('referensia_tool_history')
      if (toolHist) set({ toolHistory: JSON.parse(toolHist) })
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

  saveToolHistory: (name: string, seq: string, type: 'DNA' | 'RNA' | 'Protein' | 'Unknown', length: number) => {
    try {
      const newEntry: ToolHistoryEntry = {
        id: Math.random().toString(36).substr(2, 9),
        toolName: "DNA/RNA/Protein Analyzer",
        sequenceName: name || "Unnamed Sequence",
        sequenceType: type,
        sequenceLength: length,
        sequenceData: seq,
        created_at: new Date().toISOString()
      }
      set((state) => {
        // Avoid duplicate saves of the same sequence data
        if (state.toolHistory.length > 0 && state.toolHistory[0].sequenceData === seq) {
          return state;
        }
        const updated = [newEntry, ...state.toolHistory].slice(0, 50) // Keep last 50
        localStorage.setItem('referensia_tool_history', JSON.stringify(updated))
        return { toolHistory: updated }
      })
    } catch (e) {
      console.error('Failed to save tool history', e)
    }
  },

  deleteHistoryItem: (id: string, type: 'search' | 'tool') => {
    try {
      set((state) => {
        if (type === 'search') {
          const updated = state.history.filter(item => item.id !== id)
          localStorage.setItem('referensia_history', JSON.stringify(updated))
          return { history: updated }
        } else {
          const updated = state.toolHistory.filter(item => item.id !== id)
          localStorage.setItem('referensia_tool_history', JSON.stringify(updated))
          return { toolHistory: updated }
        }
      })
    } catch (e) {
      console.error('Failed to delete history item', e)
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
