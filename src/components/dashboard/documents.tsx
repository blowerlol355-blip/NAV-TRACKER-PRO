'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip'
import {
  Search, FileText, AlertTriangle, HardDrive, Clock,
  Ship, DollarSign, Package, Globe, Shield, FileCheck,
  ClipboardList, Leaf, Download, CheckCircle2,
  Hourglass, Link2, Copy, Eye, Building, Hash, CalendarDays,
  TrendingUp, FlaskConical, Scale, TreePine, Microscope,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const DOC_STATUS_COLORS: Record<string, string> = {
  'Vigente': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Vencido': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Pendiente': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
}

const DOC_TYPE_ICONS_LUCIDE: Record<string, React.ElementType> = {
  'Bill of Lading': Ship,
  'BL': Ship,
  'Factura Comercial': DollarSign,
  'Lista de Empaque': Package,
  'Certificado de Origen': Globe,
  'Seguro de Carga': Shield,
  'Seguro': Shield,
  'Póliza de Seguro': Shield,
  'Manifiesto de Carga': ClipboardList,
  'Declaración Aduanera': FileCheck,
  'Certificado Fitosanitario': Leaf,
  'Certificado Zoosanitario': Microscope,
  'Certificado FDA': FlaskConical,
  'Declaración EUDR': TreePine,
  'Certificado REACH': FlaskConical,
  'Declaración CBAM': TrendingUp,
  'Declaración Lacey Act': TreePine,
}

const DOC_TYPE_COLORS: Record<string, string> = {
  'Bill of Lading': 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30',
  'BL': 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30',
  'Factura Comercial': 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
  'Lista de Empaque': 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
  'Certificado de Origen': 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
  'Seguro de Carga': 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
  'Seguro': 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
  'Póliza de Seguro': 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30',
  'Manifiesto de Carga': 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  'Declaración Aduanera': 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  'Certificado Fitosanitario': 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
  'Certificado Zoosanitario': 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
  'Certificado FDA': 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30',
  'Declaración EUDR': 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
  'Certificado REACH': 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30',
  'Declaración CBAM': 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
  'Declaración Lacey Act': 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
}

// Category definitions with their icons and subtypes
const DOC_CATEGORIES = [
  {
    id: 'Transporte',
    label: 'Transporte',
    icon: Ship,
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    activeColor: 'bg-teal-500 text-white border-teal-600',
    subtypes: ['Bill of Lading', 'Manifiesto de Carga'],
  },
  {
    id: 'Comercial',
    label: 'Comercial',
    icon: DollarSign,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    activeColor: 'bg-amber-500 text-white border-amber-600',
    subtypes: ['Factura Comercial', 'Lista de Empaque'],
  },
  {
    id: 'Seguro',
    label: 'Seguro',
    icon: Shield,
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    activeColor: 'bg-sky-500 text-white border-sky-600',
    subtypes: ['Certificado de Seguro', 'Póliza de Seguro'],
  },
  {
    id: 'Aduana',
    label: 'Aduana',
    icon: FileCheck,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    activeColor: 'bg-orange-500 text-white border-orange-600',
    subtypes: ['Declaración Aduanera', 'Certificado de Origen'],
  },
  {
    id: 'Sanitario',
    label: 'Sanitario',
    icon: Leaf,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    activeColor: 'bg-emerald-500 text-white border-emerald-600',
    subtypes: ['Certificado Fitosanitario', 'Certificado Zoosanitario', 'Certificado FDA'],
  },
  {
    id: 'Regulatorio',
    label: 'Regulatorio',
    icon: Scale,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    activeColor: 'bg-violet-500 text-white border-violet-600',
    subtypes: ['Declaración EUDR', 'Certificado REACH', 'Declaración CBAM', 'Declaración Lacey Act'],
  },
]

const DOC_CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Transporte': Ship,
  'Comercial': DollarSign,
  'Seguro': Shield,
  'Aduana': FileCheck,
  'Sanitario': Leaf,
  'Regulatorio': Scale,
  'Legal': FileText,
  'Aduanal': FileCheck,
}

const DOC_CATEGORY_COLORS: Record<string, string> = {
  'Transporte': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  'Comercial': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  'Aduanal': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
  'Aduana': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
  'Seguro': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
  'Sanitario': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
  'Regulatorio': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
  'Legal': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
}

const DOC_TYPES = ['Bill of Lading', 'Factura Comercial', 'Lista de Empaque', 'Certificado de Origen', 'Seguro de Carga', 'Manifiesto de Carga', 'Declaración Aduanera', 'Certificado Fitosanitario']
const DOC_STATUSES = ['Vigente', 'Vencido', 'Pendiente']

interface Document {
  id: string
  name: string
  type: string
  category: string | null
  shipmentId: string
  uploadDate: string
  expiryDate: string | null
  status: string
  fileSize: string | null
  documentSubtype: string | null
  issuingAuthority: string | null
  documentNumber: string | null
  isVerified: boolean
  blockchainHash: string | null
  shipment: { reference: string }
}

function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function parseFileSizeToKB(size: string | null): number {
  if (!size) return 0
  const numStr = size.replace(/[^0-9.]/g, '')
  const num = parseFloat(numStr)
  if (size.toLowerCase().includes('mb')) return num * 1024
  if (size.toLowerCase().includes('kb')) return num
  return num
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function Documents() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [copiedHash, setCopiedHash] = useState(false)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, type: typeFilter, status: statusFilter, category: categoryFilter })
      const res = await fetch(`/api/documents?${params}`)
      const data = await res.json()
      setDocuments(data)
    } catch {
      console.error('Error fetching documents')
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter, categoryFilter])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Stats
  const totalDocs = documents.length
  const verifiedDocs = documents.filter(d => d.isVerified).length
  const verifiedPercent = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 0
  const expiringSoonDocs = documents.filter(d => {
    const days = getDaysUntilExpiry(d.expiryDate)
    return days !== null && days >= 0 && days <= 30
  }).length
  const blockchainDocs = documents.filter(d => d.blockchainHash).length
  const vigentes = documents.filter(d => d.status === 'Vigente').length
  const pendientes = documents.filter(d => d.status === 'Pendiente').length
  const vencidos = documents.filter(d => d.status === 'Vencido').length

  // Category breakdown for mini chart
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    documents.forEach(d => {
      const cat = d.category || 'Sin categoría'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [documents])

  // Max file size for relative bar chart
  const maxFileSizeKB = useMemo(() => {
    if (documents.length === 0) return 1
    return Math.max(...documents.map(d => parseFileSizeToKB(d.fileSize)), 1)
  }, [documents])

  const getDocTypeIcon = (type: string): React.ElementType => {
    return DOC_TYPE_ICONS_LUCIDE[type] || FileText
  }

  const openDocDetail = (doc: Document) => {
    setSelectedDoc(doc)
    setDialogOpen(true)
  }

  const copyBlockchainHash = (hash: string) => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopiedHash(true)
      setTimeout(() => setCopiedHash(false), 2000)
    })
  }

  const exportCSV = () => {
    const headers = ['Nombre', 'Tipo', 'Categoría', 'Subtipo', 'Estado', 'Verificado', 'Blockchain', 'Autoridad Emisora', 'Número Documento', 'Envío', 'Fecha Subida', 'Fecha Vencimiento', 'Tamaño']
    const rows = documents.map(d => [
      d.name,
      d.type,
      d.category || '',
      d.documentSubtype || '',
      d.status,
      d.isVerified ? 'Sí' : 'No',
      d.blockchainHash ? 'Sí' : 'No',
      d.issuingAuthority || '',
      d.documentNumber || '',
      d.shipment?.reference || '',
      d.uploadDate ? formatDate(d.uploadDate) : '',
      d.expiryDate ? formatDate(d.expiryDate) : '',
      d.fileSize || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `documentos_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Gestión Documental</h2>
            <p className="text-sm text-muted-foreground">{totalDocs} documentos registrados</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV} disabled={documents.length === 0}>
          <Download className="w-3.5 h-3.5" /> Exportar CSV
        </Button>
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
                  <p className="text-lg font-bold">{totalDocs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Verificados</p>
                  <p className="text-lg font-bold">{verifiedDocs} <span className="text-xs font-normal text-muted-foreground">({verifiedPercent}%)</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Por Vencer</p>
                  <p className="text-lg font-bold">{expiringSoonDocs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Blockchain</p>
                  <p className="text-lg font-bold">{blockchainDocs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="col-span-2 sm:col-span-1">
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Distribución</p>
              <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                {vigentes > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-emerald-500 transition-all" style={{ width: `${(vigentes / totalDocs) * 100}%` }} />
                    </TooltipTrigger>
                    <TooltipContent>{vigentes} Vigentes</TooltipContent>
                  </Tooltip>
                )}
                {pendientes > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-amber-500 transition-all" style={{ width: `${(pendientes / totalDocs) * 100}%` }} />
                    </TooltipTrigger>
                    <TooltipContent>{pendientes} Pendientes</TooltipContent>
                  </Tooltip>
                )}
                {vencidos > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="bg-red-500 transition-all" style={{ width: `${(vencidos / totalDocs) * 100}%` }} />
                    </TooltipTrigger>
                    <TooltipContent>{vencidos} Vencidos</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Vigentes</span>
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pendientes</span>
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Vencidos</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className={`h-8 text-xs gap-1.5 ${categoryFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          <FileText className="w-3.5 h-3.5" /> Todos
        </Button>
        {DOC_CATEGORIES.map((cat) => {
          const CatIcon = cat.icon
          const isActive = categoryFilter === cat.id
          const count = documents.filter(d => d.category === cat.id).length
          return (
            <Button
              key={cat.id}
              variant="outline"
              size="sm"
              className={`h-8 text-xs gap-1.5 ${isActive ? cat.activeColor : cat.color}`}
              onClick={() => setCategoryFilter(isActive ? 'all' : cat.id)}
            >
              <CatIcon className="w-3.5 h-3.5" /> {cat.label}
              {count > 0 && (
                <Badge variant="secondary" className={`text-[9px] h-4 px-1 ml-0.5 ${isActive ? 'bg-white/20 text-white' : ''}`}>
                  {count}
                </Badge>
              )}
            </Button>
          )
        })}
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
                {DOC_TYPES.map((t) => {
                  const Icon = getDocTypeIcon(t)
                  return <SelectItem key={t} value={t}><span className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {t}</span></SelectItem>
                })}
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
            <ScrollArea className="max-h-[calc(100vh-520px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Envío</TableHead>
                    <TableHead>Verificación</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tamaño</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {documents.map((d, idx) => {
                      const daysUntilExpiry = getDaysUntilExpiry(d.expiryDate)
                      const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0
                      const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30
                      const TypeIcon = getDocTypeIcon(d.type)
                      const typeColor = DOC_TYPE_COLORS[d.type] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      const categoryColor = DOC_CATEGORY_COLORS[d.category || ''] || ''
                      const CategoryIcon = DOC_CATEGORY_ICONS[d.category || ''] || FileText
                      const fileSizeKB = parseFileSizeToKB(d.fileSize)
                      const fileSizePercent = maxFileSizeKB > 0 ? Math.round((fileSizeKB / maxFileSizeKB) * 100) : 0

                      return (
                        <motion.tr
                          key={d.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className={`group cursor-pointer border-b transition-colors hover:bg-teal-50/50 dark:hover:bg-teal-950/20 hover:border-l-2 hover:border-l-teal-400 ${
                            isExpired ? 'bg-red-50/50 dark:bg-red-950/20' :
                            isExpiringSoon ? 'bg-amber-50/30 dark:bg-amber-950/10' :
                            idx % 2 === 1 ? 'bg-muted/20' : ''
                          }`}
                          onClick={() => openDocDetail(d)}
                        >
                          {/* Document Name + Type */}
                          <TableCell className="font-medium text-sm max-w-[220px]">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                                <TypeIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {(isExpiringSoon || isExpired) && (
                                    <AlertTriangle className={`w-3 h-3 flex-shrink-0 ${isExpired ? 'text-red-500' : 'text-amber-500'}`} />
                                  )}
                                  <span className={`truncate ${isExpired ? 'line-through text-muted-foreground' : ''}`}>
                                    {d.name}
                                  </span>
                                </div>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <span>{d.type}</span>
                                  {d.documentSubtype && (
                                    <>
                                      <span>·</span>
                                      <span className="italic">{d.documentSubtype}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* Category */}
                          <TableCell className="text-sm">
                            {d.category ? (
                              <Badge variant="secondary" className={`text-[10px] gap-1 ${categoryColor}`}>
                                <CategoryIcon className="w-3 h-3" />
                                {d.category}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>

                          {/* Shipment */}
                          <TableCell className="text-sm">
                            <span className="font-mono text-xs">{d.shipment?.reference || '—'}</span>
                          </TableCell>

                          {/* Verification Status */}
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1.5">
                              {d.isVerified ? (
                                <Badge variant="secondary" className="text-[10px] gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" /> Verificado
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <Hourglass className="w-3 h-3" /> Pendiente
                                </Badge>
                              )}
                              {d.blockchainHash && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="w-5 h-5 rounded flex items-center justify-center bg-violet-100 dark:bg-violet-900/30">
                                      <Link2 className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Registrado en Blockchain</p>
                                    <p className="font-mono text-[10px] max-w-[200px] truncate">{d.blockchainHash}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>

                          {/* Expiry */}
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1">
                              {d.expiryDate ? (
                                <>
                                  <span className={isExpiringSoon ? 'text-amber-600 dark:text-amber-400 font-medium' : isExpired ? 'text-red-500' : ''}>
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

                          {/* Status */}
                          <TableCell>
                            <Badge variant="secondary" className={`text-xs ${DOC_STATUS_COLORS[d.status] || ''}`}>{d.status}</Badge>
                          </TableCell>

                          {/* File Size */}
                          <TableCell className="text-sm">
                            {d.fileSize ? (
                              <div className="flex items-center gap-2 min-w-[90px]">
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-teal-400 dark:bg-teal-600 transition-all duration-500"
                                    style={{ width: `${fileSizePercent}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{d.fileSize}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>

                          {/* Action */}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => { e.stopPropagation(); openDocDetail(d) }}
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver
                            </Button>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Document Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDoc && (() => {
            const daysUntilExpiry = getDaysUntilExpiry(selectedDoc.expiryDate)
            const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0
            const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30
            const TypeIcon = getDocTypeIcon(selectedDoc.type)
            const typeColor = DOC_TYPE_COLORS[selectedDoc.type] || 'bg-slate-100 text-slate-700'
            const CategoryIcon = DOC_CATEGORY_ICONS[selectedDoc.category || ''] || FileText

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColor}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate">{selectedDoc.name}</div>
                      <DialogDescription className="flex items-center gap-2 mt-0.5">
                        <span>{selectedDoc.type}</span>
                        {selectedDoc.documentSubtype && (
                          <>
                            <span>·</span>
                            <span className="italic">{selectedDoc.documentSubtype}</span>
                          </>
                        )}
                      </DialogDescription>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                  {/* Verification & Blockchain Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className={`text-xs gap-1.5 ${DOC_STATUS_COLORS[selectedDoc.status] || ''}`}>
                      {selectedDoc.status}
                    </Badge>
                    {selectedDoc.isVerified ? (
                      <Badge variant="secondary" className="text-xs gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <Hourglass className="w-3.5 h-3.5" /> Verificación Pendiente
                      </Badge>
                    )}
                    {selectedDoc.blockchainHash && (
                      <Badge variant="secondary" className="text-xs gap-1 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                        <Link2 className="w-3.5 h-3.5" /> Blockchain
                      </Badge>
                    )}
                    {(isExpiringSoon || isExpired) && (
                      <Badge variant="secondary" className={`text-xs gap-1 ${isExpired ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800'}`}>
                        <AlertTriangle className="w-3.5 h-3.5" /> {isExpired ? 'Vencido' : `Vence en ${daysUntilExpiry} días`}
                      </Badge>
                    )}
                  </div>

                  {/* Document Info Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Category */}
                    <Card className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-teal-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Categoría</p>
                            <p className="text-sm font-medium">{selectedDoc.category || 'Sin categoría'}</p>
                            {selectedDoc.documentSubtype && (
                              <p className="text-[10px] text-muted-foreground italic">{selectedDoc.documentSubtype}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Issuing Authority */}
                    <Card className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-amber-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Autoridad Emisora</p>
                            <p className="text-sm font-medium truncate" title={selectedDoc.issuingAuthority || undefined}>
                              {selectedDoc.issuingAuthority || 'No especificada'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Document Number */}
                    <Card className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4 text-sky-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Número de Documento</p>
                            <p className="text-sm font-mono font-medium">{selectedDoc.documentNumber || 'No asignado'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Shipment */}
                    <Card className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Ship className="w-4 h-4 text-violet-500" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Envío Vinculado</p>
                            <p className="text-sm font-mono font-medium">{selectedDoc.shipment?.reference || '—'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* Dates Section */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <CalendarDays className="w-5 h-5 text-teal-500" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fecha de Subida</p>
                        <p className="text-sm font-medium">{formatDate(selectedDoc.uploadDate)}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 p-3 rounded-lg ${
                      isExpired ? 'bg-red-50 dark:bg-red-950/20' :
                      isExpiringSoon ? 'bg-amber-50 dark:bg-amber-950/20' :
                      'bg-muted/30'
                    }`}>
                      <Clock className={`w-5 h-5 ${isExpired ? 'text-red-500' : isExpiringSoon ? 'text-amber-500' : 'text-emerald-500'}`} />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fecha de Vencimiento</p>
                        <p className="text-sm font-medium">
                          {selectedDoc.expiryDate ? formatDate(selectedDoc.expiryDate) : 'Sin vencimiento'}
                        </p>
                        {daysUntilExpiry !== null && (
                          <p className={`text-[10px] font-medium ${
                            isExpired ? 'text-red-500' :
                            isExpiringSoon ? 'text-amber-500' :
                            'text-emerald-500'
                          }`}>
                            {isExpired
                              ? `Vencido hace ${Math.abs(daysUntilExpiry)} días`
                              : `${daysUntilExpiry} días restantes`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Hash */}
                  {selectedDoc.blockchainHash && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-violet-500" />
                          <h4 className="text-sm font-semibold">Hash Blockchain</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs font-mono p-2.5 rounded-md bg-muted break-all">
                            {selectedDoc.blockchainHash}
                          </code>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 flex-shrink-0"
                                onClick={() => copyBlockchainHash(selectedDoc.blockchainHash!)}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {copiedHash ? '¡Copiado!' : 'Copiar hash'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </>
                  )}

                  {/* File Info */}
                  {selectedDoc.fileSize && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Tamaño del archivo: {selectedDoc.fileSize}</span>
                    </div>
                  )}
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
