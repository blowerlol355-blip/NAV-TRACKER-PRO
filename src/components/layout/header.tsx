'use client'

import { useAppStore, type TabId } from '@/lib/store'
import { Search, Bell, Sun, Moon, RefreshCw, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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

// ── Notification Types ────────────────────────────────────────────────────
interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  type: 'success' | 'warning' | 'error' | 'info'
  relatedTab: string
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; borderColor: string; bgColor: string; iconColor: string; label: string }> = {
  error: {
    icon: AlertCircle,
    color: 'text-red-700 dark:text-red-400',
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    iconColor: 'text-red-500',
    label: 'Urgente',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    iconColor: 'text-amber-500',
    label: 'Advertencias',
  },
  info: {
    icon: Info,
    color: 'text-sky-700 dark:text-sky-400',
    borderColor: 'border-l-sky-500',
    bgColor: 'bg-sky-50 dark:bg-sky-950/20',
    iconColor: 'text-sky-500',
    label: 'Informativas',
  },
  success: {
    icon: CheckCircle,
    color: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    iconColor: 'text-emerald-500',
    label: 'Exitosas',
  },
}

// Group order for display
const GROUP_ORDER = ['error', 'warning', 'info', 'success']

export function Header() {
  const { activeTab, setActiveTab, setSearchOpen } = useAppStore()
  const [darkMode, setDarkMode] = useState(false)
  const [currentTime, setCurrentTime] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const initializedRef = useRef(false)

  // ── Notification State ─────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      if (data.notifications) {
        setNotifications(data.notifications)
      }
    } catch {
      // Silently fail - server may be temporarily down
    }
  }, [])

  // Delay notification fetch by 5s to reduce initial API load,
  // then poll every 60s
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchNotifications()
    }, 5000)
    const interval = setInterval(() => void fetchNotifications(), 60000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [fetchNotifications])

  const markAsRead = (id: string) => {
    setReadIds((prev) => new Set(prev).add(id))
  }

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id))
    setReadIds(allIds)
  }

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id)
    if (notification.relatedTab) {
      setActiveTab(notification.relatedTab as TabId)
    }
    setNotificationsOpen(false)
  }

  // ── Group notifications by type ──────────────────────────────────────
  const groupedNotifications = GROUP_ORDER.map((type) => ({
    type,
    label: TYPE_CONFIG[type].label,
    items: notifications.filter((n) => n.type === type),
  })).filter((g) => g.items.length > 0)

  // ── Initialize dark mode ─────────────────────────────────────────────
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
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    initializedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Theme initialization requires reading localStorage on mount
    setDarkMode(isDark)
  }, [])

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
    fetchNotifications()
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
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 h-8 px-3 w-72 rounded-md bg-muted/50 hover:bg-muted/70 transition-colors text-sm text-muted-foreground border border-transparent hover:border-teal-500/30"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left truncate">Buscar envíos, permisos...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground shrink-0">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        <motion.button
          whileTap={{ rotate: 180 }}
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.button>

        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0 shadow-xl">
            {/* Header */}
            <div className="p-3 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">Notificaciones</h3>
                <p className="text-[11px] text-muted-foreground">
                  {unreadCount > 0
                    ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} nueva${unreadCount > 1 ? 's' : ''}`
                    : 'Todo al día'}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] h-7 px-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                  onClick={markAllAsRead}
                >
                  Marcar todas como leídas
                </Button>
              )}
            </div>

            {/* Notification List */}
            <ScrollArea className="max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Sin notificaciones</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Todo está en orden</p>
                </div>
              ) : (
                <AnimatePresence>
                  {groupedNotifications.map((group) => {
                    const config = TYPE_CONFIG[group.type]
                    const GroupIcon = config.icon

                    return (
                      <div key={group.type}>
                        {/* Section Header */}
                        <div className="px-3 py-1.5 bg-muted/30 flex items-center gap-2 sticky top-0 z-10">
                          <GroupIcon className={`w-3 h-3 ${config.iconColor}`} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {group.label}
                          </span>
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 ml-auto">
                            {group.items.length}
                          </Badge>
                        </div>

                        {/* Notification Items */}
                        {group.items.map((notification) => {
                          const isRead = readIds.has(notification.id)
                          const TypeIcon = TYPE_CONFIG[notification.type].icon

                          return (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.15 }}
                              className={`
                                border-l-4 ${config.borderColor} 
                                ${isRead ? 'bg-background' : config.bgColor}
                                hover:bg-muted/50 transition-colors cursor-pointer
                              `}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="px-3 py-2.5 flex items-start gap-2.5">
                                {/* Unread indicator */}
                                <div className="flex flex-col items-center gap-1 pt-0.5">
                                  {!isRead && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-2 h-2 rounded-full bg-teal-500"
                                    />
                                  )}
                                </div>

                                {/* Icon */}
                                <div className={`flex-shrink-0 mt-0.5`}>
                                  <TypeIcon className={`w-4 h-4 ${config.iconColor}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs leading-tight ${isRead ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">
                                    {notification.description}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground/70 mt-1">
                                    {notification.time}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )
                  })}
                </AnimatePresence>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="p-2 border-t">
              <button
                className="w-full text-center text-xs text-teal-600 dark:text-teal-400 hover:underline py-1"
                onClick={() => {
                  setActiveTab('calendar')
                  setNotificationsOpen(false)
                }}
              >
                Ver calendario de vencimientos
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
