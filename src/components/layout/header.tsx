'use client'

import { useAppStore } from '@/lib/store'
import { Search, Bell, Sun, Moon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'

const tabTitles: Record<string, string> = {
  dashboard: 'Panel Principal',
  shipments: 'Gestión de Envíos',
  permits: 'Gestión de Permisos',
  containers: 'Seguimiento de Contenedores',
  vessels: 'Flota de Embarcaciones',
  documents: 'Gestión Documental',
  ports: 'Directorio de Puertos',
}

export function Header() {
  const { activeTab, searchQuery, setSearchQuery } = useAppStore()
  const [darkMode, setDarkMode] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) +
          ' • ' +
          now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <header className="h-14 bg-background border-b flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-foreground">{tabTitles[activeTab] || 'Panel Principal'}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64 h-8 text-sm"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0">
            3
          </Badge>
        </button>

        <span className="text-xs text-muted-foreground whitespace-nowrap">{currentTime}</span>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>
    </header>
  )
}
