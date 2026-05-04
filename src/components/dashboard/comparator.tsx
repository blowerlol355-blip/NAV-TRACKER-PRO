'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Globe, Download, CheckCircle2, XCircle, Minus, Shield, FileText,
  AlertTriangle, Info, Filter, ArrowUpDown, BookOpen, Scale
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ─── Type definitions ───────────────────────────────────────────────

interface CountryRequirement {
  id: string
  productCategory: string
  country: string
  requirementName: string
  isMandatory: boolean
  maxResidueLevel: string | null
  localLanguageLabel: string | null
  description: string | null
  regulation: string | null
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

const ALL_COUNTRIES = [
  'EE.UU.',
  'Unión Europea',
  'China',
  'Japón',
  'Brasil',
  'Colombia',
  'Canadá',
  'Australia',
] as const

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

const COUNTRY_SHORT: Record<string, string> = {
  'EE.UU.': 'US',
  'Unión Europea': 'UE',
  'China': 'CN',
  'Japón': 'JP',
  'Brasil': 'BR',
  'Colombia': 'CO',
  'Canadá': 'CA',
  'Australia': 'AU',
}

const CATEGORY_ICONS: Record<string, string> = {
  'Alimento agrícola': '🌾',
  'Producto forestal': '🌲',
  'Textil': '🧵',
  'Químico': '⚗️',
  'Mineral': '⛏️',
  'Maquinaria': '⚙️',
  'Electrónica': '🔌',
}

// ─── Component ──────────────────────────────────────────────────────

export function Comparator() {
  const [requirements, setRequirements] = useState<CountryRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('Alimento agrícola')
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['EE.UU.', 'Unión Europea', 'China', 'Japón'])
  const [showExportToast, setShowExportToast] = useState(false)

  useEffect(() => {
    fetch('/api/country-requirements')
      .then((r) => r.json())
      .then((d) => { setRequirements(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // ─── Derived data ────────────────────────────────────────────────
  const filteredRequirements = useMemo(() => {
    return requirements.filter(
      (r) => r.productCategory === selectedCategory && selectedCountries.includes(r.country)
    )
  }, [requirements, selectedCategory, selectedCountries])

  // Unique requirement names for the selected category (across all selected countries)
  const requirementNames = useMemo(() => {
    const names = new Set<string>()
    filteredRequirements.forEach((r) => names.add(r.requirementName))
    return Array.from(names).sort()
  }, [filteredRequirements])

  // Build a lookup map: requirementName -> country -> requirement data
  const requirementMap = useMemo(() => {
    const map: Record<string, Record<string, CountryRequirement>> = {}
    filteredRequirements.forEach((r) => {
      if (!map[r.requirementName]) map[r.requirementName] = {}
      map[r.requirementName][r.country] = r
    })
    return map
  }, [filteredRequirements])

  // Summary: mandatory count per country
  const mandatoryPerCountry = useMemo(() => {
    const counts: Record<string, number> = {}
    selectedCountries.forEach((c) => { counts[c] = 0 })
    filteredRequirements.forEach((r) => {
      if (r.isMandatory) {
        counts[r.country] = (counts[r.country] || 0) + 1
      }
    })
    return counts
  }, [filteredRequirements, selectedCountries])

  const totalRequirements = filteredRequirements.length
  const totalMandatory = filteredRequirements.filter((r) => r.isMandatory).length
  const totalOptional = filteredRequirements.filter((r) => !r.isMandatory).length

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    )
  }

  const handleExport = () => {
    toast.success('Comparación exportada', {
      description: 'El archivo se ha generado exitosamente (demo)',
    })
  }

  // ─── Status cell renderer ────────────────────────────────────────
  const renderStatusCell = (req: CountryRequirement | undefined) => {
    if (!req) {
      return (
        <div className="flex flex-col items-center gap-1 py-1">
          <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700">
            <Minus className="w-3 h-3 mr-0.5" />
            No aplica
          </Badge>
        </div>
      )
    }

    if (req.isMandatory) {
      return (
        <div className="flex flex-col items-center gap-1 py-1">
          <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
            <XCircle className="w-3 h-3 mr-0.5" />
            Obligatorio
          </Badge>
          {req.maxResidueLevel && (
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">
              Máx: {req.maxResidueLevel}
            </span>
          )}
          {req.localLanguageLabel && (
            <span className="text-[9px] text-muted-foreground italic">
              {req.localLanguageLabel}
            </span>
          )}
          {req.regulation && (
            <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5">
              {req.regulation}
            </span>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center gap-1 py-1">
        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3 mr-0.5" />
          No obligatorio
        </Badge>
        {req.maxResidueLevel && (
          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium">
            Máx: {req.maxResidueLevel}
          </span>
        )}
        {req.localLanguageLabel && (
          <span className="text-[9px] text-muted-foreground italic">
            {req.localLanguageLabel}
          </span>
        )}
        {req.regulation && (
          <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5">
            {req.regulation}
          </span>
        )}
      </div>
    )
  }

  // ─── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-32 rounded-full" />)}
        </div>
        <Skeleton className="h-60 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
        {/* ─── Summary Stats Bar ────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
            <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{selectedCountries.length} Países</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">{totalMandatory} Obligatorios</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{totalOptional} Opcionales</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/10 border border-slate-500/20">
            <FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{totalRequirements} Total requisitos</span>
          </div>
          <div className="ml-auto">
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/30"
            >
              <Download className="w-4 h-4" />
              Exportar comparación
            </Button>
          </div>
        </div>

        {/* ─── Filter Bar ───────────────────────────────────────────── */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-teal-50/80 via-white to-cyan-50/80 dark:from-teal-950/30 dark:via-background dark:to-cyan-950/30 p-4">
              <div className="space-y-4">
                {/* Product Category Selector */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Filter className="w-3.5 h-3.5" />
                    Categoría de producto:
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[220px] h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_ICONS[cat]} {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Country Multi-Selector */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Globe className="w-3.5 h-3.5" />
                    Países a comparar:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ALL_COUNTRIES.map((country) => {
                      const isSelected = selectedCountries.includes(country)
                      return (
                        <label
                          key={country}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'bg-teal-50 border-teal-300 text-teal-700 dark:bg-teal-900/30 dark:border-teal-700 dark:text-teal-300 shadow-sm'
                              : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-background/30 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/30'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCountry(country)}
                            className="h-3.5 w-3.5"
                          />
                          <span className="text-xs font-medium">
                            {COUNTRY_FLAGS[country]} {country}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Comparison Table ─────────────────────────────────────── */}
        {selectedCountries.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Selecciona al menos un país para comparar</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Usa los checkboxes de arriba para elegir países</p>
            </CardContent>
          </Card>
        ) : requirementNames.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-400/50 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No hay requisitos disponibles</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                No se encontraron requisitos para &quot;{CATEGORY_ICONS[selectedCategory]} {selectedCategory}&quot; en los países seleccionados
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Scale className="w-4 h-4 text-teal-500" />
                  Comparación: {CATEGORY_ICONS[selectedCategory]} {selectedCategory}
                  <Badge variant="secondary" className="text-[10px] ml-2">
                    {requirementNames.length} requisitos
                  </Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[calc(100vh-420px)]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="text-xs font-semibold min-w-[200px] sticky left-0 bg-muted/30 z-10">
                        <div className="flex items-center gap-1.5">
                          <ArrowUpDown className="w-3 h-3" />
                          Requisito
                        </div>
                      </TableHead>
                      {selectedCountries.map((country) => (
                        <TableHead key={country} className="text-xs font-semibold text-center min-w-[160px]">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-base">{COUNTRY_FLAGS[country]}</span>
                            <span>{COUNTRY_SHORT[country]}</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {requirementNames.map((reqName, rowIndex) => {
                        const countryData = requirementMap[reqName] || {}
                        // Determine if this row has any mandatory requirement
                        const hasMandatory = Object.values(countryData).some((r) => r.isMandatory)
                        const allMandatory = Object.values(countryData).length > 0 && Object.values(countryData).every((r) => r.isMandatory)
                        const hasGap = selectedCountries.some((c) => !countryData[c])

                        return (
                          <motion.tr
                            key={reqName}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: rowIndex * 0.02 }}
                            className={`${rowIndex % 2 === 1 ? 'bg-muted/20' : ''} hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-colors ${
                              hasGap ? 'border-l-4 border-l-amber-400' : hasMandatory ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-emerald-400'
                            }`}
                          >
                            <TableCell className="py-3 sticky left-0 bg-inherit z-10">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-foreground">{reqName}</span>
                                  {allMandatory && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex">
                                          <Shield className="w-3 h-3 text-red-500" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="shadow-xl">
                                        <p className="text-xs">Obligatorio en todos los países seleccionados</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {hasGap && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex">
                                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="shadow-xl">
                                        <p className="text-xs">No aplica en algunos países seleccionados</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                {countryData[selectedCountries[0]]?.description && (
                                  <span className="text-[10px] text-muted-foreground leading-tight max-w-[250px] truncate">
                                    {countryData[selectedCountries[0]].description}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            {selectedCountries.map((country) => {
                              const req = countryData[country]
                              return (
                                <TableCell key={country} className="py-3 text-center">
                                  {renderStatusCell(req)}
                                </TableCell>
                              )
                            })}
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>

                    {/* ─── Summary Row ──────────────────────────────────── */}
                    <TableRow className="bg-teal-50/60 dark:bg-teal-950/20 hover:bg-teal-50/60 dark:hover:bg-teal-950/20 border-t-2 border-teal-200 dark:border-teal-800">
                      <TableCell className="py-3 sticky left-0 bg-inherit z-10">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span className="text-xs font-bold text-teal-700 dark:text-teal-300">Total obligatorios</span>
                        </div>
                      </TableCell>
                      {selectedCountries.map((country) => (
                        <TableCell key={country} className="py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge className="text-sm font-bold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                              {mandatoryPerCountry[country] || 0}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground">
                              de {filteredRequirements.filter((r) => r.country === country).length} totales
                            </span>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* ─── Legend ────────────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Info className="w-3.5 h-3.5" />
                Leyenda:
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-red-400" />
                <span className="text-xs text-muted-foreground">Obligatorio — requisito exigido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                <span className="text-xs text-muted-foreground">No obligatorio — recomendado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-600" />
                <span className="text-xs text-muted-foreground">No aplica — no requerido para este país</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-amber-400" />
                <span className="text-xs text-muted-foreground">Borde ámbar = existe brecha entre países</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-red-400" />
                <span className="text-xs text-muted-foreground">Borde rojo = requisitos obligatorios</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-emerald-400" />
                <span className="text-xs text-muted-foreground">Borde verde = solo opcionales</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}
