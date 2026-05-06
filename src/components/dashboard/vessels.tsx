'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus, Anchor, Ship, Gauge, Calendar, Building2, Flag, MapPin, Navigation, Clock, Package,
  ArrowRight, Printer, FileSpreadsheet, Search, LayoutGrid, List, Wrench, Activity,
  Cog, Globe2, BarChart3, Container
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { exportToCSV, printTable } from '@/lib/export-utils'
import RouteMapVisualization from './route-map'
import PortsMap from './ports-map'

const VESSEL_STATUS_COLORS: Record<string, string> = {
  'En tránsito': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'En puerto': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'Cargando': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Descargando': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'En mantenimiento': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'En reparación': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const VESSEL_STATUS_ACCENT: Record<string, string> = {
  'En tránsito': 'bg-orange-500',
  'En puerto': 'bg-sky-500',
  'Cargando': 'bg-amber-500',
  'Descargando': 'bg-orange-500',
  'En mantenimiento': 'bg-red-500',
  'En reparación': 'bg-red-500',
}

const VESSEL_STATUS_BORDER: Record<string, string> = {
  'En tránsito': 'border-l-orange-500',
  'En puerto': 'border-l-sky-500',
  'Cargando': 'border-l-amber-500',
  'Descargando': 'border-l-orange-500',
  'En mantenimiento': 'border-l-red-500',
  'En reparación': 'border-l-red-500',
}

const VESSEL_TYPES = ['Portacontenedores', 'Granelero', 'Tanque', 'Multipropósito', 'Ro-Ro', 'Crucero']

const FLAG_EMOJIS: Record<string, string> = {
  'Panamá': '🇵🇦',
  'Panama': '🇵🇦',
  'Liberia': '🇱🇷',
  'Marshall Islands': '🇲🇭',
  'Hong Kong': '🇭🇰',
  'Singapore': '🇸🇬',
  'Malta': '🇲🇹',
  'Bahamas': '🇧🇸',
  'China': '🇨🇳',
  'Greece': '🇬🇷',
  'Japan': '🇯🇵',
  'Norway': '🇳🇴',
  'Venezuela': '🇻🇪',
  'Colombia': '🇨🇴',
  'Brasil': '🇧🇷',
  'México': '🇲🇽',
  'Estados Unidos': '🇺🇸',
  'España': '🇪🇸',
  'Reino Unido': '🇬🇧',
  'Alemania': '🇩🇪',
  'Italia': '🇮🇹',
  'Corea del Sur': '🇰🇷',
}

// Fictional capacity utilization per vessel
const CAPACITY_UTILIZATION: Record<string, number> = {}

interface Vessel {
  id: string
  name: string
  imo: string
  flag: string
  type: string
  capacity: number
  currentLocation: string | null
  status: string
  speed: number | null
  built: number | null
  owner: string | null
}

interface Shipment {
  id: string
  reference: string
  origin: string
  destination: string
  status: string
  cargoType: string
  weight: number
  eta: string | null
  vesselId: string | null
}

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
}

function getFlagEmoji(flag: string): string {
  for (const [key, emoji] of Object.entries(FLAG_EMOJIS)) {
    if (flag.toLowerCase().includes(key.toLowerCase())) return emoji
  }
  return '🏴'
}

function getCapacityUtilization(vessel: Vessel): number {
  if (CAPACITY_UTILIZATION[vessel.id]) return CAPACITY_UTILIZATION[vessel.id]
  // Generate a deterministic utilization based on vessel id hash
  let hash = 0
  for (let i = 0; i < vessel.id.length; i++) {
    hash = ((hash << 5) - hash) + vessel.id.charCodeAt(i)
    hash |= 0
  }
  const util = 35 + Math.abs(hash % 55) // 35% - 89%
  CAPACITY_UTILIZATION[vessel.id] = util
  return util
}

function getUtilizationColor(util: number): string {
  if (util > 80) return 'bg-red-500'
  if (util > 60) return 'bg-amber-500'
  return 'bg-orange-500'
}

function getUtilizationTextColor(util: number): string {
  if (util > 80) return 'text-red-600 dark:text-red-400'
  if (util > 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-orange-600 dark:text-orange-400'
}

export function Vessels() {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)
  const attachmentsRef = useRef<HTMLInputElement | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [vesselShipments, setVesselShipments] = useState<Shipment[]>([])
  const [loadingShipments, setLoadingShipments] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [flagFilter, setFlagFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  useEffect(() => {
    fetch('/api/vessels')
      .then((r) => r.json())
      .then((d) => { setVessels(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/shipments?pageSize=200')
      .then((r) => r.json())
      .then((d) => { setShipments(d.shipments || []) })
      .catch(() => setShipments([]))
  }, [])

  const handleOpenDetail = async (vessel: Vessel) => {
    setSelectedVessel(vessel)
    setLoadingShipments(true)
    try {
      const res = await fetch('/api/shipments?pageSize=100')
      const data = await res.json()
      const allShipments: Shipment[] = data.shipments || []
      const filtered = allShipments.filter((s) => s.vesselId === vessel.id)
      setVesselShipments(filtered)
    } catch {
      setVesselShipments([])
    } finally {
      setLoadingShipments(false)
    }
  }

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const parts = result.split(',')
        resolve(parts[1] || '')
      }
      reader.onerror = (err) => reject(err)
      reader.readAsDataURL(file)
    })
    const body = {
      name: form.get('name') as string,
      imo: form.get('imo') as string,
      flag: form.get('flag') as string,
      type: form.get('type') as string,
      capacity: parseInt(form.get('capacity') as string) || 0,
      speed: parseFloat(form.get('speed') as string) || null,
      built: parseInt(form.get('built') as string) || null,
      owner: form.get('owner') as string || null,
      status: 'En puerto',
      currentLocation: 'Puerto de origen',
    }
    const inputEl = (e.currentTarget.querySelector('input[name="attachments"]') as HTMLInputElement | null)
    const files = inputEl?.files
    if (files && files.length > 0) {
      const arr = Array.from(files)
      const attachments = await Promise.all(arr.map(async (file) => ({
        filename: file.name,
        contentBase64: await fileToBase64(file),
        name: file.name,
        type: file.type || 'application/octet-stream',
      })))
      ;(body as any).attachments = attachments
    }
    await fetch('/api/vessels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowAdd(false)
    const res = await fetch('/api/vessels')
    setVessels(await res.json())
  }

  // Stats
  const totalVessels = vessels.length
  const inTransit = vessels.filter(v => v.status === 'En tránsito').length
  const inPort = vessels.filter(v => v.status === 'En puerto').length
  const underRepair = vessels.filter(v => ['En mantenimiento', 'En reparación'].includes(v.status)).length
  const avgSpeed = vessels.length > 0
    ? (vessels.reduce((sum, v) => sum + (v.speed || 0), 0) / vessels.filter(v => v.speed !== null).length).toFixed(1)
    : '0'
  const totalCapacity = vessels.reduce((sum, v) => sum + v.capacity, 0)

  // Filtered vessels
  const filteredVessels = vessels.filter(v => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.imo.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && v.status !== statusFilter) return false
    if (typeFilter !== 'all' && v.type !== typeFilter) return false
    if (flagFilter !== 'all' && v.flag !== flagFilter) return false
    return true
  })

  // Unique flags for filter
  const uniqueFlags = [...new Set(vessels.map(v => v.flag))].sort()

  // Export handlers
  const handleExportCSV = () => {
    const data = filteredVessels.map(v => ({
      name: v.name,
      imo: v.imo,
      flag: `${getFlagEmoji(v.flag)} ${v.flag}`,
      type: v.type,
      capacity: v.capacity.toString(),
      speed: v.speed?.toString() || '',
      built: v.built?.toString() || '',
      owner: v.owner || '',
      location: v.currentLocation || '',
      status: v.status,
      utilization: `${getCapacityUtilization(v)}%`,
    }))
    exportToCSV('embarcaciones-navtrack', data, {
      name: 'Nombre',
      imo: 'IMO',
      flag: 'Bandera',
      type: 'Tipo',
      capacity: 'Capacidad (TEU)',
      speed: 'Velocidad (nudos)',
      built: 'Año Construcción',
      owner: 'Propietario',
      location: 'Ubicación',
      status: 'Estado',
      utilization: 'Utilización',
    })
  }

  const handlePrint = () => {
    printTable('Embarcaciones', [
      { key: 'name', label: 'Nombre' },
      { key: 'imo', label: 'IMO' },
      { key: 'flag', label: 'Bandera' },
      { key: 'type', label: 'Tipo' },
      { key: 'capacity', label: 'Capacidad (TEU)' },
      { key: 'location', label: 'Ubicación' },
      { key: 'status', label: 'Estado' },
    ], filteredVessels.map(v => ({
      name: v.name,
      imo: v.imo,
      flag: `${getFlagEmoji(v.flag)} ${v.flag}`,
      type: v.type,
      capacity: v.capacity.toLocaleString(),
      location: v.currentLocation || '',
      status: v.status,
    })))
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Enhanced Statistics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Embarcaciones</p>
                <p className="text-2xl font-bold mt-1">{totalVessels}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Ship className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Operativas</p>
                  <p className="text-2xl font-bold mt-1">{inTransit + inPort}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{totalVessels > 0 ? Math.round(((inTransit + inPort) / totalVessels) * 100) : 0}% del total</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">En Mantenimiento</p>
                  <p className="text-2xl font-bold mt-1">{underRepair}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-l-4 border-l-sky-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Velocidad Promedio</p>
                  <p className="text-2xl font-bold mt-1">{avgSpeed}</p>
                  <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">nudos</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Capacidad Total</p>
                  <p className="text-2xl font-bold mt-1">{totalCapacity.toLocaleString()}</p>
                  <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">TEU</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Container className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Map overview for vessels (moved here from dashboard) */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RouteMapVisualization shipments={shipments} />
          <PortsMap />
        </div>
      </motion.div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o IMO..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="En tránsito">En tránsito</SelectItem>
                <SelectItem value="En puerto">En puerto</SelectItem>
                <SelectItem value="Cargando">Cargando</SelectItem>
                <SelectItem value="Descargando">Descargando</SelectItem>
                <SelectItem value="En mantenimiento">En mantenimiento</SelectItem>
                <SelectItem value="En reparación">En reparación</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {VESSEL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={flagFilter} onValueChange={setFlagFilter}>
              <SelectTrigger className="w-[170px] h-9"><SelectValue placeholder="Bandera" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las banderas</SelectItem>
                {uniqueFlags.map((f) => (
                  <SelectItem key={f} value={f}>
                    <span className="flex items-center gap-1.5">{getFlagEmoji(f)} {f}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 ml-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button
                     variant={viewMode === 'cards' ? 'default' : 'outline'}
                     size="sm"
                     className={`h-9 w-9 p-0 ${viewMode === 'cards' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                     onClick={() => setViewMode('cards')}
                   >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vista tarjetas</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button
                     variant={viewMode === 'table' ? 'default' : 'outline'}
                     size="sm"
                     className={`h-9 w-9 p-0 ${viewMode === 'table' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                     onClick={() => setViewMode('table')}
                   >
                    <List className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vista tabla</TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">{filteredVessels.length} embarcacion{filteredVessels.length !== 1 ? 'es' : ''} encontrada{filteredVessels.length !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportCSV}>
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Imprimir
              </Button>
               <Button onClick={() => setShowAdd(true)} className="h-8 text-xs bg-orange-600 hover:bg-orange-700">
                 <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Embarcación
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredVessels.map((v, i) => {
              const utilization = getCapacityUtilization(v)
              const isTransit = v.status === 'En tránsito'
              const accentColor = VESSEL_STATUS_ACCENT[v.status] || 'bg-slate-500'

              return (
                <motion.div key={v.id} custom={i} variants={cardVariants} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.95 }}>
                    <Card
                      className="hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200 cursor-pointer relative overflow-hidden group"
                      onClick={() => handleOpenDetail(v)}
                    >
                    {/* Gradient accent on left side */}
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentColor}`} />

                    <CardContent className="p-4 space-y-3 flex flex-col h-full">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Ship className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm leading-tight flex items-center gap-1">
                              {getFlagEmoji(v.flag)} {v.name}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">IMO: {v.imo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isTransit && (
                            <span className="relative flex h-2 w-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                            </span>
                          )}
                          <Badge variant="secondary" className={`text-[10px] ${VESSEL_STATUS_COLORS[v.status] || ''}`}>
                            {v.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs flex-1">
                        <div className="flex items-center gap-2">
                          <Flag className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{getFlagEmoji(v.flag)} {v.flag}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Anchor className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{v.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Capacidad: {v.capacity.toLocaleString()} TEU</span>
                        </div>
                        {v.speed !== null && v.speed > 0 && (
                          <div className="flex items-center gap-2">
                            <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{v.speed} nudos</span>
                          </div>
                        )}
                        {v.built && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Construido: {v.built}</span>
                          </div>
                        )}
                        {v.owner && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{v.owner}</span>
                          </div>
                        )}
                      </div>

                      {/* Location section - pushed to bottom */}
                      <div className="mt-auto">
                        {v.currentLocation && (
                          <div className="pt-2 border-t">
                            <p className="text-[10px] text-muted-foreground">Ubicación actual</p>
                            <p className="text-xs font-medium">{v.currentLocation}</p>
                          </div>
                        )}

                        {/* Capacity usage bar */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground">Utilización</span>
                            <span className={`text-[10px] font-medium ${getUtilizationTextColor(utilization)}`}>{utilization}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getUtilizationColor(utilization)}`}
                              style={{ width: `${utilization}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Animated wave pattern for transit vessels */}
                      {isTransit && (
                        <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden opacity-20 dark:opacity-10">
                          <div className="wave-pattern" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Embarcaciones ({filteredVessels.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[calc(100vh-420px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>IMO</TableHead>
                    <TableHead>Bandera</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Capacidad</TableHead>
                    <TableHead>Utilización</TableHead>
                    <TableHead>Velocidad</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredVessels.map((v) => {
                      const utilization = getCapacityUtilization(v)

                      return (
                        <motion.tr
                          key={v.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-muted/50 ${VESSEL_STATUS_BORDER[v.status] || ''}`}
                          onClick={() => handleOpenDetail(v)}
                        >
                          <TableCell className="text-sm font-semibold flex items-center gap-1.5">
                            <Ship className="w-4 h-4 text-orange-500" />
                            {getFlagEmoji(v.flag)} {v.name}
                          </TableCell>
                          <TableCell className="text-sm font-mono">{v.imo}</TableCell>
                          <TableCell className="text-sm">
                            <span className="inline-flex items-center gap-1.5">
                              {getFlagEmoji(v.flag)} {v.flag}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{v.type}</TableCell>
                          <TableCell className="text-sm font-medium">{v.capacity.toLocaleString()} TEU</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${getUtilizationColor(utilization)}`}
                                  style={{ width: `${utilization}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium ${getUtilizationTextColor(utilization)}`}>{utilization}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{v.speed ? `${v.speed} nd` : '—'}</TableCell>
                          <TableCell className="text-sm">{v.currentLocation || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={`text-[10px] ${VESSEL_STATUS_COLORS[v.status] || ''}`}>{v.status}</Badge>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Vessel Detail Dialog */}
      <Dialog open={!!selectedVessel} onOpenChange={(open) => { if (!open) setSelectedVessel(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVessel && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <Ship className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="flex items-center gap-2">
                      {getFlagEmoji(selectedVessel.flag)} {selectedVessel.name}
                    </p>
                    <p className="text-sm font-normal text-muted-foreground font-mono">IMO: {selectedVessel.imo}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Maritime themed card */}
                 <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 dark:from-orange-950/30 dark:via-amber-950/30 dark:to-red-950/30 border p-4">
                  {/* Wave pattern decoration */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden opacity-10">
                     <svg viewBox="0 0 400 20" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                       <path d="M0 10 Q50 0 100 10 Q150 20 200 10 Q250 0 300 10 Q350 20 400 10" fill="none" stroke="#ea580c" strokeWidth="2" />
                     </svg>
                  </div>

                  {/* Status & Basic Info */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className={VESSEL_STATUS_COLORS[selectedVessel.status] || ''}>{selectedVessel.status}</Badge>
                    <Badge variant="outline">{getFlagEmoji(selectedVessel.flag)} {selectedVessel.flag}</Badge>
                    <Badge variant="outline">{selectedVessel.type}</Badge>
                  </div>

                  {/* Capacity utilization visual */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium">Utilización de Capacidad</span>
                      <span className={`text-sm font-bold ${getUtilizationTextColor(getCapacityUtilization(selectedVessel))}`}>
                        {getCapacityUtilization(selectedVessel)}%
                      </span>
                    </div>
                    <div className="w-full h-4 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${getUtilizationColor(getCapacityUtilization(selectedVessel))}`}
                        style={{ width: `${getCapacityUtilization(selectedVessel)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">0 TEU</span>
                      <span className="text-[10px] text-muted-foreground">{selectedVessel.capacity.toLocaleString()} TEU</span>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground mb-1">Capacidad</p>
                    <p className="text-sm font-semibold">{selectedVessel.capacity.toLocaleString()} TEU</p>
                  </div>
                  {selectedVessel.speed !== null && selectedVessel.speed > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground mb-1">Velocidad</p>
                      <p className="text-sm font-semibold">{selectedVessel.speed} nudos</p>
                    </div>
                  )}
                  {selectedVessel.built && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground mb-1">Año construcción</p>
                      <p className="text-sm font-semibold">{selectedVessel.built}</p>
                    </div>
                  )}
                  {selectedVessel.owner && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-[10px] text-muted-foreground mb-1">Propietario</p>
                      <p className="text-sm font-semibold">{selectedVessel.owner}</p>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground mb-1">Ubicación</p>
                    <p className="text-sm font-semibold">{selectedVessel.currentLocation || '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-[10px] text-muted-foreground mb-1">Bandera</p>
                    <p className="text-sm font-semibold">{getFlagEmoji(selectedVessel.flag)} {selectedVessel.flag}</p>
                  </div>
                </div>

                <Separator />

                {/* Related Shipments */}
                <div>
                   <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                     <Package className="w-4 h-4 text-orange-500" /> Envíos activos ({vesselShipments.length})
                   </h4>
                  {loadingShipments ? (
                    <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : vesselShipments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay envíos asignados a esta embarcación</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {vesselShipments.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-mono font-semibold text-orange-600 dark:text-orange-400">{s.reference}</span>
                            <span className="text-xs text-muted-foreground">{s.cargoType}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{s.origin}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span>{s.destination}</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">{s.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Historial de posición (mock) */}
                <div>
                   <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-orange-500" /> Historial de posición
                   </h4>
                    <div className="space-y-2">
                      {[
                        { date: '2025-03-04 08:00', location: selectedVessel.currentLocation || 'Puerto desconocido', event: 'Posición actual' },
                        { date: '2025-03-03 14:30', location: 'Canal de Panamá', event: 'En tránsito' },
                        { date: '2025-03-02 09:15', location: 'Puerto de Cartagena', event: 'Zarpe' },
                        { date: '2025-03-01 16:00', location: 'Puerto de Cartagena', event: 'Descarga completada' },
                        { date: '2025-02-28 07:00', location: 'Puerto de Cartagena', event: 'Llegada' },
                      ].map((entry, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs">
                          <div className="flex flex-col items-center">
                             <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-orange-500' : 'bg-muted-foreground/30'}`} />
                            {idx < 4 && <div className="w-px h-6 bg-muted-foreground/20" />}
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{entry.location}</span>
                              <Badge variant="outline" className="text-[9px] h-4">{entry.event}</Badge>
                            </div>
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {entry.date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Vessel Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Embarcación</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input name="name" placeholder="Nombre del buque" required />
              </div>
              <div className="space-y-2">
                <Label>IMO</Label>
                <Input name="imo" placeholder="9876543" required />
              </div>
              <div className="space-y-2">
                <Label>Bandera</Label>
                <Select name="flag" defaultValue="Panamá">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FLAG_EMOJIS).map(([name, emoji]) => (
                      <SelectItem key={name} value={name}>
                        <span className="flex items-center gap-1.5">{emoji} {name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select name="type" defaultValue="Portacontenedores">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VESSEL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacidad (TEU)</Label>
                <Input name="capacity" type="number" placeholder="0" required />
              </div>
              <div className="space-y-2">
                <Label>Velocidad (nudos)</Label>
                <Input name="speed" type="number" step="0.1" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Año de construcción</Label>
                <Input name="built" type="number" placeholder="2024" />
              </div>
              <div className="space-y-2">
                <Label>Propietario</Label>
                <Input name="owner" placeholder="Compañía naviera" />
              </div>
            </div>
            <div className="space-y-2">
              <input ref={attachmentsRef} type="file" name="attachments" multiple className="hidden" onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : []
                setSelectedFiles(files)
              }} />
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => attachmentsRef.current?.click()}>Adjuntar documentos</Button>
                {selectedFiles.length > 0 && <span className="text-sm text-muted-foreground">{selectedFiles.length} archivos seleccionados</span>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
               <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Registrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Wave animation CSS */}
      <style jsx>{`
        .wave-pattern {
          position: absolute;
          bottom: 0;
          left: -50%;
          width: 200%;
          height: 100%;
           background: repeating-linear-gradient(
             90deg,
             transparent,
             transparent 20px,
             rgba(249, 115, 22, 0.3) 20px,
             rgba(249, 115, 22, 0.3) 22px
           );
          animation: wave-scroll 3s linear infinite;
        }
        @keyframes wave-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(42px); }
        }
      `}</style>
    </motion.div>
  )
}
