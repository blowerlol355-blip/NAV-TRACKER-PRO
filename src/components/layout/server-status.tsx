'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { isServerAvailable, updateServerState } from '@/lib/api-client'

type ConnectionStatus = 'connected' | 'disconnected' | 'restoring'

/**
 * Server status banner that shows when the server connection is lost.
 * Uses passive detection (no extra API calls during normal operation).
 * Only actively checks server when disconnected.
 */
export function ServerStatusBanner() {
  const [status, setStatus] = useState<ConnectionStatus>('connected')
  const [retrying, setRetrying] = useState(false)
  const mountedRef = useRef(true)

  const checkServer = useCallback(async () => {
    setRetrying(true)
    const available = await isServerAvailable()
    
    if (!mountedRef.current) return
    setRetrying(false)

    if (available) {
      setStatus(prev => {
        if (prev === 'disconnected') {
          // Show "restored" briefly before hiding
          setTimeout(() => {
            if (mountedRef.current) setStatus('connected')
          }, 3000)
          return 'restoring'
        }
        return 'connected'
      })
    } else {
      setStatus('disconnected')
    }
  }, [])

  // Auto-retry connection every 15 seconds when disconnected
  useEffect(() => {
    mountedRef.current = true
    if (status === 'disconnected') {
      const interval = setInterval(() => {
        void checkServer()
      }, 15000)
      return () => clearInterval(interval)
    }
  }, [status, checkServer])

  // Cleanup
  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  // Listen for fetch errors globally (passive detection)
  useEffect(() => {
    const originalFetch = window.fetch
    let consecutiveFailures = 0

    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args)
        if (response.ok) {
          consecutiveFailures = 0
          updateServerState(true)
          if (status === 'disconnected' || status === 'restoring') {
            setStatus('connected')
          }
        } else if (response.status >= 500) {
          consecutiveFailures++
          if (consecutiveFailures >= 2) {
            updateServerState(false)
            setStatus('disconnected')
          }
        }
        return response
      } catch (err) {
        consecutiveFailures++
        if (consecutiveFailures >= 2) {
          updateServerState(false)
          if (mountedRef.current) setStatus('disconnected')
        }
        throw err
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [status])

  // Don't render anything when connected
  if (status === 'connected') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div
          className={`px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium ${
            status === 'restoring'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-b border-emerald-500/20'
              : 'bg-red-500/10 text-red-700 dark:text-red-400 border-b border-red-500/20'
          }`}
        >
          {status === 'disconnected' ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <WifiOff className="w-4 h-4" />
              <span>Servidor desconectado - Reintentando...</span>
              {retrying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <button
                onClick={() => void checkServer()}
                className="ml-2 px-2 py-0.5 text-xs rounded border border-red-500/30 hover:bg-red-500/10 transition-colors"
              >
                Reintentar ahora
              </button>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              <span>Conexión restaurada</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
