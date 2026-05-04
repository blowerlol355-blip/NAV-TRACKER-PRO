'use client'

import { useAppStore, type TabId } from '@/lib/store'
import { LayoutDashboard, Ship, FileCheck, Box, Anchor, FileText, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'

const navItems: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
  { id: 'shipments', label: 'Envíos', icon: Ship },
  { id: 'permits', label: 'Permisos', icon: FileCheck },
  { id: 'containers', label: 'Contenedores', icon: Box },
  { id: 'vessels', label: 'Embarcaciones', icon: Anchor },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'ports', label: 'Puertos', icon: MapPin },
]

export function Sidebar() {
  const { activeTab, setActiveTab, sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 68 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="h-screen bg-slate-900 text-white flex flex-col flex-shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
            <Anchor className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 1, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-lg font-bold tracking-tight">NavTrack Pro</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator className="bg-slate-700" />

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id
            const Icon = item.icon

            const button = (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-teal-400' : ''}`} />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 1, x: 0 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-8 bg-teal-400 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            )

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.id} className="relative">{button}</div>
          })}
        </nav>

        <Separator className="bg-slate-700" />

        {/* User section */}
        <div className="p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-teal-600 text-white text-xs">AD</AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 1, x: 0 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <p className="text-sm font-medium text-slate-200">Administrador</p>
                  <p className="text-xs text-slate-500">admin@navtrack.mx</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse button */}
        <button
          onClick={toggleSidebar}
          className="h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 transition-colors flex-shrink-0"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </motion.aside>
    </TooltipProvider>
  )
}
