'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, FileText, AlertTriangle, HardDrive, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

const DOC_STATUS_COLORS: Record<string, string> = {
  'Vigente': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Vencido': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Pendiente': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const DOC_TYPE_ICONS: Record<string, string> = {
  'Bill of Lading': '📄',
  'BL': '📄',
  'Factura Comercial': '💰',
  'Lista de Empaque': '📦',
  'Certificado de Origen': '🌍',
  'Seguro de Carga': '🛡️',
  'Seguro': '🛡️',
  'Póliza de Seguro': '🛡️',
  'Manifiesto de Carga': '📋',
  'Declaración Aduanera': '📋',
  'Certificado Fitosanitario': '🌿',
}

const DOC_CATEGORY_COLORS: Record<string, string> = {
  'Transporte': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'Comercial': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Aduanal': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Seguro': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  'Legal': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

const DOC_TYPES = ['Bill of Lading', 'Factura Comercial', 'Lista de Empaque', 'Certificado de Origen', 'Seguro de Carga', 'Manifiesto de Carga', 'Declaración Aduanera', 'Certificado Fitosanitario']
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

function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function getFileSizeIcon(size: string | null): string {
  if (!size) return ''
  const numStr = size.replace(/[^0-9.]/g, '')
  const num = parseFloat(numStr)
  if (num >= 5) return '📁'
  if (num >= 1) return '📂'
  return '📄'
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

  // Stats
  const totalDocs = documents.length
  const vigentes = documents.filter(d => d.status === 'Vigente').length
  const pendientes = documents.filter(d => d.status === 'Pendiente').length
  const vencidos = documents.filter(d => d.status === 'Vencido').length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Summary Stats Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
          <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{totalDocs} Total</span>
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
              <Input placeholder="Buscar documentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px] h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{DOC_TYPE_ICONS[t] || '📋'} {t}</SelectItem>)}
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
            <ScrollArea className="max-h-[calc(100vh-340px)]">
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
                  {documents.map((d) => {
                    const daysUntilExpiry = getDaysUntilExpiry(d.expiryDate)
                    const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0
                    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30
                    const typeIcon = DOC_TYPE_ICONS[d.type] || '📋'
                    const categoryColor = DOC_CATEGORY_COLORS[d.category || ''] || ''

                    return (
                      <TableRow
                        key={d.id}
                        className={
                          isExpired ? 'bg-red-50 dark:bg-red-950/20' :
                          isExpiringSoon ? 'bg-amber-50 dark:bg-amber-950/20' : ''
                        }
                      >
                        <TableCell className="font-medium text-sm max-w-[200px] truncate">
                          <div className="flex items-center gap-1.5">
                            {(isExpiringSoon || isExpired) && (
                              <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${isExpired ? 'text-red-500' : 'text-amber-500'}`} />
                            )}
                            <span className={isExpired ? 'line-through text-muted-foreground' : ''}>{d.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="mr-1">{typeIcon}</span>{d.type}
                        </TableCell>
                        <TableCell className="text-sm">
                          {d.category ? (
                            <Badge variant="secondary" className={`text-[10px] ${categoryColor}`}>{d.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{d.shipment?.reference || '—'}</TableCell>
                        <TableCell className="text-sm">{new Date(d.uploadDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            {d.expiryDate ? (
                              <>
                                <span className={isExpiringSoon ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                                  {new Date(d.expiryDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                </span>
                                {isExpiringSoon && !isExpired && (
                                  <span className="text-[10px] text-amber-500 font-medium">({daysUntilExpiry}d)</span>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`text-xs ${DOC_STATUS_COLORS[d.status] || ''}`}>{d.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {d.fileSize ? (
                            <div className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3 text-muted-foreground" />
                              <span>{d.fileSize}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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
    </motion.div>
  )
}
