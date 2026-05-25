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
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      <motion.aside
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : '-100%',
          width: 256
        }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="fixed top-0 left-0 bottom-0 z-50 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Decorative wave pattern at top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-accent/20 to-transparent pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/20">
              <Anchor className="w-5 h-5 text-white" />
            </div>
            <div className="overflow-hidden whitespace-nowrap flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight">NavTrack</span>
              <span className="text-lg font-light text-accent">Pro</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-800 rounded-md transition-colors lg:hidden">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <Separator className="bg-slate-700/50" />

        {/* Navigation */}
        <nav className="flex-1 py-2 px-2 overflow-y-auto relative z-10">
          {navSections.map((section, sectionIdx) => (
            <div key={section.title} className={sectionIdx > 0 ? 'mt-2' : ''}>
              {/* Section header */}
              <div className="px-3 py-1.5 mt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </span>
              </div>

              {/* Section items */}
              {section.items.map((item) => {
                const isActive = activeTab === item.id
                const Icon = item.icon

                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => {
                        setActiveTab(item.id)
                        if (window.innerWidth < 1024) setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group ${
                        isActive
                          ? 'bg-accent/15 text-accent'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeBg"
                          className="absolute inset-0 bg-accent/10 rounded-lg"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon className={`w-5 h-5 flex-shrink-0 relative z-10 transition-all duration-300 ${
                            isActive ? 'text-accent scale-110' : 'group-hover:text-slate-200 group-hover:scale-105'
                      }`} />
                      <span className="overflow-hidden whitespace-nowrap relative z-10 flex-1 text-left">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="relative z-10 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-accent/20 text-accent text-[10px] font-bold transition-transform duration-200 group-hover:scale-110">
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 w-[3px] h-6 bg-gradient-to-b from-accent to-accent-600 rounded-r-full"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                      )}
                      {!isActive && (
                        <motion.div
                          className="absolute left-0 w-[3px] h-0 bg-accent/40 rounded-r-full"
                          whileHover={{ height: 24 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </nav>

        <Separator className="bg-slate-700/50" />

        {/* Online status indicator */}
        <div className="px-4 py-2 relative z-10">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Sistema en línea • {new Date().toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
          </div>
        </div>

        {/* User section */}
        <div className="p-3 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer">
            <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-accent/30">
              <AvatarFallback className="bg-gradient-to-br from-accent to-accent-700 text-white text-xs font-bold">AD</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden whitespace-nowrap">
              <p className="text-sm font-medium text-slate-200">Administrador</p>
              <p className="text-[11px] text-slate-500">admin@navtrack.mx</p>
            </div>
          </div>
        </div>

        {/* Close button at the bottom */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="h-10 flex items-center justify-center bg-slate-800/50 hover:bg-slate-700/80 transition-colors flex-shrink-0 relative z-10 group"
        >
          <div className="flex items-center gap-2">
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            <span className="text-xs text-slate-400 group-hover:text-slate-200">Ocultar Menú</span>
          </div>
        </button>
      </motion.aside>
    </>
  )
}
