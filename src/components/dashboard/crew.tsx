'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Users, UserCheck, Navigation, AlertTriangle, XCircle, Search, Plus,
  ChevronDown, ChevronRight, Phone, Mail, Shield, Award, FileCheck,
  Ship, Eye, UserPlus, IdCard, Globe2, Building2, Calendar, Clock,
  Ban, AlertOctagon, Download, Printer
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { exportToCSV, printTable } from '@/lib/export-utils'

const STATUS_COLORS: Record<string, string> = {
  'Activo': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Inactivo': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Licencia Vencida': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'En viaje': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
}

const ROLE_COLORS: Record<string, string> = {
  'Capitán': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Piloto': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'Oficial': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Marinero': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Jefe de Máquinas': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Ingeniero': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

const ROLE_ICONS: Record<string, string> = {
  'Capitán': '⚓',
  'Piloto': '🧭',
  'Oficial': '📋',
  'Marinero': '⛵',
  'Jefe de Máquinas': '🔧',
  'Ingeniero': '⚙️',
}

const ALL_ROLES = ['Capitán', 'Piloto', 'Oficial', 'Marinero', 'Jefe de Máquinas', 'Ingeniero']
const ALL_STATUSES = ['Activo', 'Inactivo', 'Licencia Vencida', 'En viaje']

const FLAG_EMOJIS: Record<string, string> = {
  'Colombia': '🇨🇴', 'Venezuela': '🇻🇪', 'Panamá': '🇵🇦', 'México': '🇲🇽',
  'Brasil': '🇧🇷', 'España': '🇪🇸', 'Perú': '🇵🇪', 'Ecuador': '🇪🇨',
  'Chile': '🇨🇱', 'Argentina': '🇦🇷', 'Cuba': '🇨🇺', 'República Dominicana': '🇩🇴',
  'Costa Rica': '🇨🇷', 'Guatemala': '🇬🇹', 'Honduras': '🇭🇳', 'Nicaragua': '🇳🇮',
  'El Salvador': '🇸🇻', 'Uruguay': '🇺🇾', 'Paraguay': '🇵🇾', 'Bolivia': '🇧🇴',
  'Estados Unidos': '🇺🇸', 'China': '🇨🇳', 'India': '🇮🇳', 'Filipinas': '🇵🇭',
  'Indonesia': '🇮🇩', 'Ucrania': '🇺🇦', 'Rusia': '🇷🇺', 'Myanmar': '🇲🇲',
}

interface Certification {
  name: string
  number: string
  expiryDate: string
}

interface Assignment {
  id: string
  crewId: string
  shipmentId: string
  role: string
  assignedAt: string
  remarks: string | null
  shipment: {
    reference: string
    status: string
    origin: string
    destination: string
  }
}

interface CrewMember {
  id: string
  fullName: string
  licenseId: string
  nationality: string
  identityDoc: string | null
  identityDocType: string | null
  certifications: string | null
  carrierCompany: string | null
  emergencyContact: string | null
  licenseExpiry: string | null
  role: string
  status: string
  photoUrl: string | null
  email: string | null
  phone: string | null
  createdAt: string
  assignments: Assignment[]
}

function getFlagEmoji(nationality: string): string {
  for (const [key, emoji] of Object.entries(FLAG_EMOJIS)) {
    if (nationality.toLowerCase().includes(key.toLowerCase())) return emoji
  }
  return '🏳️'
}

function getLicenseStatus(expiryDate: string | null): { status: 'valid' | 'expiring' | 'expired'; daysLeft: number | null } {
  if (!expiryDate) return { status: 'valid', daysLeft: null }
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { status: 'expired', daysLeft: diffDays }
  if (diffDays <= 30) return { status: 'expiring', daysLeft: diffDays }
  return { status: 'valid', daysLeft: diffDays }
}

function parseCertifications(certStr: string | null): Certification[] {
  if (!certStr) return []
  try {
    const parsed = JSON.parse(certStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function Crew() {
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [nationalityFilter, setNationalityFilter] = useState('all')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addingCrew, setAddingCrew] = useState(false)

  useEffect(() => {
    fetch('/api/crew')
      .then((r) => r.json())
      .then((d) => { setCrew(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const nationalities = useMemo(() => {
    const set = new Set(crew.map(c => c.nationality))
    return Array.from(set).sort()
  }, [crew])

  const filteredCrew = useMemo(() => {
    return crew.filter(c => {
      const matchesSearch = !search ||
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.licenseId.toLowerCase().includes(search.toLowerCase())
      const matchesRole = roleFilter === 'all' || c.role === roleFilter
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      const matchesNationality = nationalityFilter === 'all' || c.nationality === nationalityFilter
      return matchesSearch && matchesRole && matchesStatus && matchesNationality
    })
  }, [crew, search, roleFilter, statusFilter, nationalityFilter])

  // Stats
  const totalCrew = crew.length
  const activeCrew = crew.filter(c => c.status === 'Activo').length
  const inTransitCrew = crew.filter(c => c.status === 'En viaje').length
  const expiringLicenses = crew.filter(c => {
    const ls = getLicenseStatus(c.licenseExpiry)
    return ls.status === 'expiring'
  }).length
  const expiredLicenses = crew.filter(c => {
    const ls = getLicenseStatus(c.licenseExpiry)
    return ls.status === 'expired'
  }).length

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddCrew = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAddingCrew(true)
    const form = new FormData(e.currentTarget)
    const certs = [
      { name: form.get('cert1Name') as string, number: form.get('cert1Number') as string || 'PEND', expiryDate: form.get('cert1Expiry') as string || '' },
    ].filter(c => c.name)

    const body = {
      fullName: form.get('fullName') as string,
      licenseId: form.get('licenseId') as string,
      nationality: form.get('nationality') as string,
      role: form.get('role') as string,
      carrierCompany: form.get('carrierCompany') as string || null,
      email: form.get('email') as string || null,
      phone: form.get('phone') as string || null,
      emergencyContact: form.get('emergencyContact') as string || null,
      licenseExpiry: form.get('licenseExpiry') as string || null,
      certifications: certs.length > 0 ? JSON.stringify(certs) : null,
      status: 'Activo',
    }
    try {
      await fetch('/api/crew', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      toast.success('Tripulante registrado exitosamente')
      setShowAdd(false)
      const res = await fetch('/api/crew')
      setCrew(await res.json())
    } catch {
      toast.error('Error al registrar tripulante')
    } finally {
      setAddingCrew(false)
    }
  }

  const activeFilterCount = [roleFilter !== 'all', statusFilter !== 'all', nationalityFilter !== 'all', search !== ''].filter(Boolean).length

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-32 rounded-full" />)}
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
        {/* Summary Stats Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
            <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{totalCrew} Tripulantes</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{activeCrew} Activos</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20">
            <Navigation className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">{inTransitCrew} En viaje</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{expiringLicenses} Por vencer</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">{expiredLicenses} Vencidas</span>
          </div>
          <div className="ml-auto">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  if (filteredCrew.length === 0) { toast.error('No hay datos para exportar'); return }
                  exportToCSV(`tripulacion_${new Date().toISOString().slice(0, 10)}`, filteredCrew.map((c) => ({
                    Nombre: c.fullName, Licencia: c.licenseId, Rol: c.role,
                    Nacionalidad: c.nacionalidad, Empresa: c.carrierCompany || '',
                    'Licencia Vence': c.licenseExpiry ? new Date(c.licenseExpiry).toLocaleDateString('es-MX') : '',
                    Estado: c.status,
                  })))
                  toast.success('Datos exportados exitosamente')
                }}
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/30"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
              <Button
                onClick={() => {
                  if (filteredCrew.length === 0) { toast.error('No hay datos para imprimir'); return }
                  printTable('Tripulación', [
                    { key: 'Nombre', label: 'Nombre' },
                    { key: 'Licencia', label: 'Licencia' },
                    { key: 'Rol', label: 'Rol' },
                    { key: 'Nacionalidad', label: 'Nacionalidad' },
                    { key: 'Empresa', label: 'Empresa' },
                    { key: 'Licencia Vence', label: 'Licencia Vence' },
                    { key: 'Estado', label: 'Estado' },
                  ], filteredCrew.map((c) => ({
                    Nombre: c.fullName, Licencia: c.licenseId, Rol: c.role,
                    Nacionalidad: c.nacionalidad, Empresa: c.carrierCompany || '',
                    'Licencia Vence': c.licenseExpiry ? new Date(c.licenseExpiry).toLocaleDateString('es-MX') : '',
                    Estado: c.status,
                  })))
                }}
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/30"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
              <Button onClick={() => setShowAdd(true)} className="h-9 bg-teal-600 hover:bg-teal-700 gap-1.5 group">
                <UserPlus className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                Agregar Tripulante
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-teal-50/80 via-white to-cyan-50/80 dark:from-teal-950/30 dark:via-background dark:to-cyan-950/30 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o licencia..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px] h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_ICONS[r] || ''} {r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[170px] h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
                  <SelectTrigger className="w-[170px] h-9 bg-white/60 dark:bg-background/60 backdrop-blur-sm">
                    <SelectValue placeholder="Nacionalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {nationalities.map(n => <SelectItem key={n} value={n}>{getFlagEmoji(n)} {n}</SelectItem>)}
                  </SelectContent>
                </Select>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-6 px-2 text-[10px] bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                    {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Table */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Tripulación ({filteredCrew.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[calc(100vh-360px)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-8" />
                    <TableHead className="text-xs font-semibold">Nombre</TableHead>
                    <TableHead className="text-xs font-semibold">Licencia</TableHead>
                    <TableHead className="text-xs font-semibold">Rol</TableHead>
                    <TableHead className="text-xs font-semibold">Nacionalidad</TableHead>
                    <TableHead className="text-xs font-semibold">Empresa</TableHead>
                    <TableHead className="text-xs font-semibold">Licencia Vencimiento</TableHead>
                    <TableHead className="text-xs font-semibold">Estado</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredCrew.map((c, rowIndex) => {
                      const licenseStatus = getLicenseStatus(c.licenseExpiry)
                      const isExpanded = expandedRows.has(c.id)
                      const isBlocked = licenseStatus.status === 'expired' || licenseStatus.status === 'expiring'

                      // Row background for license warnings
                      let rowBg = rowIndex % 2 === 1 ? 'bg-muted/20' : ''
                      if (licenseStatus.status === 'expired') rowBg = 'bg-red-50/60 dark:bg-red-950/20'
                      else if (licenseStatus.status === 'expiring') rowBg = 'bg-amber-50/60 dark:bg-amber-950/20'

                      return (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: rowIndex * 0.02 }}
                          className={`${rowBg} hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition-all cursor-pointer border-l-4 ${licenseStatus.status === 'expired' ? 'border-l-red-500' : licenseStatus.status === 'expiring' ? 'border-l-amber-500' : 'border-l-transparent hover:border-l-teal-500'}`}
                          onClick={() => toggleRow(c.id)}
                        >
                          <TableCell className="w-8 py-2">
                            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </motion.div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm font-semibold text-teal-700 dark:text-teal-300">
                                {c.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium leading-tight">{c.fullName}</p>
                                {c.identityDoc && (
                                  <p className="text-[10px] text-muted-foreground">{c.identityDocType}: {c.identityDoc}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-xs font-mono font-medium text-teal-600 dark:text-teal-400">{c.licenseId}</span>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant="secondary" className={`text-[10px] ${ROLE_COLORS[c.role] || ''}`}>
                              {ROLE_ICONS[c.role] || ''} {c.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-xs">{getFlagEmoji(c.nationality)} {c.nationality}</span>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-xs text-muted-foreground">{c.carrierCompany || '—'}</span>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs">
                                {c.licenseExpiry ? new Date(c.licenseExpiry).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              </span>
                              {licenseStatus.status === 'expired' && (
                                <Badge variant="secondary" className="text-[9px] w-fit bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
                                  <XCircle className="w-2.5 h-2.5 mr-1" />Vencida ({Math.abs(licenseStatus.daysLeft!)}d)
                                </Badge>
                              )}
                              {licenseStatus.status === 'expiring' && (
                                <Badge variant="secondary" className="text-[9px] w-fit bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                                  <AlertTriangle className="w-2.5 h-2.5 mr-1" />{licenseStatus.daysLeft}d restantes
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="secondary" className={`text-[10px] ${STATUS_COLORS[c.status] || ''}`}>
                                {c.status}
                              </Badge>
                              {isBlocked && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <Ban className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-red-600 text-white border-red-700 shadow-xl max-w-[220px]">
                                    <p className="font-semibold text-xs">No asignable a nuevos envíos</p>
                                    <p className="text-[10px] text-red-100 mt-0.5">
                                      {licenseStatus.status === 'expired' ? 'La licencia está vencida' : 'La licencia vence en menos de 30 días'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/30"
                              onClick={(e) => { e.stopPropagation(); setSelectedCrew(c); setShowDetail(true) }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Expanded Row Content */}
            <AnimatePresence>
              {expandedRows.size > 0 && (
                <div className="border-t">
                  {filteredCrew.filter(c => expandedRows.has(c.id)).map((c) => {
                    const certs = parseCertifications(c.certifications)
                    const licenseStatus = getLicenseStatus(c.licenseExpiry)
                    const isBlocked = licenseStatus.status === 'expired' || licenseStatus.status === 'expiring'

                    return (
                      <motion.div
                        key={`expanded-${c.id}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-muted/20 border-b">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Certifications */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold flex items-center gap-1.5">
                                <Award className="w-3.5 h-3.5 text-teal-500" />
                                Certificaciones
                              </p>
                              {certs.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground">Sin certificaciones registradas</p>
                              ) : (
                                <div className="space-y-1">
                                  {certs.map((cert, idx) => {
                                    const certStatus = getLicenseStatus(cert.expiryDate)
                                    return (
                                      <div key={idx} className="flex items-center justify-between p-1.5 bg-background/60 rounded-md text-[11px]">
                                        <div className="flex items-center gap-1.5">
                                          {certStatus.status === 'expired' ? (
                                            <XCircle className="w-3 h-3 text-red-500" />
                                          ) : certStatus.status === 'expiring' ? (
                                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                                          ) : (
                                            <FileCheck className="w-3 h-3 text-emerald-500" />
                                          )}
                                          <span className="font-medium">{cert.name}</span>
                                        </div>
                                        <span className={`text-[10px] ${certStatus.status === 'expired' ? 'text-red-500' : certStatus.status === 'expiring' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                          {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }) : '—'}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Emergency Contact */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-red-500" />
                                Contacto de Emergencia
                              </p>
                              <div className="p-2 bg-background/60 rounded-md">
                                <p className="text-sm">{c.emergencyContact || '—'}</p>
                              </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-teal-500" />
                                Contacto
                              </p>
                              <div className="space-y-1">
                                {c.email && (
                                  <div className="flex items-center gap-1.5 text-[11px] p-1.5 bg-background/60 rounded-md">
                                    <Mail className="w-3 h-3 text-muted-foreground" />
                                    <span>{c.email}</span>
                                  </div>
                                )}
                                {c.phone && (
                                  <div className="flex items-center gap-1.5 text-[11px] p-1.5 bg-background/60 rounded-md">
                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                    <span>{c.phone}</span>
                                  </div>
                                )}
                                {!c.email && !c.phone && (
                                  <p className="text-[11px] text-muted-foreground">Sin información de contacto</p>
                                )}
                              </div>
                            </div>

                            {/* Assigned Shipments */}
                            <div className="space-y-2">
                              <p className="text-xs font-semibold flex items-center gap-1.5">
                                <Ship className="w-3.5 h-3.5 text-teal-500" />
                                Envíos Asignados
                                {c.assignments.length > 0 && (
                                  <Badge variant="secondary" className="text-[9px] h-4 ml-1">{c.assignments.length}</Badge>
                                )}
                              </p>
                              {c.assignments.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground">Sin envíos asignados</p>
                              ) : (
                                <ScrollArea className="max-h-24">
                                  <div className="space-y-1">
                                    {c.assignments.map((a) => (
                                      <div key={a.id} className="flex items-center justify-between p-1.5 bg-background/60 rounded-md text-[11px]">
                                        <span className="font-mono font-medium text-teal-600 dark:text-teal-400">{a.shipment.reference}</span>
                                        <Badge variant="outline" className="text-[9px] h-4 px-1">{a.role}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              )}
                            </div>
                          </div>

                          {/* Assignment Block Warning */}
                          {isBlocked && (
                            <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                              <AlertOctagon className="w-4 h-4 text-red-500 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                                  No puede ser asignado a nuevos envíos
                                </p>
                                <p className="text-[10px] text-red-600 dark:text-red-300">
                                  {licenseStatus.status === 'expired'
                                    ? `Licencia vencida hace ${Math.abs(licenseStatus.daysLeft!)} días`
                                    : `Licencia vence en ${licenseStatus.daysLeft} días`}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Crew Detail Dialog */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
            {selectedCrew && (() => {
              const licenseStatus = getLicenseStatus(selectedCrew.licenseExpiry)
              const certs = parseCertifications(selectedCrew.certifications)
              const isBlocked = licenseStatus.status === 'expired' || licenseStatus.status === 'expiring'

              return (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-6 rounded-t-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white">
                        {selectedCrew.fullName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <DialogTitle className="text-white text-lg font-bold">{selectedCrew.fullName}</DialogTitle>
                        <p className="text-teal-100 text-xs font-mono mt-0.5">Licencia: {selectedCrew.licenseId}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge className={`text-[10px] ${STATUS_COLORS[selectedCrew.status]} border-0`}>
                            {selectedCrew.status}
                          </Badge>
                          <Badge variant="secondary" className={`text-[10px] ${ROLE_COLORS[selectedCrew.role] || ''} border-0`}>
                            {ROLE_ICONS[selectedCrew.role] || ''} {selectedCrew.role}
                          </Badge>
                        </div>
                      </div>
                      {isBlocked && (
                        <div className="bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-2 text-center">
                          <Ban className="w-5 h-5 text-red-200 mx-auto mb-1" />
                          <p className="text-[10px] text-red-100 font-semibold">NO ASIGNABLE</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Globe2 className="w-3 h-3" /> Nacionalidad</p>
                        <p className="text-sm font-semibold">{getFlagEmoji(selectedCrew.nationality)} {selectedCrew.nationality}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Empresa</p>
                        <p className="text-sm font-semibold">{selectedCrew.carrierCompany || '—'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Licencia Vence</p>
                        <p className={`text-sm font-semibold ${licenseStatus.status === 'expired' ? 'text-red-600 dark:text-red-400' : licenseStatus.status === 'expiring' ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                          {selectedCrew.licenseExpiry ? new Date(selectedCrew.licenseExpiry).toLocaleDateString('es-MX') : '—'}
                        </p>
                      </div>
                      {selectedCrew.email && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                          <p className="text-sm font-semibold break-all">{selectedCrew.email}</p>
                        </div>
                      )}
                      {selectedCrew.phone && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</p>
                          <p className="text-sm font-semibold">{selectedCrew.phone}</p>
                        </div>
                      )}
                      {selectedCrew.emergencyContact && (
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Emergencia</p>
                          <p className="text-sm font-semibold">{selectedCrew.emergencyContact}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* License Status Progress */}
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-teal-500" />
                        Estado de Licencia
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span>Vigencia de licencia</span>
                          <span className={`font-medium ${licenseStatus.status === 'expired' ? 'text-red-600 dark:text-red-400' : licenseStatus.status === 'expiring' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {licenseStatus.status === 'valid' && licenseStatus.daysLeft && `Válida (${licenseStatus.daysLeft} días restantes)`}
                            {licenseStatus.status === 'expiring' && `Por vencer (${licenseStatus.daysLeft} días)`}
                            {licenseStatus.status === 'expired' && `Vencida hace ${Math.abs(licenseStatus.daysLeft!)} días`}
                            {licenseStatus.daysLeft === null && 'Sin fecha de vencimiento'}
                          </span>
                        </div>
                        <Progress
                          value={licenseStatus.daysLeft !== null
                            ? Math.max(0, Math.min(100, ((365 - (licenseStatus.daysLeft ?? 0)) / 365) * 100))
                            : 100
                          }
                          className={`h-2 ${licenseStatus.status === 'expired' ? '[&>div]:bg-red-500' : licenseStatus.status === 'expiring' ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Certifications */}
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4 text-teal-500" />
                        Certificaciones
                        {certs.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-5 ml-1">{certs.length}</Badge>
                        )}
                      </p>
                      {certs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin certificaciones registradas</p>
                      ) : (
                        <div className="space-y-2">
                          {certs.map((cert, idx) => {
                            const certStatus = getLicenseStatus(cert.expiryDate)
                            return (
                              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {certStatus.status === 'expired' ? (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  ) : certStatus.status === 'expiring' ? (
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                  ) : (
                                    <FileCheck className="w-4 h-4 text-emerald-500" />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium">{cert.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono">{cert.number}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`text-xs font-medium ${certStatus.status === 'expired' ? 'text-red-600' : certStatus.status === 'expiring' ? 'text-amber-600' : ''}`}>
                                    {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }) : '—'}
                                  </p>
                                  {certStatus.status !== 'valid' && (
                                    <Badge variant="secondary" className={`text-[9px] ${certStatus.status === 'expired' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                      {certStatus.status === 'expired' ? 'Vencida' : 'Por vencer'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Assigned Shipments */}
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Ship className="w-4 h-4 text-teal-500" />
                        Historial de Envíos
                        {selectedCrew.assignments.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-5 ml-1">{selectedCrew.assignments.length}</Badge>
                        )}
                      </p>
                      {selectedCrew.assignments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin envíos asignados</p>
                      ) : (
                        <ScrollArea className="max-h-48">
                          <div className="space-y-2">
                            {selectedCrew.assignments.map((a) => (
                              <div key={a.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Ship className="w-4 h-4 text-teal-500" />
                                  <div>
                                    <p className="text-sm font-mono font-medium text-teal-600 dark:text-teal-400">{a.shipment.reference}</p>
                                    <p className="text-[10px] text-muted-foreground">{a.shipment.origin} → {a.shipment.destination}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="text-[10px] h-5">{a.role}</Badge>
                                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                                    <Clock className="w-3 h-3" />
                                    {new Date(a.assignedAt).toLocaleDateString('es-MX')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </div>
                </>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* Add Crew Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-5 rounded-t-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
              <DialogTitle className="text-white text-lg font-bold flex items-center gap-2 relative z-10">
                <UserPlus className="w-5 h-5" />
                Nuevo Tripulante
              </DialogTitle>
              <p className="text-teal-100 text-xs mt-1 relative z-10">Complete los datos para registrar un nuevo miembro de la tripulación</p>
            </div>

            <form onSubmit={handleAddCrew} className="p-5 space-y-5">
              {/* Información Personal */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-teal-500" />
                  Información Personal
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nombre Completo</Label>
                    <Input name="fullName" placeholder="Nombre completo" required className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">ID de Licencia</Label>
                    <Input name="licenseId" placeholder="Ej: LIC-2025-001" required className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nacionalidad</Label>
                    <Input name="nationality" placeholder="Ej: Colombia" required className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Rol</Label>
                    <Select name="role" defaultValue="Marinero">
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_ICONS[r] || ''} {r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Información de Contacto */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-teal-500" />
                  Información de Contacto
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input name="email" type="email" placeholder="correo@ejemplo.com" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Teléfono</Label>
                    <Input name="phone" placeholder="+57 300 123 4567" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Contacto de Emergencia</Label>
                    <Input name="emergencyContact" placeholder="Nombre y teléfono" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Empresa Transportista</Label>
                    <Input name="carrierCompany" placeholder="Nombre de la empresa" className="h-8 text-sm" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Licencia */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <IdCard className="w-3.5 h-3.5 text-teal-500" />
                  Información de Licencia
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fecha de Vencimiento de Licencia</Label>
                    <Input name="licenseExpiry" type="date" className="h-8 text-sm" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Certificación */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-teal-500" />
                  Certificación Principal
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nombre</Label>
                    <Input name="cert1Name" placeholder="Ej: STCW" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Número</Label>
                    <Input name="cert1Number" placeholder="CERT-001" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Vencimiento</Label>
                    <Input name="cert1Expiry" type="date" className="h-8 text-sm" />
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={addingCrew}>
                  {addingCrew ? 'Registrando...' : 'Registrar Tripulante'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  )
}
