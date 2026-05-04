'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Plus, FileCheck, AlertTriangle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

const PERMIT_STATUS_COLORS: Record<string, string> = {
  'Vigente': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Pendiente': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Vencido': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'En trámite': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'Pendiente de renovación': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const PERMIT_STATUS_BORDER: Record<string, string> = {
  'Vigente': 'border-l-emerald-500',
  'Pendiente': 'border-l-amber-500',
  'Vencido': 'border-l-red-500',
  'En trámite': 'border-l-cyan-500',
  'Pendiente de renovación': 'border-l-amber-500',
}

const PERMIT_TYPE_ICONS: Record<string, string> = {
  'Importación': '📥',
  'Exportación': '📤',
  'Sanitario': '🏥',
  'Fitosanitario': '🌿',
  'Arma Naval': '⚓',
  'Zona Franca': '🏭',
  'Tránsito Aduanero': '🚢',
  'Aduanal': '📋',
}

const PERMIT_TYPES = ['Importación', 'Exportación', 'Sanitario', 'Fitosanitario', 'Aduanal', 'Arma Naval', 'Zona Franca', 'Tránsito Aduanero']
const PERMIT_STATUSES = ['Vigente', 'Pendiente', 'Vencido', 'En trámite', 'Pendiente de renovación']
const AUTHORITIES = ['SAT', 'SENASICA', 'COFEPRIS', 'Secretaría de Economía', 'Aduana Marítima']

interface Permit {
  id: string
  type: string
  number: string
  shipmentId: string
  issueDate: string | null
  expiryDate: string | null
  status: string
  authority: string
  notes: string | null
  shipment: { reference: string }
}

function getDaysRemaining(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getDaysRemainingColor(days: number | null): string {
  if (days === null) return ''
  if (days < 0) return 'text-red-600 dark:text-red-400'
  if (days <= 30) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

function getExpiryProgress(issueDate: string | null, expiryDate: string | null): number {
  if (!issueDate || !expiryDate) return 0
  const start = new Date(issueDate).getTime()
  const end = new Date(expiryDate).getTime()
  const now = Date.now()
  if (end <= start) return 100
  const progress = ((now - start) / (end - start)) * 100
  return Math.max(0, Math.min(100, progress))
}

function getExpiryProgressColor(progress: number): string {
  if (progress >= 90) return 'bg-red-500'
  if (progress >= 70) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export function Permits() {
  const [permits, setPermits] = useState<Permit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [shipments, setShipments] = useState<{ id: string; reference: string }[]>([])

  const fetchPermits = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, status: statusFilter, type: typeFilter })
      const res = await fetch(`/api/permits?${params}`)
      const data = await res.json()
      setPermits(data)
    } catch {
      console.error('Error fetching permits')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, typeFilter])

  useEffect(() => {
    fetchPermits()
  }, [fetchPermits])

  useEffect(() => {
    fetch('/api/shipments?pageSize=100')
      .then((r) => r.json())
      .then((d) => setShipments((d.shipments || []).map((s: { id: string; reference: string }) => ({ id: s.id, reference: s.reference }))))
      .catch(() => {})
  }, [])

  // Stats
  const totalPermits = permits.length
  const vigentes = permits.filter(p => p.status === 'Vigente').length
  const pendientes = permits.filter(p => ['Pendiente', 'Pendiente de renovación', 'En trámite'].includes(p.status)).length
  const vencidos = permits.filter(p => p.status === 'Vencido').length

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = {
      type: form.get('type') as string,
      number: form.get('number') as string,
      shipmentId: form.get('shipmentId') as string,
      authority: form.get('authority') as string,
      issueDate: form.get('issueDate') as string || null,
      expiryDate: form.get('expiryDate') as string || null,
      status: 'Pendiente',
    }
    await fetch('/api/permits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowAdd(false)
    fetchPermits()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Summary Stats Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
          <FileCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{totalPermits} Total</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{vigentes} Vigentes</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{pendientes} Pendientes</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs font-semibold text-red-700 dark:text-red-300">{vencidos} Vencidos</span>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por número de permiso..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {PERMIT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {PERMIT_TYPES.map((t) => <SelectItem key={t} value={t}>{PERMIT_TYPE_ICONS[t] || ''} {t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAdd(true)} className="h-9 bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-1" /> Nuevo Permiso
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Permisos ({permits.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-320px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ref. Envío</TableHead>
                    <TableHead>Autoridad</TableHead>
                    <TableHead>Emisión</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Días restantes</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permits.map((p) => {
                    const daysRemaining = getDaysRemaining(p.expiryDate)
                    const isExpired = daysRemaining !== null && daysRemaining < 0
                    const isExpiringSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 30
                    const progress = getExpiryProgress(p.issueDate, p.expiryDate)
                    const typeIcon = PERMIT_TYPE_ICONS[p.type] || '📋'

                    return (
                      <TableRow
                        key={p.id}
                        className={`border-l-4 ${PERMIT_STATUS_BORDER[p.status] || ''} ${
                          isExpired ? 'bg-red-50 dark:bg-red-950/20' : isExpiringSoon ? 'bg-amber-50 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <TableCell className={`font-medium text-sm font-mono ${isExpired ? 'line-through text-muted-foreground' : ''}`}>
                          {p.number}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="mr-1">{typeIcon}</span>{p.type}
                        </TableCell>
                        <TableCell className="text-sm">{p.shipment?.reference || '—'}</TableCell>
                        <TableCell className="text-sm">{p.authority}</TableCell>
                        <TableCell className="text-sm">{p.issueDate ? new Date(p.issueDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</TableCell>
                        <TableCell className="text-sm">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</TableCell>
                        <TableCell className="text-sm">
                          {daysRemaining !== null ? (
                            <div className="flex items-center gap-1">
                              {isExpiringSoon && !isExpired && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                              <span className={`font-medium ${getDaysRemainingColor(daysRemaining)}`}>
                                {isExpired ? 'Vencido' : `${daysRemaining} días`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${getExpiryProgressColor(progress)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-xs ${PERMIT_STATUS_COLORS[p.status] || ''}`}>{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add Permit Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-500" /> Nuevo Permiso
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Número de Permiso</Label>
              <Input name="number" placeholder="PER-XXXX-XXXXX" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select name="type" defaultValue="Importación">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PERMIT_TYPES.map((t) => <SelectItem key={t} value={t}>{PERMIT_TYPE_ICONS[t]} {t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Autoridad</Label>
                <Select name="authority" defaultValue="SAT">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUTHORITIES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Envío Relacionado</Label>
              <Select name="shipmentId" required>
                <SelectTrigger><SelectValue placeholder="Seleccionar envío" /></SelectTrigger>
                <SelectContent>
                  {shipments.map((s) => <SelectItem key={s.id} value={s.id}>{s.reference}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Emisión</Label>
                <Input name="issueDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Input name="expiryDate" type="date" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700">Crear Permiso</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
