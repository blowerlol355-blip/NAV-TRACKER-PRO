'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Ship, FileCheck, FileText, Search, X, Star, Anchor } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface QuickAction {
  label: string
  icon: React.ElementType
  tab: string
  color: string
  bgColor: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Nuevo Envío', icon: Ship, tab: 'shipments', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/50' },
  { label: 'Nuevo Permiso', icon: FileCheck, tab: 'permits', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50' },
  { label: 'Agregar Documento', icon: FileText, tab: 'documents', color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50' },
  { label: 'Buscar (Ctrl+K)', icon: Search, tab: 'search', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-950/50 hover:bg-violet-100 dark:hover:bg-violet-900/50' },
  { label: 'Favoritos', icon: Star, tab: 'favorites', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' },
  { label: 'Embarcaciones', icon: Anchor, tab: 'vessels', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 dark:hover:bg-orange-900/50' },
]

export function QuickActionsBar() {
  const [isOpen, setIsOpen] = useState(false)
  const { setActiveTab, setSearchOpen, favorites } = useAppStore()

  const handleAction = (action: QuickAction) => {
    if (action.tab === 'search') {
      setSearchOpen(true)
    } else if (action.tab === 'favorites') {
      setActiveTab('dashboard')
    } else {
      setActiveTab(action.tab as Parameters<typeof setActiveTab>[0])
    }
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Favorites mini-panel */}
            {favorites.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="bg-card border border-border rounded-xl shadow-xl p-3 max-w-[240px]"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Favoritos recientes</p>
                <div className="space-y-1">
                  {favorites.slice(0, 4).map((fav) => (
                    <button
                      key={fav.id}
                      onClick={() => {
                        const tabMap: Record<string, string> = { shipment: 'shipments', permit: 'permits', vessel: 'vessels', port: 'ports' }
                        setActiveTab((tabMap[fav.type] || 'dashboard') as Parameters<typeof setActiveTab>[0])
                        setIsOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-muted/50 transition-colors text-left"
                    >
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                      <span className="truncate font-medium">{fav.reference}</span>
                      <span className="text-muted-foreground text-[10px] ml-auto">{fav.type}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action buttons */}
            {QUICK_ACTIONS.map((action, i) => {
              const ActionIcon = action.icon
              return (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleAction(action)}
                        className={`flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-xl shadow-lg border border-border ${action.bgColor} transition-all group`}
                      >
                        <ActionIcon className={`w-4 h-4 ${action.color} shrink-0`} />
                        <span className={`text-sm font-medium ${action.color} whitespace-nowrap`}>{action.label}</span>
                        {action.tab === 'favorites' && favorites.length > 0 && (
                          <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold">
                            {favorites.length}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="text-xs">
                      {action.label}
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )
            })}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-xl shadow-teal-500/30 flex items-center justify-center hover:from-teal-600 hover:to-teal-700 transition-all"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.div>
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/10 dark:bg-black/30 -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
