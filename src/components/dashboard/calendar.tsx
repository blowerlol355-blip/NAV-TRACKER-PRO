'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertTriangle, XCircle, Clock, CheckCircle2, Search, Calendar as CalendarIcon,
  ShieldAlert, FileCheck, Users, FileText, AlertOctagon, ChevronDown,
  ArrowUpDown, Bell, BellRing, Timer, BadgeAlert, Flag
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Type definitions ───────────────────────────────────────────────

interface PermitItem {
  id: string
  type: string
  number: string
  shipmentId: string
  issueDate: string | null
  expiryDate: string | null
  status: string
  authority: string
  shipment?: { reference: string; status: string } | null
}

interface CrewItem {
  id: string
  fullName: string
  licenseId: string
  licenseExpiry: string | null
  role: string
  status: string
  carrierCompany: string | null
}

interface DocumentItem {
  id: string
  name: string
  type: string
  shipmentId: string
  expiryDate: string | null
  status: string
  category: string | null
  shipment?: { reference: string; status: string } | null
}

interface ExpirationData {
  summary: {
    totalExpiring: number
    totalExpired: number
    totalUrgent: number
    permitsExpiring: number
    permitsExpired: number
    crewExpiring: number
    crewExpired: number
    documentsExpiring: number
    documentsExpired: number
  }
  expiring: {
    permits: PermitItem[]
    crew: CrewItem[]
    documents: DocumentItem[]
  }
  expired: {
    permits: PermitItem[]
    crew: CrewItem[]
    documents: DocumentItem[]
  }
  urgent: {
    permits: PermitItem[]
    crew: CrewItem[]
    documents: DocumentItem[]
  }
}

type CategoryKey = 'permits' | 'crew' | 'documents'
type UrgencyKey = 'expired' | 'urgent' | 'expiring' | 'valid'

interface FlatItem {
  id: string
  name: string
  number: string
  category: CategoryKey
  categoryLabel: string
  expiryDate: string | null
  daysRemaining: number | null
  urgency: UrgencyKey
  associatedRef: string
  status: string
  details: string
}

// ─── Constants ──────────────────────────────────────────────────────

const CATEGORY_META: Record<CategoryKey, { label: string; icon: React.ElementType; color: string }> = {
  permits: { label: 'Certificaciones de Producto', icon: FileCheck, color: 'text-teal-600 dark:text-teal-400' },
  crew: { label: 'Licencias de Tripulación', icon: Users, color: 'text-sky-600 dark:text-sky-400' },
  documents: { label: 'Documentos Regulatorios', icon: FileText, color: 'text-purple-600 dark:text-purple-400' },
}

const URGENCY_META: Record<UrgencyKey, { label: string; color: string; bg: string; border: string; dotColor: string; progressColor: string }> = {
  expired: {
    label: 'Vencidos',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-300 dark:border-red-800',
    dotColor: 'bg-red-500',
    progressColor: '[&>div]:bg-red-500',
  },
  urgent: {
    label: 'Urgente <30 días',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-300 dark:border-amber-800',
    dotColor: 'bg-amber-500',
    progressColor: '[&>div]:bg-amber-500',
  },
  expiring: {
    label: 'Próximos <90 días',
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-300 dark:border-yellow-800',
    dotColor: 'bg-yellow-500',
    progressColor: '[&>div]:bg-yellow-500',
  },
  valid: {
    label: 'Vigentes',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-300 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
    progressColor: '[&>div]:bg-emerald-500',
  },
}

function getDaysRemaining(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const now = new Date()
  const expiry = new Date(expiryDate)
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getUrgency(days: number | null): UrgencyKey {
  if (days === null) return 'valid'
  if (days < 0) return 'expired'
  if (days <= 30) return 'urgent'
  if (days <= 90) return 'expiring'
  return 'valid'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getMonthKey(dateStr: string | null): string {
  if (!dateStr) return 'Sin fecha'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(key: string): string {
  if (key === 'Sin fecha') return key
  const [year, month] = key.split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1)
  return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

// ─── Component ──────────────────────────────────────────────────────

export function ExpirationCalendar() {
  const [data, setData] = useState<ExpirationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [groupBy, setGroupBy] = useState<'category' | 'urgency' | 'month'>('urgency')

  useEffect(() => {
    fetch('/api/expiration')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // ─── Flatten all items ──────────────────────────────────────────
  const allItems = useMemo<FlatItem[]>(() => {
    if (!data) return []
    const items: FlatItem[] = []

    // Process permits from all urgency levels
    const processPermits = (permits: PermitItem[], urgency: UrgencyKey) => {
      permits.forEach(p => {
        const days = getDaysRemaining(p.expiryDate)
        const actualUrgency = urgency === 'expiring' ? getUrgency(days) : urgency
        items.push({
          id: p.id,
          name: p.type,
          number: p.number,
          category: 'permits',
          categoryLabel: CATEGORY_META.permits.label,
          expiryDate: p.expiryDate,
          daysRemaining: days,
          urgency: actualUrgency,
          associatedRef: p.shipment?.reference || '—',
          status: p.status,
          details: p.authority,
        })
      })
    }

    const processCrew = (crew: CrewItem[], urgency: UrgencyKey) => {
      crew.forEach(c => {
        const days = getDaysRemaining(c.licenseExpiry)
        const actualUrgency = urgency === 'expiring' ? getUrgency(days) : urgency
        items.push({
          id: c.id,
          name: c.fullName,
          number: c.licenseId,
          category: 'crew',
          categoryLabel: CATEGORY_META.crew.label,
          expiryDate: c.licenseExpiry,
          daysRemaining: days,
          urgency: actualUrgency,
          associatedRef: c.carrierCompany || '—',
          status: c.status,
          details: c.role,
        })
      })
    }

    const processDocuments = (documents: DocumentItem[], urgency: UrgencyKey) => {
      documents.forEach(d => {
        const days = getDaysRemaining(d.expiryDate)
        const actualUrgency = urgency === 'expiring' ? getUrgency(days) : urgency
        items.push({
          id: d.id,
          name: d.name,
          number: d.type,
          category: 'documents',
          categoryLabel: CATEGORY_META.documents.label,
          expiryDate: d.expiryDate,
          daysRemaining: days,
          urgency: actualUrgency,
          associatedRef: d.shipment?.reference || '—',
          status: d.status,
          details: d.category || d.type,
        })
      })
    }

    processPermits(data.expired.permits, 'expired')
    processCrew(data.expired.crew, 'expired')
    processDocuments(data.expired.documents, 'expired')

    processPermits(data.urgent.permits, 'urgent')
    processCrew(data.urgent.crew, 'urgent')
    processDocuments(data.urgent.documents, 'urgent')

    // Expiring items that are NOT urgent (30-90 days)
    const expiringNotUrgentPermits = data.expiring.permits.filter(p => {
      const days = getDaysRemaining(p.expiryDate)
      return days !== null && days > 30
    })
    const expiringNotUrgentCrew = data.expiring.crew.filter(c => {
      const days = getDaysRemaining(c.licenseExpiry)
      return days !== null && days > 30
    })
    const expiringNotUrgentDocs = data.expiring.documents.filter(d => {
      const days = getDaysRemaining(d.expiryDate)
      return days !== null && days > 30
    })

    processPermits(expiringNotUrgentPermits, 'expiring')
    processCrew(expiringNotUrgentCrew, 'expiring')
    processDocuments(expiringNotUrgentDocs, 'expiring')

    return items
  }, [data])

  // ─── Filtered items ─────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.number.toLowerCase().includes(search.toLowerCase()) ||
        item.associatedRef.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      const matchesUrgency = urgencyFilter === 'all' || item.urgency === urgencyFilter
      return matchesSearch && matchesCategory && matchesUrgency
    })
  }, [allItems, search, categoryFilter, urgencyFilter])

  // ─── Group items ────────────────────────────────────────────────
  const groupedItems = useMemo(() => {
    const groups: Record<string, FlatItem[]> = {}
    filteredItems.forEach(item => {
      let key: string
      if (groupBy === 'category') {
        key = item.category
      } else if (groupBy === 'urgency') {
        key = item.urgency
      } else {
        key = getMonthKey(item.expiryDate)
      }
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })

    // Sort keys
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupBy === 'urgency') {
        const order: Record<string, number> = { expired: 0, urgent: 1, expiring: 2, valid: 3 }
        return (order[a] ?? 99) - (order[b] ?? 99)
      }
      if (groupBy === 'month') {
        return a.localeCompare(b)
      }
      return a.localeCompare(b)
    })

    return sortedKeys.map(key => ({ key, items: groups[key] }))
  }, [filteredItems, groupBy])

  // ─── Stats ──────────────────────────────────────────────────────
  const summary = data?.summary
  const expiredCount = allItems.filter(i => i.urgency === 'expired').length
  const urgentCount = allItems.filter(i => i.urgency === 'urgent').length
  const expiringCount = allItems.filter(i => i.urgency === 'expiring').length
  const validCount = allItems.filter(i => i.urgency === 'valid').length

  const activeFilterCount = [categoryFilter !== 'all', urgencyFilter !== 'all', search !== ''].filter(Boolean).length

  // ─── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-32 rounded-full" />)}
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
        {/* ─── Summary Stats Bar ────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">{expiredCount} Vencidos</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{urgentCount} Urgente &lt;30d</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
            <Clock className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">{expiringCount} Próximos &lt;90d</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{validCount} Vigentes</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
            <CalendarIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{allItems.length} Total</span>
          </div>
        </div>

        {/* ─── Category Breakdown Cards ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Permits */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Certificaciones de Producto</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold">{summary?.permitsExpiring || 0}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">por vencer</span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">{summary?.permitsExpired || 0}</span>
                    <span className="text-[10px] text-red-600 dark:text-red-400">vencidos</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crew */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Licencias de Tripulación</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold">{summary?.crewExpiring || 0}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">por vencer</span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">{summary?.crewExpired || 0}</span>
                    <span className="text-[10px] text-red-600 dark:text-red-400">vencidas</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Documentos Regulatorios</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold">{summary?.documentsExpiring || 0}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">por vencer</span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">{summary?.documentsExpired || 0}</span>
                    <span className="text-[10px] text-red-600 dark:text-red-400">vencidos</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Filter Bar ───────────────────────────────────────────── */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-teal-50/80 via-white to-cyan-50/80 dark:from-teal-950/30 dark:via-background dark:to-cyan-950/30 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, número, envío..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[200px] h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="permits">📋 Certificaciones de Producto</SelectItem>
                    <SelectItem value="crew">👤 Licencias de Tripulación</SelectItem>
                    <SelectItem value="documents">📄 Documentos Regulatorios</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="w-[180px] h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                    <SelectValue placeholder="Urgencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las urgencias</SelectItem>
                    <SelectItem value="expired">🔴 Vencidos</SelectItem>
                    <SelectItem value="urgent">🟠 Urgente &lt;30d</SelectItem>
                    <SelectItem value="expiring">🟡 Próximos &lt;90d</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'category' | 'urgency' | 'month')}>
                  <SelectTrigger className="w-[160px] h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                    <SelectValue placeholder="Agrupar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgency">Por urgencia</SelectItem>
                    <SelectItem value="category">Por categoría</SelectItem>
                    <SelectItem value="month">Por mes</SelectItem>
                  </SelectContent>
                </Select>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-6 px-2 text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                    {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Alert Banner for Expired Items ───────────────────────── */}
        {expiredCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
              <BellRing className="w-4 h-4 text-red-600 dark:text-red-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                {expiredCount} elemento{expiredCount > 1 ? 's' : ''} vencido{expiredCount > 1 ? 's' : ''} requiere{expiredCount === 1 ? '' : 'n'} atención inmediata
              </p>
              <p className="text-[11px] text-red-600 dark:text-red-300">
                Revise y renueve los elementos vencidos para evitar multas y retrasos operativos
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/50"
              onClick={() => setUrgencyFilter('expired')}
            >
              Ver vencidos
            </Button>
          </motion.div>
        )}

        {/* ─── Main Content: Grouped Items ──────────────────────────── */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Calendario de Vencimientos ({filteredItems.length})
              </CardTitle>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <ArrowUpDown className="w-3 h-3" />
                Agrupado por {groupBy === 'urgency' ? 'urgencia' : groupBy === 'category' ? 'categoría' : 'mes'}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[calc(100vh-460px)]">
              <div className="p-4 space-y-4">
                {groupedItems.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No se encontraron elementos</p>
                    <p className="text-xs text-muted-foreground mt-1">Ajuste los filtros para ver resultados</p>
                  </div>
                ) : (
                  groupedItems.map((group) => {
                    const groupKey = group.key
                    let groupLabel: string
                    let groupIcon: React.ElementType
                    let groupColor: string

                    if (groupBy === 'urgency') {
                      const meta = URGENCY_META[groupKey as UrgencyKey]
                      groupLabel = meta?.label || groupKey
                      groupIcon = groupKey === 'expired' ? XCircle : groupKey === 'urgent' ? AlertTriangle : groupKey === 'expiring' ? Clock : CheckCircle2
                      groupColor = meta?.color || 'text-muted-foreground'
                    } else if (groupBy === 'category') {
                      const meta = CATEGORY_META[groupKey as CategoryKey]
                      groupLabel = meta?.label || groupKey
                      groupIcon = meta?.icon || FileCheck
                      groupColor = meta?.color || 'text-muted-foreground'
                    } else {
                      groupLabel = getMonthLabel(groupKey)
                      groupIcon = CalendarIcon
                      groupColor = 'text-teal-600 dark:text-teal-400'
                    }

                    // Count urgency items in group
                    const groupExpired = group.items.filter(i => i.urgency === 'expired').length
                    const groupUrgent = group.items.filter(i => i.urgency === 'urgent').length

                    return (
                      <motion.div
                        key={groupKey}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        {/* Group Header */}
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/30">
                          <groupIcon className={`w-4 h-4 ${groupColor}`} />
                          <span className={`text-sm font-semibold ${groupColor}`}>{groupLabel}</span>
                          <Badge variant="secondary" className="text-[10px] h-5">{group.items.length}</Badge>
                          {groupExpired > 0 && (
                            <Badge variant="secondary" className="text-[9px] h-5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
                              {groupExpired} vencido{groupExpired > 1 ? 's' : ''}
                            </Badge>
                          )}
                          {groupUrgent > 0 && (
                            <Badge variant="secondary" className="text-[9px] h-5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                              {groupUrgent} urgente{groupUrgent > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>

                        {/* Items */}
                        <div className="space-y-1.5 pl-2">
                          {group.items.map((item, idx) => {
                            const urgencyMeta = URGENCY_META[item.urgency]
                            const catMeta = CATEGORY_META[item.category]
                            const CatIcon = catMeta.icon

                            // Calculate progress percentage (time remaining out of 365 days)
                            const progressValue = item.daysRemaining !== null
                              ? Math.max(0, Math.min(100, (item.daysRemaining / 365) * 100))
                              : 100

                            return (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className={`flex items-center gap-3 p-3 rounded-lg border ${urgencyMeta.border} ${item.urgency === 'expired' ? 'bg-red-50/40 dark:bg-red-950/10' : item.urgency === 'urgent' ? 'bg-amber-50/40 dark:bg-amber-950/10' : 'bg-background hover:bg-muted/30'} transition-colors`}
                              >
                                {/* Urgency dot */}
                                <div className={`w-2.5 h-2.5 rounded-full ${urgencyMeta.dotColor} flex-shrink-0 ${item.urgency === 'expired' || item.urgency === 'urgent' ? 'animate-pulse' : ''}`} />

                                {/* Category icon */}
                                <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${item.category === 'permits' ? 'bg-teal-100 dark:bg-teal-900/30' : item.category === 'crew' ? 'bg-sky-100 dark:bg-sky-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                                  <CatIcon className={`w-3.5 h-3.5 ${catMeta.color}`} />
                                </div>

                                {/* Item info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                    <span className="text-[10px] font-mono text-muted-foreground">{item.number}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-muted-foreground">
                                      {item.category === 'crew' ? 'Empresa' : 'Envío'}: {item.associatedRef}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">•</span>
                                    <span className="text-[10px] text-muted-foreground">{item.details}</span>
                                  </div>
                                </div>

                                {/* Expiry date and days */}
                                <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[120px]">
                                  <span className="text-xs text-muted-foreground">{formatDate(item.expiryDate)}</span>
                                  {item.daysRemaining !== null && (
                                    <Badge variant="secondary" className={`text-[9px] h-4 ${urgencyMeta.bg} ${urgencyMeta.color} border-0`}>
                                      {item.daysRemaining < 0
                                        ? `Vencido hace ${Math.abs(item.daysRemaining)}d`
                                        : item.daysRemaining === 0
                                          ? 'Vence hoy'
                                          : `${item.daysRemaining}d restantes`}
                                    </Badge>
                                  )}
                                </div>

                                {/* Progress bar */}
                                <div className="w-20 flex-shrink-0 hidden sm:block">
                                  <Progress
                                    value={progressValue}
                                    className={`h-1.5 ${urgencyMeta.progressColor}`}
                                  />
                                </div>

                                {/* Alert indicator for expired/urgent */}
                                {(item.urgency === 'expired' || item.urgency === 'urgent') && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="inline-flex">
                                        <BadgeAlert className={`w-4 h-4 ${item.urgency === 'expired' ? 'text-red-500' : 'text-amber-500'} animate-pulse`} />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="shadow-xl">
                                      <p className="text-xs font-semibold">
                                        {item.urgency === 'expired' ? 'Vencido — requiere acción inmediata' : 'Urgente — vence pronto'}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </motion.div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ─── Monthly Timeline Visual ──────────────────────────────── */}
        {allItems.length > 0 && (
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Timer className="w-4 h-4 text-teal-500" />
                Línea de Tiempo — Próximos 6 Meses
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-end gap-1 h-32">
                {(() => {
                  const months: { key: string; label: string; count: number; expired: number; urgent: number }[] = []
                  const now = new Date()
                  for (let i = 0; i < 6; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
                    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                    const label = d.toLocaleDateString('es-MX', { month: 'short' })
                    const monthItems = allItems.filter(item => getMonthKey(item.expiryDate) === key)
                    months.push({
                      key,
                      label,
                      count: monthItems.length,
                      expired: monthItems.filter(i => i.urgency === 'expired').length,
                      urgent: monthItems.filter(i => i.urgency === 'urgent').length,
                    })
                  }
                  const maxCount = Math.max(...months.map(m => m.count), 1)

                  return months.map((m) => {
                    const barHeight = Math.max(4, (m.count / maxCount) * 100)
                    const hasExpired = m.expired > 0
                    const hasUrgent = m.urgent > 0

                    return (
                      <Tooltip key={m.key}>
                        <TooltipTrigger asChild>
                          <div className="flex-1 flex flex-col items-center gap-1 cursor-default">
                            <span className="text-[10px] font-medium text-muted-foreground">{m.count}</span>
                            <div
                              className={`w-full rounded-t-md transition-all duration-300 ${
                                hasExpired ? 'bg-red-400 dark:bg-red-500' :
                                hasUrgent ? 'bg-amber-400 dark:bg-amber-500' :
                                m.count > 0 ? 'bg-teal-400 dark:bg-teal-500' :
                                'bg-muted-foreground/20'
                              }`}
                              style={{ height: `${barHeight}%`, minHeight: '4px' }}
                            />
                            <span className="text-[10px] text-muted-foreground capitalize">{m.label}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="shadow-xl">
                          <p className="text-xs font-semibold">{m.count} elemento{m.count !== 1 ? 's' : ''} en {m.label}</p>
                          {m.expired > 0 && <p className="text-[10px] text-red-400">{m.expired} vencido{m.expired > 1 ? 's' : ''}</p>}
                          {m.urgent > 0 && <p className="text-[10px] text-amber-400">{m.urgent} urgente{m.urgent > 1 ? 's' : ''}</p>}
                        </TooltipContent>
                      </Tooltip>
                    )
                  })
                })()}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </TooltipProvider>
  )
}
