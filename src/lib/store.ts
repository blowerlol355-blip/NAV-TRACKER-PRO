'use client'

import { create } from 'zustand'

export type TabId = 'dashboard' | 'shipments' | 'permits' | 'containers' | 'vessels' | 'documents' | 'ports' | 'crew' | 'custody' | 'claims' | 'calendar' | 'comparator' | 'simulator'

interface FavoriteItem {
  id: string
  type: 'shipment' | 'permit' | 'vessel' | 'port'
  reference: string
  label: string
}

interface AppState {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  statusFilter: string
  setStatusFilter: (filter: string) => void
  cargoTypeFilter: string
  setCargoTypeFilter: (filter: string) => void
  dataInitialized: boolean
  setDataInitialized: (val: boolean) => void
  favorites: FavoriteItem[]
  addFavorite: (item: FavoriteItem) => void
  removeFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  selectedPortCodeToView: string | null
  setSelectedPortCodeToView: (code: string | null) => void
  chatOpen: boolean
  setChatOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  statusFilter: 'all',
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  cargoTypeFilter: 'all',
  setCargoTypeFilter: (filter) => set({ cargoTypeFilter: filter }),
  dataInitialized: false,
  setDataInitialized: (val) => set({ dataInitialized: val }),
  favorites: [],
  addFavorite: (item) => set((state) => {
    if (state.favorites.some(f => f.id === item.id)) return state
    return { favorites: [...state.favorites, item] }
  }),
  removeFavorite: (id) => set((state) => ({
    favorites: state.favorites.filter(f => f.id !== id),
  })),
  isFavorite: (id) => get().favorites.some(f => f.id === id),
  selectedPortCodeToView: null,
  setSelectedPortCodeToView: (code) => set({ selectedPortCodeToView: code }),
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
}))
