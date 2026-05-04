'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

const DOC_STATUS_COLORS: Record<string, string> = {
  'Vigente': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Vencido': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Pendiente': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const DOC_TYPES = ['Bill of Lading', 'Factura Comercial', 'Lista de Empaque', 'Certificado de Origen', 'Seguro de Carga', 'Manifiesto de Carga', 'Declaración Aduanera']
const DOC_STATUSES = ['Vigente', 'Vencido', 'Pendiente']
const DOC_CATEGORIES = ['Transporte', 'Comercial', 'Aduanal', 'Seguro', 'Legal']

interface Document {
  id: string
  name: string
  type: string
  category: string | null
  uploadDate: string
  expiryDate: string | null
  status: string
  fileSize: string | null
  shipment: { reference: string }
}

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, type: typeFilter, status: statusFilter })
      const res = await fetch(`/api/documents?${params}`)
      const data = await res.json()
      setDocuments(data)
    } catch {
      console.error('Error fetching documents')
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar documentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px] h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {DOC_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-500" /> Documentos ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-280px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Envío</TableHead>
                    <TableHead>Fecha Subida</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tamaño</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-sm max-w-[200px] truncate">{d.name}</TableCell>
                      <TableCell className="text-sm">{d.type}</TableCell>
                      <TableCell className="text-sm">{d.category || '—'}</TableCell>
                      <TableCell className="text-sm">{d.shipment?.reference || '—'}</TableCell>
                      <TableCell className="text-sm">{new Date(d.uploadDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</TableCell>
                      <TableCell className="text-sm">{d.expiryDate ? new Date(d.expiryDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${DOC_STATUS_COLORS[d.status] || ''}`}>{d.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{d.fileSize || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
