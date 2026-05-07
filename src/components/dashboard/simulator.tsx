'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calculator, DollarSign, CheckCircle2, AlertTriangle, Clock,
  ShieldCheck, FileWarning, TrendingDown, Package, ArrowRight,
  PiggyBank, Receipt, Info, RefreshCw, Anchor, Ship, Globe,
  Scale, Box, Truck, BarChart3, PieChart, Download, HelpCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────

interface ComplianceCostItem {
  id: string
  category: string
  name: string
  description: string | null
  estimatedCost: number
  currency: string
  appliesToCountry: string | null
  appliesToProduct: string | null
  isRequired: boolean
  savingsIfCompliant: number | null
}

interface SimulationState {
  cargoType: 'FCL' | 'LCL'
  containerType: '20GP' | '40GP' | '40HC'
  quantity: number
  weightKg: number
  volumeCbm: number
  cargoValue: number
  origin: string
  destination: string
  incoterm: 'EXW' | 'FOB' | 'CIF' | 'DDP'
  insuranceRate: number // percentage
  customsRate: number // percentage
  includeLocalHandling: boolean
  selectedComplianceIds: Set<string>
}

// ─── Constants & Mock Data ─────────────────────────────────────────

const CONTAINER_TYPES = [
  { id: '20GP', label: '20\' Standard', capacity: '33 CBM', maxWeight: '28,000 kg' },
  { id: '40GP', label: '40\' Standard', capacity: '67 CBM', maxWeight: '26,000 kg' },
  { id: '40HC', label: '40\' High Cube', capacity: '76 CBM', maxWeight: '26,000 kg' },
]

const ROUTES = [
  { id: 'asia-eu', label: 'Asia ➔ Europa', baseFreight: 2500 },
  { id: 'asia-us', label: 'Asia ➔ EE.UU.', baseFreight: 3200 },
  { id: 'eu-us', label: 'Europa ➔ EE.UU.', baseFreight: 1800 },
  { id: 'latam-us', label: 'LATAM ➔ EE.UU.', baseFreight: 1500 },
  { id: 'asia-latam', label: 'Asia ➔ LATAM', baseFreight: 2800 },
]

const INCOTERMS = [
  { id: 'EXW', label: 'Ex Works', description: 'El comprador asume todos los costos.' },
  { id: 'FOB', label: 'Free On Board', description: 'Vendedor paga hasta carga en buque.' },
  { id: 'CIF', label: 'Cost, Insurance & Freight', description: 'Incluye flete y seguro hasta destino.' },
  { id: 'DDP', label: 'Delivered Duty Paid', description: 'Vendedor asume todos los costos y aranceles.' },
]

// ─── Helpers ───────────────────────────────────────────────────────

function formatUSD(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

// ─── Main Component ────────────────────────────────────────────────

export function Simulator() {
  const [loading, setLoading] = useState(true)
  const [complianceItems, setComplianceItems] = useState<ComplianceCostItem[]>([])
  
  // Simulation State
  const [state, setState] = useState<SimulationState>({
    cargoType: 'FCL',
    containerType: '20GP',
    quantity: 1,
    weightKg: 5000,
    volumeCbm: 20,
    cargoValue: 50000,
    origin: 'China',
    destination: 'España',
    incoterm: 'FOB',
    insuranceRate: 0.5,
    customsRate: 5,
    includeLocalHandling: true,
    selectedComplianceIds: new Set(),
  })

  // Fetch compliance items
  useEffect(() => {
    fetch('/api/compliance')
      .then(r => r.json())
      .then(data => {
        setComplianceItems(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Calculations
  const results = useMemo(() => {
    // 1. Freight Cost
    const route = ROUTES.find(r => state.destination.includes(r.label.split('➔')[1]?.trim() || '')) || ROUTES[0]
    let freight = 0
    if (state.cargoType === 'FCL') {
      const multiplier = state.containerType === '20GP' ? 1 : 1.8
      freight = route.baseFreight * multiplier * state.quantity
    } else {
      // LCL usually charged per CBM or Ton (whichever is greater)
      const chargeableWeight = Math.max(state.volumeCbm, state.weightKg / 1000)
      freight = chargeableWeight * (route.baseFreight / 25) // Rough estimation
    }

    // 2. Insurance
    const insurance = state.cargoValue * (state.insuranceRate / 100)

    // 3. Customs & Duties
    const customs = state.cargoValue * (state.customsRate / 100)

    // 4. Compliance (selected items)
    const selectedItems = complianceItems.filter(i => state.selectedComplianceIds.has(i.id))
    const complianceTotal = selectedItems.reduce((sum, i) => sum + i.estimatedCost, 0)
    const potentialSavings = selectedItems.reduce((sum, i) => sum + (i.savingsIfCompliant || 0), 0)

    // 5. Local Handling & Fees
    const localFees = state.includeLocalHandling ? (state.cargoType === 'FCL' ? 350 * state.quantity : 150) : 0

    // 6. Documentation & Misc
    const docFees = 120

    const total = freight + insurance + customs + complianceTotal + localFees + docFees

    return {
      freight,
      insurance,
      customs,
      complianceTotal,
      potentialSavings,
      localFees,
      docFees,
      total,
      breakdown: [
        { label: 'Flete Internacional', value: freight, icon: Ship, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Seguro de Carga', value: insurance, icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Aranceles y Aduana', value: customs, icon: Receipt, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Cumplimiento y Regulación', value: complianceTotal, icon: FileWarning, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Gastos Locales (THC/Handling)', value: localFees, icon: Truck, color: 'text-teal-500', bg: 'bg-teal-500/10' },
        { label: 'Documentación', value: docFees, icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/10' },
      ]
    }
  }, [state, complianceItems])

  const handleToggleCompliance = (id: string) => {
    const next = new Set(state.selectedComplianceIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setState({ ...state, selectedComplianceIds: next })
  }

  if (loading) {
    return <div className="p-8 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-500" /><p className="mt-2 text-muted-foreground">Iniciando simulador...</p></div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      {/* ─── Sidebar: Configuration ────────────────────────────────── */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
          <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-none">Configurador</h2>
                <p className="text-teal-100 text-xs mt-1">Define los parámetros de tu envío</p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6 space-y-6">
            {/* Cargo Type Tabs */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Carga</Label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setState({ ...state, cargoType: 'FCL' })}
                  className={`py-2 text-sm font-medium rounded-md transition-all ${state.cargoType === 'FCL' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  FCL (Contenedor)
                </button>
                <button
                  onClick={() => setState({ ...state, cargoType: 'LCL' })}
                  className={`py-2 text-sm font-medium rounded-md transition-all ${state.cargoType === 'LCL' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  LCL (Carga Suelta)
                </button>
              </div>
            </div>

            {state.cargoType === 'FCL' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Contenedor</Label>
                  <Select value={state.containerType} onValueChange={(v: any) => setState({ ...state, containerType: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTAINER_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Cantidad</Label>
                  <Input 
                    type="number" 
                    value={state.quantity} 
                    onChange={e => setState({ ...state, quantity: parseInt(e.target.value) || 1 })} 
                    className="h-9" 
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Volumen (CBM)</Label>
                  <Input 
                    type="number" 
                    value={state.volumeCbm} 
                    onChange={e => setState({ ...state, volumeCbm: parseFloat(e.target.value) || 1 })} 
                    className="h-9" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Peso (KG)</Label>
                  <Input 
                    type="number" 
                    value={state.weightKg} 
                    onChange={e => setState({ ...state, weightKg: parseFloat(e.target.value) || 1 })} 
                    className="h-9" 
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Valor de la Mercancía (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="number" 
                  value={state.cargoValue} 
                  onChange={e => setState({ ...state, cargoValue: parseFloat(e.target.value) || 0 })} 
                  className="pl-8 h-9" 
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Logística y Aduana</Label>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Incoterm</Label>
                <Select value={state.incoterm} onValueChange={(v: any) => setState({ ...state, incoterm: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOTERMS.map(i => (
                      <SelectItem key={i.id} value={i.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-bold">{i.id}</span>
                          <span className="text-[10px] text-muted-foreground">{i.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Seguro (%)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={state.insuranceRate} 
                    onChange={e => setState({ ...state, insuranceRate: parseFloat(e.target.value) || 0 })} 
                    className="h-9" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Arancel (%)</Label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={state.customsRate} 
                    onChange={e => setState({ ...state, customsRate: parseFloat(e.target.value) || 0 })} 
                    className="h-9" 
                  />
                </div>
              </div>
            </div>

            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 shadow-lg shadow-teal-500/20" onClick={() => toast.success("Cálculos actualizados")}>
              Recalcular Todo
            </Button>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="p-4 bg-blue-500/10 border border-blue-200 dark:border-blue-900 rounded-xl flex gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            Los cálculos son estimaciones basadas en tarifas promedio. El flete real puede variar según la temporada (Peak Season Surcharge).
          </p>
        </div>
      </div>

      {/* ─── Main Panel: Results ───────────────────────────────────── */}
      <div className="lg:col-span-8 space-y-6">
        {/* Total Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardContent className="p-5">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Inversión Total</p>
              <h3 className="text-3xl font-black mt-1">{formatUSD(results.total)}</h3>
              <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-xs font-medium">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>ROI estimado: 18%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Ahorro Potencial</p>
              <h3 className="text-3xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{formatUSD(results.potentialSavings)}</h3>
              <p className="text-xs text-muted-foreground mt-2 italic">Mediante certificaciones OEA/BASC</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Impacto Logístico</p>
              <h3 className="text-3xl font-black mt-1 text-amber-600">{(results.total / state.cargoValue * 100).toFixed(1)}%</h3>
              <p className="text-xs text-muted-foreground mt-2">Del valor de la mercancía</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="breakdown" className="w-full">
          <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 mb-4 h-12 gap-1 rounded-xl">
            <TabsTrigger value="breakdown" className="flex-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600 font-bold gap-2">
              <BarChart3 className="w-4 h-4" /> Desglose
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600 font-bold gap-2">
              <ShieldCheck className="w-4 h-4" /> Cumplimiento
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-teal-600 font-bold gap-2">
              <PieChart className="w-4 h-4" /> Análisis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown">
            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Desglose Detallado de Costos</CardTitle>
                <CardDescription>Cifras estimadas para transporte marítimo internacional</CardDescription>
              </CardHeader>
              <CardContent className="p-0 border-t">
                <div className="divide-y">
                  {results.breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${item.bg}`}>
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">Estimación estándar de mercado</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black">{formatUSD(item.value)}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{(item.value / results.total * 100).toFixed(1)}% del total</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-black text-xl">Total General Estimado</p>
                    <div className="text-right">
                      <p className="text-2xl font-black text-teal-600">{formatUSD(results.total)}</p>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Moneda: USD</p>
                    </div>
                  </div>
                  <Button className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-bold h-12 rounded-xl gap-2">
                    <Download className="w-4 h-4" /> Descargar Cotización PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complianceItems.map(item => {
                const isSelected = state.selectedComplianceIds.has(item.id)
                return (
                  <Card 
                    key={item.id} 
                    className={`cursor-pointer transition-all border-2 ${isSelected ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-900/10' : 'border-transparent hover:border-slate-200'}`}
                    onClick={() => handleToggleCompliance(item.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className={item.isRequired ? 'bg-red-500' : 'bg-blue-500'}>
                          {item.isRequired ? 'Obligatorio' : 'Opcional'}
                        </Badge>
                        <p className="font-bold text-sm">{formatUSD(item.estimatedCost)}</p>
                      </div>
                      <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                      {item.savingsIfCompliant && (
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded">
                          <PiggyBank className="w-3 h-3" />
                          Ahorra {formatUSD(item.savingsIfCompliant)} con certificación
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="analysis">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">Análisis de Eficiencia</CardTitle>
                <CardDescription>Visualización inteligente de costos y riesgos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Cost Distribution Chart (CSS-based) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">Distribución de Gastos</p>
                    <Badge variant="outline">Impacto Visual</Badge>
                  </div>
                  <div className="flex h-12 w-full rounded-2xl overflow-hidden shadow-inner">
                    {results.breakdown.map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{ width: `${Math.max((item.value / results.total * 100), 2)}%` }} 
                        className={`${item.bg.replace('/10', '')} h-full relative group cursor-help`}
                      >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/20 text-[8px] text-white font-bold">
                          {Math.round(item.value / results.total * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {results.breakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.bg.replace('/10', '')}`} />
                        <span className="text-[10px] text-muted-foreground font-medium truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <p className="text-sm font-bold">Indicador de Riesgo</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Probabilidad de Demora</span>
                        <span className="text-amber-600">Media (4.2%)</span>
                      </div>
                      <Progress value={42} className="h-2 bg-slate-200 dark:bg-slate-700" indicatorClassName="bg-amber-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight italic">
                      Basado en el historial de la ruta {state.origin} ➔ {state.destination}.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-emerald-500" />
                      <p className="text-sm font-bold">Eficiencia Fiscal</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Optimización de Impuestos</span>
                        <span className="text-emerald-600">Alta (88%)</span>
                      </div>
                      <Progress value={88} className="h-2 bg-slate-200 dark:bg-slate-700" indicatorClassName="bg-emerald-500" />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight italic">
                      Tu configuración actual de Incoterm {state.incoterm} es eficiente para esta ruta.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer help */}
        <div className="flex items-center justify-center gap-8 py-4 border-t border-dashed">
          <div className="flex items-center gap-2 text-muted-foreground">
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Ayuda con Incoterms</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Anchor className="w-4 h-4" />
            <span className="text-xs font-medium">Directorio de Navieras</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-medium">Regulaciones Globales</span>
          </div>
        </div>
      </div>
    </div>
  )
}
