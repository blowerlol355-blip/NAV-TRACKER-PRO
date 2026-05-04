'use client'

import { useAppStore, type TabId } from '@/lib/store'
import { LayoutDashboard, Ship, FileCheck, Box, Anchor, FileText, MapPin, ChevronLeft, ChevronRight, Waves, Users, Link2, AlertOctagon, Calendar, Scale, Calculator } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { motion, AnimatePresence } from 'framer-motion'

interface NavItem {
  id: TabId
  label: string
  icon: React.ElementType
  badge?: number
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'General',
    items: [
      { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { id: 'shipments', label: 'Envíos', icon: Ship, badge: 9 },
      { id: 'permits', label: 'Permisos', icon: FileCheck, badge: 5 },
      { id: 'containers', label: 'Contenedores', icon: Box },
      { id: 'vessels', label: 'Embarcaciones', icon: Anchor },
      { id: 'documents', label: 'Documentos', icon: FileText },
      { id: 'ports', label: 'Puertos', icon: MapPin },
    ],
  },
  {
    title: 'Personal y Trazabilidad',
    items: [
      { id: 'crew', label: 'Tripulación', icon: Users },
      { id: 'custody', label: 'Cadena de Custodia', icon: Link2 },
      { id: 'claims', label: 'Reclamaciones', icon: AlertOctagon },
    ],
  },
  {
    title: 'Cumplimiento',
    items: [
      { id: 'calendar', label: 'Vencimientos', icon: Calendar },
      { id: 'comparator', label: 'Comparador', icon: Scale },
      { id: 'simulator', label: 'Simulador', icon: Calculator },
    ],
  },
]

export function Sidebar() {
  const { activeTab, setActiveTab, sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 68 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col flex-shrink-0 overflow-hidden relative"
      >
        {/* Decorative wave pattern at top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-teal-900/20 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0 relative z-10">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/20">
            <Anchor className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 1, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap flex items-center gap-2"
              >
                <span className="text-lg font-bold tracking-tight">NavTrack</span>
                <span className="text-lg font-light text-teal-400">Pro</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator className="bg-slate-700/50" />

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto relative z-10">
          {navSections.map((section, sectionIdx) => (
            <div key={section.title} className={sectionIdx > 0 ? 'mt-2' : ''}>
              {/* Section header */}
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-3 py-1.5 mt-1"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {section.title}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              {sidebarCollapsed && sectionIdx > 0 && (
                <div className="my-1 mx-3 h-px bg-slate-700/50" />
              )}

              {/* Section items */}
              {section.items.map((item) => {
                const isActive = activeTab === item.id
                const Icon = item.icon

                const button = (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-400'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeBg"
                        className="absolute inset-0 bg-teal-500/10 rounded-lg"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-5 h-5 flex-shrink-0 relative z-10 transition-all duration-300 ${
                      isActive ? 'text-teal-400 scale-110' : 'group-hover:text-slate-200 group-hover:scale-105'
                    }`} />
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 1, x: 0 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden whitespace-nowrap relative z-10 flex-1 text-left"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!sidebarCollapsed && item.badge && (
                      <span className="relative z-10 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-teal-500/20 text-teal-400 text-[10px] font-bold transition-transform duration-200 group-hover:scale-110">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 w-[3px] h-6 bg-gradient-to-b from-teal-400 to-teal-500 rounded-r-full"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    {/* Hover slide indicator */}
                    {!isActive && (
                      <motion.div
                        className="absolute left-0 w-[3px] h-0 bg-teal-400/40 rounded-r-full"
                        whileHover={{ height: 24 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </button>
                )

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700 shadow-xl">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return <div key={item.id} className="relative">{button}</div>
              })}
            </div>
          ))}
        </nav>

        <Separator className="bg-slate-700/50" />

        {/* Online status indicator */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-2 relative z-10"
            >
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sistema en línea • {new Date().toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User section */}
        <div className="p-3 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
            <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-teal-500/30">
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-white text-xs font-bold">AD</AvatarFallback>
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
                  <p className="text-[11px] text-slate-500">admin@navtrack.mx</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse button */}
        <button
          onClick={toggleSidebar}
          className="h-10 flex items-center justify-center bg-slate-800/50 hover:bg-slate-700/80 transition-colors flex-shrink-0 relative z-10 group"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
          ) : (
            <div className="flex items-center gap-2">
              <Waves className="w-3 h-3 text-slate-600" />
              <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
          )}
        </button>
      </motion.aside>
    </TooltipProvider>
  )
}
