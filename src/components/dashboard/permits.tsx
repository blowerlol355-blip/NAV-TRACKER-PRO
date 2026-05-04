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
import { Search, Plus, FileCheck } from 'lucide-react'
import { motion } from 'framer-motion'

const PERMIT_STATUS_COLORS: Record<string, string> = {
  'Vigente': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Pendiente': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Vencido': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'En trámite': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'Pendiente de renovación': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const PERMIT_TYPES = ['Importación', 'Exportación', 'Sanitario', 'Fitosanitario', 'Aduanal']
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
                {PERMIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
            <ScrollArea className="max-h-[calc(100vh-280px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ref. Envío</TableHead>
                    <TableHead>Autoridad</TableHead>
                    <TableHead>Fecha Emisión</TableHead>
                    <TableHead>Fecha Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permits.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm font-mono">{p.number}</TableCell>
                      <TableCell className="text-sm">{p.type}</TableCell>
                      <TableCell className="text-sm">{p.shipment?.reference || '—'}</TableCell>
                      <TableCell className="text-sm">{p.authority}</TableCell>
                      <TableCell className="text-sm">{p.issueDate ? new Date(p.issueDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</TableCell>
                      <TableCell className="text-sm">{p.expiryDate ? new Date(p.expiryDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${PERMIT_STATUS_COLORS[p.status] || ''}`}>{p.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
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
                    {PERMIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
