'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import {
  Search, MapPin, Globe, Clock, Landmark, Anchor, Warehouse,
  Ship, ArrowRightLeft, Eye, Building2, BarChart3, ChevronRight,
  Activity, AlertTriangle, Users
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Port {
  id: string
  name: string
  country: string
  code: string
  timezone: string | null
}

interface Shipment {
  id: string
  reference: string
  origin: string
  destination: string
  originPort: string
  destinationPort: string
  status: string
  cargoType: string
  eta: string | null
  departureDate: string | null
  arrivalDate: string | null
}

const COUNTRY_FLAGS: Record<string, string> = {
  'Venezuela': '🇻🇪',
  'Colombia': '🇨🇴',
  'Panamá': '🇵🇦',
  'Panama': '🇵🇦',
  'Estados Unidos': '🇺🇸',
  'EE.UU.': '🇺🇸',
  'Países Bajos': '🇳🇱',
  'China': '🇨🇳',
  'Brasil': '🇧🇷',
  'Chile': '🇨🇱',
  'México': '🇲🇽',
  'España': '🇪🇸',
  'Japón': '🇯🇵',
  'Corea del Sur': '🇰🇷',
  'Singapur': '🇸🇬',
  'Reino Unido': '🇬🇧',
  'Alemania': '🇩🇪',
  'Italia': '🇮🇹',
  'Argentina': '🇦🇷',
  'Perú': '🇵🇪',
  'Ecuador': '🇪🇨',
  'India': '🇮🇳',
  'Turquía': '🇹🇷',
  'Sudáfrica': '🇿🇦',
  'Australia': '🇦🇺',
  'Emiratos Árabes': '🇦🇪',
  'Arabia Saudita': '🇸🇦',
  'Nigeria': '🇳🇬',
  'Egipto': '🇪🇬',
}

const COUNTRY_REGIONS: Record<string, string> = {
  'Venezuela': 'Caribe',
  'Colombia': 'Caribe',
  'Panamá': 'Caribe',
  'Panama': 'Caribe',
  'México': 'Caribe',
  'Ecuador': 'Caribe',
  'Perú': 'Caribe',
  'Brasil': 'Caribe',
  'Argentina': 'Caribe',
  'Chile': 'Caribe',
  'Estados Unidos': 'Norteamérica',
  'EE.UU.': 'Norteamérica',
  'España': 'Europa',
  'Reino Unido': 'Europa',
  'Alemania': 'Europa',
  'Italia': 'Europa',
  'Países Bajos': 'Europa',
  'China': 'Asia',
  'Japón': 'Asia',
  'Corea del Sur': 'Asia',
  'Singapur': 'Asia',
  'India': 'Asia',
  'Emiratos Árabes': 'Medio Oriente',
  'Arabia Saudita': 'Medio Oriente',
  'Nigeria': 'África',
  'Sudáfrica': 'África',
  'Egipto': 'África',
  'Australia': 'Oceanía',
  'Turquía': 'Europa',
}

const REGION_COLORS: Record<string, string> = {
  'Caribe': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  'Europa': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  'Asia': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  'Norteamérica': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'Medio Oriente': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  'África': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'Oceanía': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800',
}

function getCountryFlag(country: string): string {
  if (COUNTRY_FLAGS[country]) return COUNTRY_FLAGS[country]
  for (const [key, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (country.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(country.toLowerCase())) {
      return flag
    }
  }
  return '🏴'
}

function getCountryRegion(country: string): string {
  if (COUNTRY_REGIONS[country]) return COUNTRY_REGIONS[country]
  for (const [key, region] of Object.entries(COUNTRY_REGIONS)) {
    if (country.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(country.toLowerCase())) {
      return region
    }
  }
  return 'Otro'
}

function getLocalTime(timezone: string | null): string {
  if (!timezone) return '—'
  try {
    const now = new Date()
    return now.toLocaleTimeString('es-MX', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return '—'
  }
}

function getPortTypeIcon(code: string): React.ElementType {
  const industrialCodes = ['PUERTO', 'IND', 'REF']
  const isIndustrial = industrialCodes.some(c => code.toUpperCase().includes(c))
  if (isIndustrial) return Warehouse
  return Anchor
}

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  'Registrado': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'En tránsito': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  'En puerto': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Descargado': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'Completado': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'Retrasado': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export function Ports() {
  const [ports, setPorts] = useState<Port[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [selectedPort, setSelectedPort] = useState<Port | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [localTimeTick, setLocalTimeTick] = useState(0)

  // Tick for live local time
  useEffect(() => {
    const interval = setInterval(() => setLocalTimeTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Fetch ports
  const fetchPorts = useCallback(async () => {
    try {
      const res = await fetch(`/api/ports?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setPorts(data)
    } catch {
      console.error('Error fetching ports')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchPorts()
  }, [fetchPorts])

  // Fetch shipments for port activity counts
  const fetchShipments = useCallback(async () => {
    try {
      const res = await fetch(`/api/shipments?pageSize=100`)
      const data = await res.json()
      setShipments(data.shipments || [])
    } catch {
      console.error('Error fetching shipments')
    }
  }, [])

  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

  // Compute shipment counts per port code
  const shipmentCountsByPort = useMemo(() => {
    const counts: Record<string, number> = {}
    shipments.forEach(s => {
      counts[s.originPort] = (counts[s.originPort] || 0) + 1
      counts[s.destinationPort] = (counts[s.destinationPort] || 0) + 1
    })
    return counts
  }, [shipments])

  // Get shipments for a specific port
  const getShipmentsForPort = useCallback((portCode: string): Shipment[] => {
    return shipments.filter(s => s.originPort === portCode || s.destinationPort === portCode)
  }, [shipments])

  // Stats
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    ports.forEach(p => { counts[p.country] = (counts[p.country] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [ports])

  const uniqueCountries = useMemo(() => countryCounts.length, [countryCounts])

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    ports.forEach(p => {
      const region = getCountryRegion(p.country)
      counts[region] = (counts[region] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [ports])

  const mostActivePort = useMemo(() => {
    let maxCount = 0
    let maxPort: Port | null = null
    ports.forEach(p => {
      const count = shipmentCountsByPort[p.code] || 0
      if (count > maxCount) { maxCount = count; maxPort = p }
    })
    return maxPort ? { port: maxPort, count: maxCount } : null
  }, [ports, shipmentCountsByPort])

  // Filtered ports
  const filteredPorts = useMemo(() => {
    return ports.filter(p => {
      if (countryFilter !== 'all' && p.country !== countryFilter) return false
      if (regionFilter !== 'all' && getCountryRegion(p.country) !== regionFilter) return false
      return true
    })
  }, [ports, countryFilter, regionFilter])

  // Unique countries and regions for filters
  const countries = useMemo(() => [...new Set(ports.map(p => p.country))].sort(), [ports])
  const regions = useMemo(() => [...new Set(ports.map(p => getCountryRegion(p.country)))].sort(), [ports])

  const openPortDetail = (port: Port) => {
    setSelectedPort(port)
    setDialogOpen(true)
  }

  // Port detail dialog shipments
  const portDetailShipments = useMemo(() => {
    if (!selectedPort) return []
    return getShipmentsForPort(selectedPort.code)
  }, [selectedPort, getShipmentsForPort])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Header with Globe */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Directorio de Puertos</h2>
          <p className="text-sm text-muted-foreground">{ports.length} puertos registrados en {uniqueCountries} países</p>
        </div>
      </div>

      {/* Statistics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                  <Landmark className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Puertos</p>
                  <p className="text-lg font-bold">{ports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Países</p>
                  <p className="text-lg font-bold">{uniqueCountries}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Más Activo</p>
                  <p className="text-sm font-bold truncate max-w-[100px]" title={mostActivePort?.port.name}>
                    {mostActivePort ? mostActivePort.port.name : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Regiones</p>
                  <p className="text-lg font-bold">{regionCounts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Regional distribution pills */}
      {/* Port Congestion Indicators */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-teal-500" />
            <h3 className="text-sm font-semibold">Congestión Portuaria</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {ports.slice(0, 6).map((port) => {
              const count = shipmentCountsByPort[port.code] || 0
              const congestionLevel = count >= 4 ? 'high' : count >= 2 ? 'medium' : 'low'
              const congestionColor = congestionLevel === 'high'
                ? 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : congestionLevel === 'medium'
                  ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              const congestionDot = congestionLevel === 'high'
                ? 'bg-red-500'
                : congestionLevel === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              const congestionLabel = congestionLevel === 'high'
                ? 'Alta'
                : congestionLevel === 'medium'
                  ? 'Media'
                  : 'Baja'

              return (
                <motion.div
                  key={port.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 rounded-lg border ${congestionColor} transition-all cursor-pointer`}
                  onClick={() => openPortDetail(port)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold truncate">{port.name}</span>
                    <span className={`w-2 h-2 rounded-full ${congestionDot} ${congestionLevel === 'high' ? 'animate-pulse' : ''}`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{count} envíos</span>
                    <Badge variant="secondary" className={`text-[9px] h-4 px-1.5 ${
                      congestionLevel === 'high' ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' :
                      congestionLevel === 'medium' ? 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200' :
                      'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200'
                    }`}>
                      {congestionLabel}
                    </Badge>
                  </div>
                  {/* Mini congestion bar */}
                  <div className="mt-2 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${congestionDot}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((count / 6) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {regionCounts.map(([region, count]) => (
          <div
            key={region}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${REGION_COLORS[region] || 'bg-muted text-muted-foreground border-border'}`}
          >
            {region}
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-white/60 dark:bg-black/20">
              {count}
            </Badge>
          </div>
        ))}
      </div>

      {/* Country pills */}
      <div className="flex flex-wrap items-center gap-2">
        {countryCounts.slice(0, 6).map(([country, count]) => (
          <div key={country} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
            <span className="text-sm">{getCountryFlag(country)}</span>
            <span className="text-xs font-medium">{country}</span>
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
              {count}
            </Badge>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, país o código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="País" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los países</SelectItem>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>
                    <span className="flex items-center gap-1.5">
                      <span>{getCountryFlag(c)}</span> {c}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Región" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las regiones</SelectItem>
                {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-500" /> Puertos ({filteredPorts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-500px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Puerto</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Región</TableHead>
                    <TableHead>Zona Horaria</TableHead>
                    <TableHead className="text-center">Envíos</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredPorts.map((p, idx) => {
                      const PortIcon = getPortTypeIcon(p.code)
                      const shipmentCount = shipmentCountsByPort[p.code] || 0
                      const region = getCountryRegion(p.country)
                      const regionColor = REGION_COLORS[region] || ''

                      return (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className={`group cursor-pointer border-b transition-colors hover:bg-teal-50/50 dark:hover:bg-teal-950/20 hover:border-l-2 hover:border-l-teal-400 ${idx % 2 === 1 ? 'bg-muted/20' : ''}`}
                          onClick={() => openPortDetail(p)}
                        >
                          <TableCell className="font-medium text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-md bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                                <PortIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              </div>
                              <div>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-[10px] text-muted-foreground">{p.code}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="mr-1.5">{getCountryFlag(p.country)}</span>{p.country}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted/70">{p.code}</span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {region ? (
                              <Badge variant="secondary" className={`text-[10px] ${regionColor}`}>{region}</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.timezone ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1.5 cursor-help">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-xs">{getLocalTime(p.timezone)}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{p.timezone}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span>—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] h-5 ${
                                shipmentCount > 0
                                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {shipmentCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => { e.stopPropagation(); openPortDetail(p) }}
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver detalle
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

      {/* Port Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedPort && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <Anchor className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <div>{selectedPort.name}</div>
                    <DialogDescription className="flex items-center gap-2 mt-0.5">
                      <span>{getCountryFlag(selectedPort.country)} {selectedPort.country}</span>
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted">{selectedPort.code}</span>
                    </DialogDescription>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Port Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-sky-500" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Zona Horaria</p>
                          <p className="text-sm font-medium">{selectedPort.timezone || 'No disponible'}</p>
                          {selectedPort.timezone && (
                            <p className="text-xs text-teal-600 dark:text-teal-400 font-mono">
                              Hora local: {getLocalTime(selectedPort.timezone)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Envíos Activos</p>
                          <p className="text-sm font-medium">{shipmentCountsByPort[selectedPort.code] || 0} envíos</p>
                          <p className="text-[10px] text-muted-foreground">como origen o destino</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Región</p>
                          <p className="text-sm font-medium">{getCountryRegion(selectedPort.country)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-violet-500" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Código UN/LOCODE</p>
                          <p className="text-sm font-mono font-medium">{selectedPort.code}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Recent Shipments */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Ship className="w-4 h-4 text-teal-500" />
                    <h3 className="text-sm font-semibold">Envíos Recientes</h3>
                    <Badge variant="secondary" className="text-[10px]">{portDetailShipments.length}</Badge>
                  </div>

                  {portDetailShipments.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No hay envíos registrados para este puerto
                    </div>
                  ) : (
                    <ScrollArea className="max-h-64">
                      <div className="space-y-2">
                        {portDetailShipments.slice(0, 10).map((s) => {
                          const isOrigin = s.originPort === selectedPort.code
                          const otherPort = isOrigin ? s.destination : s.origin
                          const otherPortCode = isOrigin ? s.destinationPort : s.originPort
                          const statusColor = SHIPMENT_STATUS_COLORS[s.status] || 'bg-muted text-muted-foreground'

                          return (
                            <motion.div
                              key={s.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-md bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                                <Ship className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium font-mono">{s.reference}</span>
                                  <Badge variant="secondary" className={`text-[9px] h-4 ${statusColor}`}>
                                    {s.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                  {isOrigin ? (
                                    <>
                                      <span className="text-teal-600 dark:text-teal-400">Origen</span>
                                      <ChevronRight className="w-3 h-3" />
                                      <span>{otherPort}</span>
                                      <span className="font-mono text-[10px]">({otherPortCode})</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>{otherPort}</span>
                                      <span className="font-mono text-[10px]">({otherPortCode})</span>
                                      <ChevronRight className="w-3 h-3" />
                                      <span className="text-teal-600 dark:text-teal-400">Destino</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-[10px] text-muted-foreground">{s.cargoType}</p>
                                {s.eta && (
                                  <p className="text-[10px] text-sky-600 dark:text-sky-400">
                                    ETA: {new Date(s.eta).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
