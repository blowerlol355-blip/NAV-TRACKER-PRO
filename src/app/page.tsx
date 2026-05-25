'use client'

import { useEffect, useRef, lazy, Suspense } from 'react'
import { useAppStore } from '@/lib/store'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ErrorBoundary } from '@/components/error-boundary'
import { AnimatePresence, motion } from 'framer-motion'
import { SearchCommand } from '@/components/layout/search-command'
import { Footer } from '@/components/layout/footer'
import { QuickActionsBar } from '@/components/layout/quick-actions'
import { ChatWidget } from '@/components/chat/chat-widget'

// Lazy load all dashboard components to reduce initial bundle size
// and avoid overwhelming the dev server with too many API calls at once
const Overview = lazy(() => import('@/components/dashboard/overview').then(m => ({ default: m.Overview })))
const Shipments = lazy(() => import('@/components/dashboard/shipments').then(m => ({ default: m.Shipments })))
const Permits = lazy(() => import('@/components/dashboard/permits').then(m => ({ default: m.Permits })))
const Containers = lazy(() => import('@/components/dashboard/containers').then(m => ({ default: m.Containers })))
const Vessels = lazy(() => import('@/components/dashboard/vessels').then(m => ({ default: m.Vessels })))
const Documents = lazy(() => import('@/components/dashboard/documents').then(m => ({ default: m.Documents })))
const Ports = lazy(() => import('@/components/dashboard/ports').then(m => ({ default: m.Ports })))
const Crew = lazy(() => import('@/components/dashboard/crew').then(m => ({ default: m.Crew })))
const Custody = lazy(() => import('@/components/dashboard/custody').then(m => ({ default: m.Custody })))
const Claims = lazy(() => import('@/components/dashboard/claims').then(m => ({ default: m.Claims })))
const ExpirationCalendar = lazy(() => import('@/components/dashboard/calendar').then(m => ({ default: m.ExpirationCalendar })))
const Comparator = lazy(() => import('@/components/dashboard/comparator').then(m => ({ default: m.Comparator })))
const Simulator = lazy(() => import('@/components/dashboard/simulator').then(m => ({ default: m.Simulator })))

function ComponentLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-[3px] border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-[3px] border-transparent border-b-teal-300/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Cargando módulo...</p>
          <p className="text-xs text-muted-foreground mt-1">Preparando componente</p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { activeTab, dataInitialized, setDataInitialized } = useAppStore()
  const initRef = useRef(false)

  // Mark data as initialized immediately since DB is pre-seeded
  // Each component handles its own data fetching with retry logic
  useEffect(() => {
    if (dataInitialized || initRef.current) return
    initRef.current = true
    setDataInitialized(true)
  }, [dataInitialized, setDataInitialized])

  return (
    <>
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
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
                <Suspense fallback={<ComponentLoader />}>
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
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </div>
    <SearchCommand />
    <QuickActionsBar />
    <ChatWidget />
    </>
  )
}
