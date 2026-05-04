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
      fetch('/api/seed', { method: 'POST' })
        .then((r) => r.json())
        .then(() => {
          setDataInitialized(true)
        })
        .catch(() => {
          setDataInitialized(true)
        })
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
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Inicializando datos...</p>
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
