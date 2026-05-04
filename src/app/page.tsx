'use client'

import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ServerStatusBanner } from '@/components/layout/server-status'
import { ErrorBoundary } from '@/components/error-boundary'
import { AnimatePresence, motion } from 'framer-motion'
import { SearchCommand } from '@/components/layout/search-command'
import { Footer } from '@/components/layout/footer'
import { updateServerState } from '@/lib/api-client'

// Direct imports (not lazy) to ensure all JS is loaded on first page load
// This prevents chunk load failures when the server dies
import { Overview } from '@/components/dashboard/overview'
import { Shipments } from '@/components/dashboard/shipments'
import { Permits } from '@/components/dashboard/permits'
import { Containers } from '@/components/dashboard/containers'
import { Vessels } from '@/components/dashboard/vessels'
import { Documents } from '@/components/dashboard/documents'
import { Ports } from '@/components/dashboard/ports'
import { Crew } from '@/components/dashboard/crew'
import { Custody } from '@/components/dashboard/custody'
import { Claims } from '@/components/dashboard/claims'
import { ExpirationCalendar } from '@/components/dashboard/calendar'
import { Comparator } from '@/components/dashboard/comparator'
import { Simulator } from '@/components/dashboard/simulator'

function InitScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-[3px] border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-[3px] border-transparent border-b-teal-300/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Inicializando datos...</p>
          <p className="text-xs text-muted-foreground mt-1">Cargando base de datos marítima</p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { activeTab, dataInitialized, setDataInitialized } = useAppStore()
  const initRef = useRef(false)
  const [initError, setInitError] = useState(false)

  useEffect(() => {
    if (dataInitialized || initRef.current) return
    initRef.current = true

    const init = async () => {
      try {
        // Sequential initialization to avoid overloading the dev server
        const res = await fetch('/api/dashboard')
        
        if (res.ok) {
          const data = await res.json()
          if (data?.kpis) {
            updateServerState(true)
            setDataInitialized(true)
            return
          }
        }

        // If no data, seed the database
        try {
          await fetch('/api/seed', { method: 'POST' })
        } catch {
          // Continue - seed may have already run
        }

        // Wait for DB write
        await new Promise(r => setTimeout(r, 1000))

        // Verify data is available
        const verifyRes = await fetch('/api/dashboard')
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json()
          if (verifyData?.kpis) {
            updateServerState(true)
            setDataInitialized(true)
            return
          }
        }

        // Last retry
        await new Promise(r => setTimeout(r, 3000))
        const finalRes = await fetch('/api/dashboard')
        if (finalRes.ok) {
          updateServerState(true)
          setDataInitialized(true)
        } else {
          updateServerState(false)
          setInitError(true)
          setDataInitialized(true)
        }
      } catch {
        updateServerState(false)
        setInitError(true)
        setDataInitialized(true)
      }
    }

    // Delay init by 2 seconds to let the page render first
    const timer = setTimeout(init, 2000)
    return () => clearTimeout(timer)
  }, [dataInitialized, setDataInitialized])

  return (
    <>
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <ServerStatusBanner />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {!dataInitialized ? (
                  <InitScreen />
                ) : initError ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">Error al cargar datos</p>
                        <p className="text-sm text-muted-foreground mt-1">No se pudo conectar con la base de datos. El servidor puede estar reiniciándose.</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Los datos se cargarán automáticamente cuando el servidor esté disponible.</p>
                      </div>
                      <button
                        onClick={() => { setInitError(false); initRef.current = false; setDataInitialized(false); }}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                      >
                        Reintentar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'dashboard' && <Overview />}
                    {activeTab === 'shipments' && <Shipments />}
                    {activeTab === 'permits' && <Permits />}
                    {activeTab === 'containers' && <Containers />}
                    {activeTab === 'vessels' && <Vessels />}
                    {activeTab === 'documents' && <Documents />}
                    {activeTab === 'ports' && <Ports />}
                    {activeTab === 'crew' && <Crew />}
                    {activeTab === 'custody' && <Custody />}
                    {activeTab === 'claims' && <Claims />}
                    {activeTab === 'calendar' && <ExpirationCalendar />}
                    {activeTab === 'comparator' && <Comparator />}
                    {activeTab === 'simulator' && <Simulator />}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </div>
    <SearchCommand />
    </>
  )
}
