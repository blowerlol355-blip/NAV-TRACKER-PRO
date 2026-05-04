'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import {
  Calculator, DollarSign, CheckCircle2, AlertTriangle, Clock,
  ShieldCheck, FileWarning, TrendingDown, Package, ArrowRight,
  PiggyBank, Receipt, Info, RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ─── Type definitions ───────────────────────────────────────────────

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
  createdAt: string
  updatedAt: string
}

// ─── Constants ──────────────────────────────────────────────────────

const PRODUCT_CATEGORIES = [
  'Alimento agrícola',
  'Producto forestal',
  'Textil',
  'Químico',
  'Mineral',
  'Maquinaria',
  'Electrónica',
] as const

const COUNTRIES = [
  'EE.UU.',
  'Unión Europea',
  'China',
  'Japón',
  'Brasil',
  'Colombia',
  'Canadá',
  'Australia',
] as const

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
  'Certificación': {
    icon: ShieldCheck,
    label: 'Certificaciones requeridas',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-500/10 border-teal-500/20',
  },
  'Inspección': {
    icon: FileWarning,
    label: 'Inspecciones requeridas',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
  },
  'Demora': {
    icon: Clock,
    label: 'Costos de demora',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-500/10 border-rose-500/20',
  },
  'Arancel': {
    icon: Receipt,
    label: 'Aranceles',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
  },
}

const CATEGORY_ORDER = ['Certificación', 'Inspección', 'Demora', 'Arancel']

const PRODUCT_ICONS: Record<string, string> = {
  'Alimento agrícola': '🌾',
  'Producto forestal': '🌲',
  'Textil': '🧵',
  'Químico': '⚗️',
  'Mineral': '⛏️',
  'Maquinaria': '⚙️',
  'Electrónica': '🔌',
}

const COUNTRY_FLAGS: Record<string, string> = {
  'EE.UU.': '🇺🇸',
  'Unión Europea': '🇪🇺',
  'China': '🇨🇳',
  'Japón': '🇯🇵',
  'Brasil': '🇧🇷',
  'Colombia': '🇨🇴',
  'Canadá': '🇨🇦',
  'Australia': '🇦🇺',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}

// ─── Component ──────────────────────────────────────────────────────

export function Simulator() {
  const [costItems, setCostItems] = useState<ComplianceCostItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<string>('Alimento agrícola')
  const [selectedCountry, setSelectedCountry] = useState<string>('Unión Europea')
  const [shipmentValue, setShipmentValue] = useState<string>('100000')
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [prevFilters, setPrevFilters] = useState<{ product: string; country: string }>({ product: 'Alimento agrícola', country: 'Unión Europea' })

  useEffect(() => {
    fetch('/api/compliance')
      .then((r) => r.json())
      .then((d) => { setCostItems(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Reset checked items when filters change (use ref-based approach to avoid setState in effect)
  if (prevFilters.product !== selectedProduct || prevFilters.country !== selectedCountry) {
    setPrevFilters({ product: selectedProduct, country: selectedCountry })
    setCheckedItems(new Set())
  }

  // ─── Filtered items ──────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    return costItems.filter((item) => {
      const matchesProduct = !item.appliesToProduct || item.appliesToProduct === selectedProduct
      const matchesCountry = !item.appliesToCountry || item.appliesToCountry === selectedCountry
      return matchesProduct && matchesCountry
    })
  }, [costItems, selectedProduct, selectedCountry])

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, ComplianceCostItem[]> = {}
    CATEGORY_ORDER.forEach((cat) => { groups[cat] = [] })
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
    return groups
  }, [filteredItems])

  // ─── Cost calculations ───────────────────────────────────────────
  const checkedItemsList = useMemo(() => {
    return filteredItems.filter((item) => checkedItems.has(item.id))
  }, [filteredItems, checkedItems])

  const totalCheckedCost = useMemo(() => {
    return checkedItemsList.reduce((sum, item) => sum + item.estimatedCost, 0)
  }, [checkedItemsList])

  const totalSavings = useMemo(() => {
    return checkedItemsList.reduce((sum, item) => sum + (item.savingsIfCompliant || 0), 0)
  }, [checkedItemsList])

  // Cost with full compliance (all required items)
  const fullComplianceCost = useMemo(() => {
    return filteredItems.filter((item) => item.isRequired).reduce((sum, item) => sum + item.estimatedCost, 0)
  }, [filteredItems])

  // Cost with incomplete documentation (required + delay costs)
  const incompleteDocCost = useMemo(() => {
    const delayItems = filteredItems.filter((item) => item.category === 'Demora')
    return fullComplianceCost + delayItems.reduce((sum, item) => sum + item.estimatedCost, 0)
  }, [filteredItems, fullComplianceCost])

  // All required items
  const requiredItems = useMemo(() => filteredItems.filter((i) => i.isRequired), [filteredItems])
  const optionalItems = useMemo(() => filteredItems.filter((i) => !i.isRequired), [filteredItems])

  // Savings items (optional items with savingsIfCompliant)
  const savingsItems = useMemo(() => {
    return filteredItems.filter((item) => item.savingsIfCompliant && item.savingsIfCompliant > 0)
  }, [filteredItems])

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllRequired = () => {
    const newSet = new Set(checkedItems)
    requiredItems.forEach((item) => newSet.add(item.id))
    setCheckedItems(newSet)
    toast.success('Requisitos obligatorios seleccionados')
  }

  const selectAll = () => {
    const newSet = new Set(checkedItems)
    filteredItems.forEach((item) => newSet.add(item.id))
    setCheckedItems(newSet)
    toast.success('Todos los items seleccionados')
  }

  const clearAll = () => {
    setCheckedItems(new Set())
    toast.info('Selección limpiada')
  }

  const maxCostForChart = useMemo(() => {
    return Math.max(fullComplianceCost, incompleteDocCost, totalCheckedCost, 1)
  }, [fullComplianceCost, incompleteDocCost, totalCheckedCost])

  // ─── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-8 w-40 rounded-full bg-muted animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-60 rounded-lg bg-muted animate-pulse" />
          <div className="h-60 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
        {/* ─── Summary Stats Bar ────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
            <Calculator className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{filteredItems.length} Conceptos</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">{requiredItems.length} Obligatorios</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{optionalItems.length} Opcionales</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            <DollarSign className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Estimado: {formatCurrency(fullComplianceCost)}</span>
          </div>
          {totalSavings > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <TrendingDown className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-green-700 dark:text-green-300">Ahorro: {formatCurrency(totalSavings)}</span>
            </div>
          )}
        </div>

        {/* ─── Input Form ───────────────────────────────────────────── */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-teal-50/80 via-white to-cyan-50/80 dark:from-teal-950/30 dark:via-background dark:to-cyan-950/30 p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5 min-w-[200px]">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Categoría de producto
                  </Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {PRODUCT_ICONS[cat]} {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 min-w-[200px]">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    🌍 País de destino
                  </Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                      <SelectValue placeholder="Seleccionar país" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {COUNTRY_FLAGS[country]} {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 min-w-[200px]">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Valor estimado del envío (USD)
                  </Label>
                  <Input
                    type="text"
                    value={shipmentValue}
                    onChange={(e) => setShipmentValue(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="100000"
                    className="h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm"
                  />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={selectAllRequired}
                  >
                    Solo obligatorios
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={selectAll}
                  >
                    Seleccionar todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={clearAll}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Main Content Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Cost items by category */}
          <div className="lg:col-span-2 space-y-4">
            {CATEGORY_ORDER.map((category) => {
              const items = groupedItems[category] || []
              if (items.length === 0) return null
              const config = CATEGORY_CONFIG[category]
              const ConfigIcon = config.icon
              const categoryTotal = items.reduce((sum, i) => sum + i.estimatedCost, 0)
              const categoryChecked = items.filter((i) => checkedItems.has(i.id)).reduce((sum, i) => sum + i.estimatedCost, 0)

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="overflow-hidden border-0 shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${config.bgColor}`}>
                            <ConfigIcon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          {config.label}
                          <Badge variant="secondary" className="text-[10px]">
                            {items.length} items
                          </Badge>
                        </CardTitle>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Seleccionado: <span className={`font-semibold ${categoryChecked > 0 ? config.color : ''}`}>{formatCurrency(categoryChecked)}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Total categoría: {formatCurrency(categoryTotal)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {items.map((item) => {
                          const isChecked = checkedItems.has(item.id)
                          return (
                            <motion.div
                              key={item.id}
                              layout
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
                                isChecked
                                  ? item.isRequired
                                    ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                                    : 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                                  : 'bg-background border-border hover:bg-muted/30'
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleItem(item.id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-semibold">{item.name}</span>
                                  {item.isRequired ? (
                                    <Badge variant="secondary" className="text-[9px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
                                      Obligatorio
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                                      Opcional
                                    </Badge>
                                  )}
                                  {item.appliesToCountry && (
                                    <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                      {COUNTRY_FLAGS[item.appliesToCountry] || ''} {item.appliesToCountry}
                                    </Badge>
                                  )}
                                  {item.appliesToProduct && (
                                    <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                      {PRODUCT_ICONS[item.appliesToProduct] || ''} {item.appliesToProduct}
                                    </Badge>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className={`text-sm font-bold ${isChecked ? config.color : 'text-muted-foreground'}`}>
                                  {formatCurrency(item.estimatedCost)}
                                </p>
                                <p className="text-[9px] text-muted-foreground">{item.currency}</p>
                                {item.savingsIfCompliant && item.savingsIfCompliant > 0 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1 justify-end mt-1 cursor-help">
                                        <PiggyBank className="w-3 h-3 text-green-500" />
                                        <span className="text-[9px] font-semibold text-green-600 dark:text-green-400">
                                          +{formatCurrency(item.savingsIfCompliant)}
                                        </span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="shadow-xl max-w-[250px]">
                                      <p className="text-xs">Con certificación puedes ahorrar {formatCurrency(item.savingsIfCompliant)}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}

            {filteredItems.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-amber-400/50 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No hay costos disponibles</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    No se encontraron costos de cumplimiento para la combinación seleccionada
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Summary Panel */}
          <div className="space-y-4">
            {/* Running Total */}
            <Card className="overflow-hidden border-0 shadow-sm">
              <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-teal-100 text-xs font-medium">Total estimado seleccionado</p>
                  <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalCheckedCost)}</p>
                  <p className="text-teal-200 text-[10px] mt-1">
                    {checkedItemsList.length} de {filteredItems.length} conceptos seleccionados
                  </p>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                {CATEGORY_ORDER.map((category) => {
                  const items = groupedItems[category] || []
                  if (items.length === 0) return null
                  const config = CATEGORY_CONFIG[category]
                  const categoryChecked = items.filter((i) => checkedItems.has(i.id)).reduce((sum, i) => sum + i.estimatedCost, 0)
                  const categoryTotal = items.reduce((sum, i) => sum + i.estimatedCost, 0)
                  const percentage = categoryTotal > 0 ? (categoryChecked / categoryTotal) * 100 : 0

                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground">{config.label}</span>
                        <span className={`text-[11px] font-semibold ${categoryChecked > 0 ? config.color : 'text-muted-foreground'}`}>
                          {formatCurrency(categoryChecked)}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-1.5" />
                    </div>
                  )
                })}

                <Separator />

                {/* Shipment value context */}
                {shipmentValue && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Valor del envío</span>
                      <span className="text-[11px] font-semibold">{formatCurrency(parseInt(shipmentValue) || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">% de cumplimiento</span>
                      <span className={`text-[11px] font-semibold ${
                        (totalCheckedCost / (parseInt(shipmentValue) || 1)) > 0.05 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {((totalCheckedCost / (parseInt(shipmentValue) || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Savings Section */}
            {savingsItems.length > 0 && (
              <Card className="overflow-hidden border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-green-500" />
                    Ahorros con certificación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {savingsItems.map((item) => {
                    const isChecked = checkedItems.has(item.id)
                    return (
                      <motion.div
                        key={item.id}
                        className={`p-3 rounded-lg border transition-all duration-200 ${
                          isChecked
                            ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                            : 'bg-background border-border'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isChecked ? 'bg-green-500' : 'bg-muted'
                          }`}>
                            {isChecked ? <CheckCircle2 className="w-3 h-3 text-white" /> : <DollarSign className="w-3 h-3 text-muted-foreground" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Costo: {formatCurrency(item.estimatedCost)}
                            </p>
                            <div className="flex items-center gap-1 mt-1.5 p-1.5 bg-green-100/50 dark:bg-green-900/20 rounded">
                              <TrendingDown className="w-3 h-3 text-green-600 dark:text-green-400" />
                              <span className="text-[10px] font-semibold text-green-700 dark:text-green-300">
                                Con certificación ahorras {formatCurrency(item.savingsIfCompliant!)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}

                  {totalSavings > 0 && (
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-bold text-green-700 dark:text-green-300">
                            Ahorro total potencial: {formatCurrency(totalSavings)}
                          </p>
                          <p className="text-[10px] text-green-600 dark:text-green-400">
                            Obteniendo las certificaciones seleccionadas
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cost Comparison Chart */}
            <Card className="overflow-hidden border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-teal-500" />
                  Comparación de costos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bar: Full Compliance */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-teal-500" />
                      Con cumplimiento completo
                    </span>
                    <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">{formatCurrency(fullComplianceCost)}</span>
                  </div>
                  <div className="w-full h-8 bg-muted/30 rounded-lg overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(fullComplianceCost / maxCostForChart) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-lg flex items-center justify-end pr-2"
                    >
                      {fullComplianceCost > 0 && (fullComplianceCost / maxCostForChart) > 0.15 && (
                        <span className="text-[9px] font-bold text-white">{formatCurrency(fullComplianceCost)}</span>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Bar: Incomplete Documentation */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500" />
                      Con documentación incompleta
                    </span>
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{formatCurrency(incompleteDocCost)}</span>
                  </div>
                  <div className="w-full h-8 bg-muted/30 rounded-lg overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(incompleteDocCost / maxCostForChart) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                      className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-lg flex items-center justify-end pr-2"
                    >
                      {incompleteDocCost > 0 && (incompleteDocCost / maxCostForChart) > 0.15 && (
                        <span className="text-[9px] font-bold text-white">{formatCurrency(incompleteDocCost)}</span>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Bar: Current Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Calculator className="w-3 h-3 text-purple-500" />
                      Tu selección actual
                    </span>
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">{formatCurrency(totalCheckedCost)}</span>
                  </div>
                  <div className="w-full h-8 bg-muted/30 rounded-lg overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(totalCheckedCost / maxCostForChart) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-lg flex items-center justify-end pr-2"
                    >
                      {totalCheckedCost > 0 && (totalCheckedCost / maxCostForChart) > 0.15 && (
                        <span className="text-[9px] font-bold text-white">{formatCurrency(totalCheckedCost)}</span>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Difference indicator */}
                {incompleteDocCost > fullComplianceCost && (
                  <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                        Riesgo de sobrecosto: {formatCurrency(incompleteDocCost - fullComplianceCost)}
                      </p>
                      <p className="text-[9px] text-rose-600 dark:text-rose-400">
                        Documentación incompleta puede incrementar costos hasta {Math.round(((incompleteDocCost - fullComplianceCost) / fullComplianceCost) * 100)}% más
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Box */}
            <Card className="border-0 shadow-sm bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Nota importante</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                      Los costos mostrados son estimaciones basadas en promedios del mercado. Los costos reales pueden variar según el proveedor,
                      el volumen del envío y la regulación vigente al momento de la importación. Consulta con tu agente aduanal para cifras exactas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
