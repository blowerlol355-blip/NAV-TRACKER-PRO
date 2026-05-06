'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore, type TabId } from '@/lib/store'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import {
  Ship,
  Shield,
  Anchor,
  Box,
  FileText,
  Users,
  MapPin,
  AlertTriangle,
  Search,
  Clock,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
  id: string
  type: 'shipment' | 'permit' | 'vessel' | 'container' | 'document' | 'crew' | 'port' | 'claim'
  title: string
  subtitle: string
  icon: string
}

interface GroupedResults {
  [key: string]: {
    label: string
    tab: string
    items: SearchResult[]
  }
}

const ICON_MAP: Record<string, React.ElementType> = {
  Ship,
  Shield,
  Anchor,
  Container: Box,
  FileText,
  Users,
  MapPin,
  AlertTriangle,
}

const TYPE_COLORS: Record<string, string> = {
  shipment: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  permit: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  vessel: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  container: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  document: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  crew: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  port: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  claim: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const STORAGE_KEY = 'navtrack-recent-searches'
const MAX_RECENT = 5

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  try {
    const recent = getRecentSearches().filter((s) => s !== query)
    recent.unshift(query)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
  } catch {
    // Ignore storage errors
  }
}

export function SearchCommand() {
  const { searchOpen, setSearchOpen, setActiveTab, setSearchQuery } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GroupedResults>({})
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Load recent searches on open
  useEffect(() => {
    if (searchOpen) {
      setRecentSearches(getRecentSearches())
      setQuery('')
      setResults({})
    }
  }, [searchOpen])

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, setSearchOpen])

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults({})
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      const data = await res.json()
      setResults(data.results || {})
    } catch {
      setResults({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults({})
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      void doSearch(query)
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, doSearch])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      saveRecentSearch(query)
      setSearchOpen(false)
      setSearchQuery(query)

      // Map type to tab
      const tabMap: Record<string, TabId> = {
        shipment: 'shipments',
        permit: 'permits',
        vessel: 'vessels',
        container: 'containers',
        document: 'documents',
        crew: 'crew',
        port: 'ports',
        claim: 'claims',
      }
      const tab = tabMap[result.type]
      if (tab) setActiveTab(tab)
    },
    [query, setSearchOpen, setSearchQuery, setActiveTab]
  )

  const handleRecentClick = useCallback((recentQuery: string) => {
    setQuery(recentQuery)
  }, [])

  const hasResults = Object.keys(results).length > 0
  const showRecent = query.trim().length < 2 && recentSearches.length > 0

  return (
    <CommandDialog
      open={searchOpen}
      onOpenChange={setSearchOpen}
      title="Búsqueda Global"
      description="Buscar envíos, permisos, embarcaciones, contenedores y más..."
      showCloseButton={false}
      className="sm:max-w-lg"
    >
      <CommandInput
        placeholder="Buscar envíos, permisos, embarcaciones..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {loading && (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
              Buscando...
            </div>
          </div>
        )}

        {!loading && query.trim().length >= 2 && !hasResults && (
          <CommandEmpty>No se encontraron resultados para &quot;{query}&quot;</CommandEmpty>
        )}

        {!loading && showRecent && (
          <CommandGroup heading="Búsquedas recientes">
            <AnimatePresence>
              {recentSearches.map((recent, i) => (
                <motion.div
                  key={recent}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <CommandItem onSelect={() => handleRecentClick(recent)} className="cursor-pointer">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{recent}</span>
                    <CommandShortcut>⏎</CommandShortcut>
                  </CommandItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </CommandGroup>
        )}

        {!loading &&
          hasResults &&
          Object.entries(results).map(([type, group]) => {
            const IconComponent = ICON_MAP[group.items[0]?.icon || ''] || Search
            return (
              <CommandGroup key={type} heading={group.label}>
                <AnimatePresence>
                  {group.items.map((item, i) => {
                    const ItemIcon = ICON_MAP[item.icon] || Search
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.15 }}
                      >
                        <CommandItem
                          onSelect={() => handleSelect(item)}
                          className="cursor-pointer"
                        >
                          <ItemIcon className="size-4 shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">
                              {item.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate block">
                              {item.subtitle}
                            </span>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 h-5 shrink-0 ${TYPE_COLORS[item.type] || ''}`}
                          >
                            {group.label.slice(0, -1)}
                          </Badge>
                        </CommandItem>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </CommandGroup>
            )
          })}

        {/* Footer hint */}
        {!loading && (
          <div className="flex items-center justify-between px-3 py-2 border-t text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">↑↓</kbd>{' '}
                navegar
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">↵</kbd>{' '}
                seleccionar
              </span>
              <span>
                <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">esc</kbd>{' '}
                cerrar
              </span>
            </div>
            <span>⌘K para abrir</span>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  )
}
