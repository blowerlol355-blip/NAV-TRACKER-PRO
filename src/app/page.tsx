'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
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
import { AnimatePresence, motion } from 'framer-motion'

export default function Home() {
  const { activeTab, dataInitialized, setDataInitialized } = useAppStore()
  const seedingRef = useRef(false)

  useEffect(() => {
    if (!dataInitialized && !seedingRef.current) {
      seedingRef.current = true
      // First ensure seed runs, then verify data is actually available
      const init = async () => {
        try {
          // Step 1: Seed the database
          await fetch('/api/seed', { method: 'POST' })
          // Step 2: Wait a moment for DB write to complete
          await new Promise(r => setTimeout(r, 500))
          // Step 3: Verify data is available
          const checkRes = await fetch('/api/dashboard')
          if (checkRes.ok) {
            const checkData = await checkRes.json()
            if (checkData?.kpis) {
              setDataInitialized(true)
              return
            }
          }
          // Step 4: Retry if not ready
          await new Promise(r => setTimeout(r, 2000))
          const retryRes = await fetch('/api/dashboard')
          if (retryRes.ok) {
            setDataInitialized(true)
          } else {
            // Last resort - still mark as initialized to show error UI
            setDataInitialized(true)
          }
        } catch {
          setDataInitialized(true)
        }
      }
      init()
    }
  }, [dataInitialized, setDataInitialized])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {!dataInitialized ? (
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
        </main>
      </div>
    </div>
  )
}
