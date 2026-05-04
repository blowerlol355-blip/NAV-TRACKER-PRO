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
              {activeTab === 'dashboard' && <Overview />}
              {activeTab === 'shipments' && <Shipments />}
              {activeTab === 'permits' && <Permits />}
              {activeTab === 'containers' && <Containers />}
              {activeTab === 'vessels' && <Vessels />}
              {activeTab === 'documents' && <Documents />}
              {activeTab === 'ports' && <Ports />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
