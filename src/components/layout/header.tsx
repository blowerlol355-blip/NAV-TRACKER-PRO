'use client'

import { useAppStore } from '@/lib/store'
import { Search, Bell, Sun, Moon, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const tabTitles: Record<string, string> = {
  dashboard: 'Panel Principal',
  shipments: 'Gestión de Envíos',
  permits: 'Gestión de Permisos',
  containers: 'Seguimiento de Contenedores',
  vessels: 'Flota de Embarcaciones',
  documents: 'Gestión Documental',
  ports: 'Directorio de Puertos',
  crew: 'Gestión de Tripulación',
  custody: 'Cadena de Custodia',
  claims: 'Reclamaciones y Devoluciones',
  calendar: 'Calendario de Vencimientos',
  comparator: 'Comparador de Requisitos',
  simulator: 'Simulador de Costos',
}

const tabSubtitles: Record<string, string> = {
  dashboard: 'Resumen general de operaciones marítimas',
  shipments: 'Administra y da seguimiento a tus envíos',
  permits: 'Control de permisos y autorizaciones',
  containers: 'Monitoreo de contenedores en tránsito',
  vessels: 'Gestión de la flota naval',
  documents: 'Administración de documentación',
  ports: 'Directorio de puertos marítimos',
  crew: 'Administración de tripulantes y licencias',
  custody: 'Trazabilidad de la cadena de custodia',
  claims: 'Gestión de reclamaciones, devoluciones e incidencias',
  calendar: 'Control de vencimientos de permisos, licencias y documentos',
  comparator: 'Compara requisitos de importación por país',
  simulator: 'Estima costos de cumplimiento regulatorio',
}

const notifications = [
  { id: 1, title: 'Envío ENV-2025-003 llegó a destino', time: 'Hace 2h', type: 'success' },
  { id: 2, title: 'Permiso FITO-2025-00789 por vencer', time: 'Hace 5h', type: 'warning' },
  { id: 3, title: 'Envío ENV-2025-007 con retraso', time: 'Hace 1d', type: 'error' },
]

export function Header() {
  const { activeTab, searchQuery, setSearchQuery } = useAppStore()
  const [darkMode, setDarkMode] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const initializedRef = useRef(false)

  // Initialize dark mode from localStorage or system preference on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    let isDark = false
    if (stored === 'dark') {
      isDark = true
    } else if (stored === 'light') {
      isDark = false
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    // Apply class immediately before paint to avoid flash
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    initializedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Theme initialization requires reading localStorage on mount
    setDarkMode(isDark)
  }, [])

  // Apply dark mode changes and persist to localStorage when toggled
  useEffect(() => {
    if (!initializedRef.current) return
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) +
          ' • ' +
          now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
    window.location.reload()
  }

  return (
    <header className="h-16 bg-background/95 backdrop-blur-sm border-b flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex flex-col justify-center">
        <h1 className="text-lg font-semibold text-foreground leading-tight">{tabTitles[activeTab] || 'Panel Principal'}</h1>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{tabSubtitles[activeTab] || ''}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar envíos, permisos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-72 h-8 text-sm bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-teal-500/50"
          />
        </div>

        <motion.button
          whileTap={{ rotate: 180 }}
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.button>

        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0 animate-pulse">
                3
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 shadow-xl">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">Notificaciones</h3>
              <p className="text-[11px] text-muted-foreground">Tienes 3 notificaciones nuevas</p>
            </div>
            <div className="divide-y">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      n.type === 'success' ? 'bg-emerald-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t">
              <button className="w-full text-center text-xs text-teal-600 dark:text-teal-400 hover:underline py-1">
                Ver todas las notificaciones
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-border" />

        <span className="text-[11px] text-muted-foreground whitespace-nowrap font-mono">{currentTime}</span>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title={darkMode ? 'Modo claro' : 'Modo oscuro'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>
    </header>
  )
}
