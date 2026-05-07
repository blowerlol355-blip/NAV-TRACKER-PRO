'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Ship, Truck, Anchor, Clock, DollarSign, ShieldCheck, 
  Leaf, Zap, BarChart3, ArrowRight, CheckCircle2, 
  AlertTriangle, Info, Star, Download, Search, 
  MapPin, Calendar, HelpCircle, ChevronRight, 
  Layers, Filter, MousePointer2, MoreHorizontal, TrendingDown, Globe, RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────

interface ShippingOption {
  id: string
  carrier: {
    name: string
    logo: string
    rating: number
    reliability: number // %
  }
  route: {
    origin: string
    destination: string
    transitTime: number // days
    vessels: string[]
  }
  costs: {
    freight: number
    surcharges: number
    handling: number
    total: number
  }
  emissions: number // kg CO2
  tags: ('Best Price' | 'Fastest' | 'Greenest' | 'Recommended')[]
  inclusions: string[]
  freeDays: number
  // Advanced Metrics
  riskProfile: {
    weather: number // 1-10
    congestion: number // 1-10
    geopolitical: number // 1-10
  }
  priceTrend: 'up' | 'down' | 'stable'
  historicalAvg: number
}

// ─── Mock Data ─────────────────────────────────────────────────────

const MOCK_OPTIONS: ShippingOption[] = [
  {
    id: 'opt-1',
    carrier: { name: 'Maersk Line', logo: 'M', rating: 4.8, reliability: 96 },
    route: { origin: 'Shanghai (CNSHA)', destination: 'Valencia (ESVLC)', transitTime: 28, vessels: ['MAERSK HONAM', 'MAERSK ALTAIR'] },
    costs: { freight: 2450, surcharges: 320, handling: 150, total: 2920 },
    emissions: 850,
    tags: ['Recommended', 'Fastest'],
    inclusions: ['Teu Tracking', 'Customs Support', 'E-Doc Management'],
    freeDays: 14,
    riskProfile: { weather: 2, congestion: 4, geopolitical: 1 },
    priceTrend: 'stable',
    historicalAvg: 2850
  },
  {
    id: 'opt-2',
    carrier: { name: 'CMA CGM', logo: 'C', rating: 4.5, reliability: 92 },
    route: { origin: 'Shanghai (CNSHA)', destination: 'Valencia (ESVLC)', transitTime: 34, vessels: ['CMA CGM MARCO POLO'] },
    costs: { freight: 1980, surcharges: 280, handling: 120, total: 2380 },
    emissions: 920,
    tags: ['Best Price'],
    inclusions: ['Standard Tracking', 'Port Handling'],
    freeDays: 10,
    riskProfile: { weather: 5, congestion: 7, geopolitical: 2 },
    priceTrend: 'down',
    historicalAvg: 2600
  },
  {
    id: 'opt-3',
    carrier: { name: 'MSC Shipping', logo: 'S', rating: 4.2, reliability: 88 },
    route: { origin: 'Shanghai (CNSHA)', destination: 'Valencia (ESVLC)', transitTime: 32, vessels: ['MSC OSCAR'] },
    costs: { freight: 2100, surcharges: 300, handling: 140, total: 2540 },
    emissions: 980,
    tags: [],
    inclusions: ['Standard Tracking', 'Basic Support'],
    freeDays: 12,
    riskProfile: { weather: 3, congestion: 6, geopolitical: 2 },
    priceTrend: 'up',
    historicalAvg: 2400
  },
  {
    id: 'opt-4',
    carrier: { name: 'Evergreen', logo: 'E', rating: 4.6, reliability: 94 },
    route: { origin: 'Shanghai (CNSHA)', destination: 'Valencia (ESVLC)', transitTime: 36, vessels: ['EVER GIVEN'] },
    costs: { freight: 1850, surcharges: 250, handling: 110, total: 2210 },
    emissions: 720,
    tags: ['Greenest'],
    inclusions: ['Eco-Fuel Option', 'Standard Tracking'],
    freeDays: 14,
    riskProfile: { weather: 4, congestion: 5, geopolitical: 1 },
    priceTrend: 'stable',
    historicalAvg: 2300
  }
]

// ─── Helpers ───────────────────────────────────────────────────────

function formatUSD(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

// ─── Main Component ────────────────────────────────────────────────

export function Comparator() {
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['opt-1', 'opt-2']))
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'matrix' | 'details' | 'analytics'>('matrix')

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      if (next.size > 1) next.delete(id)
      else toast.error("Debes mantener al menos una opción seleccionada")
    } else {
      if (next.size < 4) next.add(id)
      else toast.error("Máximo 4 opciones para comparar")
    }
    setSelectedIds(next)
  }

  const selectedOptions = useMemo(() => {
    return MOCK_OPTIONS.filter(opt => selectedIds.has(opt.id))
  }, [selectedIds])

  const bestMetrics = useMemo(() => {
    return {
      price: Math.min(...MOCK_OPTIONS.map(o => o.costs.total)),
      time: Math.min(...MOCK_OPTIONS.map(o => o.route.transitTime)),
      emissions: Math.min(...MOCK_OPTIONS.map(o => o.emissions))
    }
  }, [])

  return (
    <div className="space-y-6 pb-20">
      {/* ─── Search & Global Filter ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-500" />
            Comparador de Tarifas
          </h2>
          <p className="text-sm text-muted-foreground italic">
            Analiza y selecciona la mejor estrategia para tu ruta <span className="font-bold text-foreground">Shanghai ➔ Valencia</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar naviera o servicio..." 
              className="pl-9 w-[280px] h-10 bg-white/50 backdrop-blur-sm border-slate-200 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ─── Option Selectors (Mini Cards) ─────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MOCK_OPTIONS.map(opt => {
          const isSelected = selectedIds.has(opt.id)
          return (
            <motion.div
              key={opt.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleSelection(opt.id)}
              className={`cursor-pointer p-3 rounded-xl border-2 transition-all relative overflow-hidden ${
                isSelected 
                ? 'bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-500/20' 
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-teal-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {opt.carrier.logo}
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4" />}
              </div>
              <p className={`text-xs font-bold truncate ${isSelected ? 'text-teal-50' : 'text-slate-900 dark:text-slate-100'}`}>{opt.carrier.name}</p>
              <p className={`text-[10px] ${isSelected ? 'text-teal-200' : 'text-muted-foreground'}`}>{formatUSD(opt.costs.total)} • {opt.route.transitTime} días</p>
              
              {isSelected && (
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Ship className="w-12 h-12 rotate-12" />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* ─── Comparison Content ────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-12">
            <TabsTrigger value="matrix" className="rounded-lg px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600">Matriz</TabsTrigger>
            <TabsTrigger value="details" className="rounded-lg px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600">Detalles</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg px-6 font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600">Analíticas</TabsTrigger>
          </TabsList>
          
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2 font-bold rounded-xl h-11 px-6 shadow-xl shadow-teal-500/20">
            Reservar Selección
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'matrix' && (
            <motion.div
              key="matrix"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {selectedOptions.map((opt, idx) => (
                <Card key={opt.id} className="border-0 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden group">
                  <div className={`h-2 w-full ${idx === 0 ? 'bg-teal-500' : idx === 1 ? 'bg-blue-500' : 'bg-indigo-500'}`} />
                  
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-black text-xl tracking-tight">{opt.carrier.name}</h3>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < Math.floor(opt.carrier.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                          ))}
                          <span className="text-[10px] font-bold ml-1 text-muted-foreground">{opt.carrier.rating}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatUSD(opt.costs.total)}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Todo Incluido</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {opt.tags.map(tag => (
                        <Badge key={tag} className={`text-[9px] font-black uppercase px-2 py-0.5 ${
                          tag === 'Best Price' ? 'bg-emerald-500 hover:bg-emerald-600' :
                          tag === 'Fastest' ? 'bg-blue-500 hover:bg-blue-600' :
                          tag === 'Greenest' ? 'bg-teal-500 hover:bg-teal-600' :
                          'bg-indigo-500 hover:bg-indigo-600'
                        }`}>
                          {tag}
                        </Badge>
                      ))}
                      {opt.tags.length === 0 && <Badge variant="outline" className="text-[9px] opacity-50">Standard</Badge>}
                    </div>

                    {/* Timeline */}
                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl relative overflow-hidden">
                      <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase">
                        <span>CNSHA</span>
                        <span className="text-teal-600">{opt.route.transitTime} días</span>
                        <span>ESVLC</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-slate-200 via-teal-400 to-slate-200 relative">
                          <motion.div 
                            animate={{ x: [0, 100, 0] }} 
                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-1.5 left-0"
                          >
                            <Ship className="w-3 h-3 text-teal-600" />
                          </motion.div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-teal-500 shadow-sm shadow-teal-500/50" />
                      </div>
                      <p className="text-[10px] text-center font-medium text-slate-500">Próxima salida: 12 Mayo, 2026</p>
                    </div>

                    {/* Metrics Progress */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Fiabilidad</span>
                          <span className="text-emerald-600">{opt.carrier.reliability}%</span>
                        </div>
                        <Progress value={opt.carrier.reliability} className="h-1.5" indicatorClassName="bg-emerald-500" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="flex items-center gap-1.5"><Leaf className="w-3 h-3 text-teal-500" /> Eco-Impacto</span>
                          <span className={opt.emissions === bestMetrics.emissions ? 'text-teal-600' : 'text-slate-500'}>
                            {opt.emissions} kg CO2
                          </span>
                        </div>
                        <Progress value={(bestMetrics.emissions / opt.emissions) * 100} className="h-1.5" indicatorClassName="bg-teal-500" />
                      </div>
                    </div>

                    <Separator className="opacity-50" />

                    {/* Features Mini-list */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Inclusiones Key</p>
                      <div className="grid grid-cols-1 gap-1">
                        {opt.inclusions.slice(0, 3).map(inc => (
                          <div key={inc} className="flex items-center gap-2 text-xs">
                            <CheckCircle2 className="w-3 h-3 text-teal-500" />
                            <span className="truncate">{inc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button variant="ghost" className="w-full text-xs font-bold gap-2 group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
                      Ver detalle de recargos
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          {activeTab === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b">
                      <th className="p-6 text-xs font-black uppercase text-muted-foreground tracking-widest">Característica</th>
                      {selectedOptions.map(opt => (
                        <th key={opt.id} className="p-6 text-center border-l min-w-[200px]">
                          <p className="font-black text-lg">{opt.carrier.name}</p>
                          <Badge variant="outline" className="mt-1 text-[10px]">{opt.id}</Badge>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-6 text-sm font-bold bg-slate-50/30">Precio Total (All-in)</td>
                      {selectedOptions.map(opt => (
                        <td key={opt.id} className="p-6 text-center border-l">
                          <span className={`text-xl font-black ${opt.costs.total === bestMetrics.price ? 'text-emerald-600' : ''}`}>
                            {formatUSD(opt.costs.total)}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-6 text-sm font-bold bg-slate-50/30">Tiempo de Tránsito</td>
                      {selectedOptions.map(opt => (
                        <td key={opt.id} className="p-6 text-center border-l">
                          <span className={`font-black ${opt.route.transitTime === bestMetrics.time ? 'text-blue-600' : ''}`}>
                            {opt.route.transitTime} días
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-1">Directo / 1 Escala</p>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-6 text-sm font-bold bg-slate-50/30">Días Libres (Destino)</td>
                      {selectedOptions.map(opt => (
                        <td key={opt.id} className="p-6 text-center border-l">
                          <Badge variant="secondary" className="font-bold">{opt.freeDays} días</Badge>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-6 text-sm font-bold bg-slate-50/30">Emisiones CO2</td>
                      {selectedOptions.map(opt => (
                        <td key={opt.id} className="p-6 text-center border-l font-medium">
                          {opt.emissions} kg
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-6 text-sm font-bold bg-slate-50/30">Buques Asignados</td>
                      {selectedOptions.map(opt => (
                        <td key={opt.id} className="p-6 text-center border-l text-xs">
                          {opt.route.vessels.join(', ')}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-6 text-sm font-bold bg-slate-50/30">Inclusiones</td>
                      {selectedOptions.map(opt => (
                        <td key={opt.id} className="p-6 border-l">
                          <ul className="space-y-1">
                            {opt.inclusions.map(inc => (
                              <li key={inc} className="text-[11px] flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-teal-500" />
                                {inc}
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inventory Carrying Cost (TCO) */}
                <Card className="lg:col-span-2 border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">Análisis de Costo Total (TCO)</CardTitle>
                        <CardDescription>Costo de flete + Capital inmovilizado en tránsito</CardDescription>
                      </div>
                      <Badge variant="outline" className="border-teal-500 text-teal-600 font-bold">Mercancía: $100k</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="text-[10px] font-black uppercase text-muted-foreground border-b bg-slate-50/50">
                          <tr>
                            <th className="p-4">Naviera</th>
                            <th className="p-4">Costo Flete</th>
                            <th className="p-4">Costo Inventario (15% AP)</th>
                            <th className="p-4">TCO Final</th>
                            <th className="p-4">Diferencia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedOptions.map(opt => {
                            const inventoryCost = (100000 * 0.15 * opt.route.transitTime) / 365
                            const tco = opt.costs.total + inventoryCost
                            return (
                              <tr key={opt.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 font-bold text-sm">{opt.carrier.name}</td>
                                <td className="p-4 text-sm font-medium">{formatUSD(opt.costs.total)}</td>
                                <td className="p-4 text-sm font-medium text-amber-600">{formatUSD(inventoryCost)}</td>
                                <td className="p-4 text-sm font-black text-slate-900 dark:text-white">{formatUSD(tco)}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-teal-500" 
                                        style={{ width: `${(opt.costs.total / tco) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground">{Math.round((opt.costs.total / tco) * 100)}%</span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 bg-teal-50/50 dark:bg-teal-900/10 border-t flex gap-3 items-center">
                      <Info className="w-4 h-4 text-teal-600" />
                      <p className="text-[10px] text-teal-800 dark:text-teal-300 italic">
                        El TCO considera el costo de oportunidad del capital (15% anual). Una ruta más rápida libera flujo de caja antes.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Price Trends */}
                <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
                  <CardHeader>
                    <CardTitle className="text-lg">Tendencia de Tarifas</CardTitle>
                    <CardDescription>Freight Index vs Histórico 6 meses</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedOptions.map(opt => (
                      <div key={opt.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${opt.priceTrend === 'down' ? 'bg-emerald-100 text-emerald-600' : opt.priceTrend === 'up' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                            {opt.priceTrend === 'down' ? <TrendingDown className="w-4 h-4" /> : opt.priceTrend === 'up' ? <Zap className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold">{opt.carrier.name}</p>
                            <p className="text-[9px] text-muted-foreground">Hist: {formatUSD(opt.historicalAvg)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${opt.costs.total < opt.historicalAvg ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {Math.abs(Math.round(((opt.costs.total - opt.historicalAvg) / opt.historicalAvg) * 100))}%
                            {opt.costs.total < opt.historicalAvg ? ' menos' : ' más'}
                          </p>
                          <Badge variant="outline" className="text-[8px] h-4 py-0">
                            {opt.priceTrend === 'down' ? 'Oportunidad' : 'Pico'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Risk Intelligence Map/Indicators */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-0 shadow-xl bg-slate-900 text-white overflow-hidden relative">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
                   <CardHeader className="relative z-10">
                     <div className="flex items-center gap-2">
                       <Globe className="w-5 h-5 text-teal-400" />
                       <CardTitle className="text-lg">Inteligencia de Riesgo en Ruta</CardTitle>
                     </div>
                     <CardDescription className="text-slate-400">Estado actual de la cadena de suministro global</CardDescription>
                   </CardHeader>
                   <CardContent className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                     {selectedOptions.map(opt => (
                       <div key={opt.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4 backdrop-blur-sm">
                         <p className="text-xs font-black uppercase text-teal-400 tracking-widest">{opt.carrier.name}</p>
                         
                         <div className="space-y-3">
                           <div className="space-y-1">
                             <div className="flex justify-between text-[10px]">
                               <span className="flex items-center gap-1.5 opacity-70"><RefreshCw className="w-3 h-3" /> Congestión Portuaria</span>
                               <span className={opt.riskProfile.congestion > 6 ? 'text-rose-400' : 'text-emerald-400'}>{opt.riskProfile.congestion}/10</span>
                             </div>
                             <Progress value={opt.riskProfile.congestion * 10} className="h-1 bg-white/10" indicatorClassName={opt.riskProfile.congestion > 6 ? 'bg-rose-400' : 'bg-emerald-400'} />
                           </div>

                           <div className="space-y-1">
                             <div className="flex justify-between text-[10px]">
                               <span className="flex items-center gap-1.5 opacity-70"><Zap className="w-3 h-3" /> Eventos Climáticos</span>
                               <span className={opt.riskProfile.weather > 4 ? 'text-amber-400' : 'text-emerald-400'}>{opt.riskProfile.weather}/10</span>
                             </div>
                             <Progress value={opt.riskProfile.weather * 10} className="h-1 bg-white/10" indicatorClassName={opt.riskProfile.weather > 4 ? 'bg-amber-400' : 'bg-emerald-400'} />
                           </div>

                           <div className="space-y-1">
                             <div className="flex justify-between text-[10px]">
                               <span className="flex items-center gap-1.5 opacity-70"><Anchor className="w-3 h-3" /> Estabilidad Geopolítica</span>
                               <span className="text-emerald-400">Segura</span>
                             </div>
                             <Progress value={opt.riskProfile.geopolitical * 10} className="h-1 bg-white/10" indicatorClassName="bg-emerald-400" />
                           </div>
                         </div>
                       </div>
                     ))}
                   </CardContent>
                </Card>

                <div className="p-6 bg-gradient-to-br from-teal-600 to-emerald-800 rounded-3xl text-white shadow-xl shadow-teal-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <Star className="w-5 h-5 fill-white" />
                      </div>
                      <h4 className="font-bold">Estrategia Ganadora</h4>
                    </div>
                    <p className="text-sm text-teal-50 leading-relaxed">
                      Basado en el <span className="font-bold">TCO</span> y el <span className="font-bold">Freight Index</span>, la opción de <span className="font-bold">Maersk Line</span> es la más eficiente. 
                      Aunque el flete es ligeramente superior, el ahorro en capital inmovilizado y el bajo perfil de riesgo compensan la inversión.
                    </p>
                  </div>
                  <Button variant="outline" className="mt-6 border-white/30 text-white hover:bg-white/10 font-bold gap-2">
                    Ejecutar Orden de Reserva
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </Tabs>

      {/* ─── Footer: Global Summary ────────────────────────────────── */}
      <motion.div 
        initial={{ y: 50 }} 
        animate={{ y: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-4 rounded-3xl shadow-2xl z-50 flex items-center justify-between"
      >
        <div className="flex items-center gap-6 px-4 border-r border-slate-700">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comparando</p>
            <p className="text-sm font-bold text-white">{selectedIds.size} Opciones</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rango de Precio</p>
            <p className="text-sm font-bold text-emerald-400">{formatUSD(bestMetrics.price)} - {formatUSD(Math.max(...selectedOptions.map(o => o.costs.total)))}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white hover:bg-white/10 text-xs font-bold gap-2" onClick={() => toast.info("Reporte enviado a tu correo")}>
            <Download className="w-4 h-4" /> Exportar
          </Button>
          <Button className="bg-teal-500 hover:bg-teal-600 text-white font-black px-8 rounded-2xl h-11 shadow-lg shadow-teal-500/20">
            Continuar con Reserva
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
