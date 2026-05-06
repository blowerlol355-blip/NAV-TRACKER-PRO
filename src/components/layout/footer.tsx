'use client'

import { useEffect, useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { Anchor, Shield, FileText, ExternalLink, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Footer() {
  const [timestamp, setTimestamp] = useState('')
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTimestamp(
        now.toLocaleString('es-VE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  // Check server status every 30s
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/dashboard', { signal: AbortSignal.timeout(5000) })
        setServerStatus(res.ok ? 'online' : 'offline')
      } catch {
        setServerStatus('offline')
      }
    }
    void checkStatus()
    const interval = setInterval(() => void checkStatus(), 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="flex items-center justify-between px-4 py-2 border-t bg-background/95 backdrop-blur-sm text-xs text-muted-foreground">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Anchor className="w-3.5 h-3.5 text-teal-500" />
          <span className="font-semibold text-foreground">NavTrack Pro</span>
          <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 text-[9px] h-4 px-1.5 border-0">
            v2.1
          </Badge>
        </div>
        <Separator orientation="vertical" className="h-3" />
        <span>© 2026 NavTrack Systems</span>
        <Separator orientation="vertical" className="h-3" />
        <span>Actualizado: {timestamp}</span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Server Status */}
        <div className="flex items-center gap-1.5">
          <AnimatePresence mode="wait">
            {serverStatus === 'online' ? (
              <motion.div
                key="online"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5"
              >
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Servidor en línea</span>
              </motion.div>
            ) : serverStatus === 'offline' ? (
              <motion.div
                key="offline"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5"
              >
                <WifiOff className="w-3 h-3 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">Sin conexión</span>
              </motion.div>
            ) : (
              <motion.div
                key="checking"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                <span className="text-amber-600 dark:text-amber-400">Verificando...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator orientation="vertical" className="h-3" />

        {/* Compliance badges */}
        <div className="hidden sm:flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-teal-500" />
          <span>ISO 28000</span>
        </div>
        <Separator orientation="vertical" className="h-3 hidden sm:block" />
        <div className="hidden md:flex items-center gap-1.5">
          <FileText className="w-3 h-3 text-sky-500" />
          <span>ISPS Code</span>
        </div>
      </div>
    </footer>
  )
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 ${className}`}>{children}</span>
}
