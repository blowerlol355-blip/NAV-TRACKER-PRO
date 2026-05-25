 'use client'

import React from 'react'
import { useState, useEffect, useMemo, useRef } from 'react'
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
  Ban, AlertOctagon, Download, Printer, RefreshCw, Paperclip
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

const SURFACE_CARD = 'border border-orange-400/25 bg-zinc-950/95 text-zinc-100 shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
const SURFACE_SOFT = 'rounded-lg border border-orange-400/20 bg-zinc-900/80'

const ROLE_BADGE_DARK: Record<string, string> = {
  'Capitán': 'border-amber-400/45 bg-amber-500/15 text-amber-200',
  'Piloto': 'border-sky-400/45 bg-sky-500/15 text-sky-200',
  'Oficial': 'border-indigo-400/45 bg-indigo-500/15 text-indigo-200',
  'Marinero': 'border-zinc-400/45 bg-zinc-500/15 text-zinc-200',
  'Jefe de Máquinas': 'border-orange-400/50 bg-orange-500/20 text-orange-200',
  'Ingeniero': 'border-purple-400/45 bg-purple-500/15 text-purple-200',
}

const ROLE_ROW_ACCENT: Record<string, string> = {
  'Capitán': 'border-l-2 border-l-amber-400',
  'Piloto': 'border-l-2 border-l-sky-400',
  'Oficial': 'border-l-2 border-l-indigo-400',
  'Marinero': 'border-l-2 border-l-zinc-400',
  'Jefe de Máquinas': 'border-l-2 border-l-orange-400',
  'Ingeniero': 'border-l-2 border-l-purple-400',
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
    vessel?: {
      name: string
    } | null
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

function getFlagEmoji(nationality?: string | null): string {
  if (!nationality || typeof nationality !== 'string') return '🏳️'
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
  const attachmentsRef = useRef<HTMLInputElement | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  useEffect(() => {
    const normalize = (d: any): CrewMember[] => {
      if (Array.isArray(d)) return d
      if (d && Array.isArray(d.crew)) return d.crew
      if (d && Array.isArray(d.data)) return d.data
      return []
    }
    fetch('/api/crew')
      .then((r) => r.json())
      .then((d) => { setCrew(normalize(d)); setLoading(false) })
      .catch(() => { setCrew([]); setLoading(false) })
  }, [])

  const nationalities = useMemo(() => {
    const items = crew
      .filter((c): c is CrewMember => c != null && typeof c === 'object')
      .map(c => (typeof c.nationality === 'string' ? c.nationality : ''))
      .filter(n => n && n.trim().length > 0) as string[]
    const unique = Array.from(new Set(items))
    return unique.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-orange-500/40">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-300">{totalCrew} Tripulantes</span>
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
                    Nacionalidad: c.nationality, Empresa: c.carrierCompany || '',
                    'Licencia Vence': c.licenseExpiry ? new Date(c.licenseExpiry).toLocaleDateString('es-MX') : '',
                    Estado: c.status,
                  })))
                  toast.success('Datos exportados exitosamente')
                }}
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-orange-500/40 bg-zinc-900 text-orange-200 hover:bg-zinc-800"
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
                    Nacionalidad: c.nationality, Empresa: c.carrierCompany || '',
                    'Licencia Vence': c.licenseExpiry ? new Date(c.licenseExpiry).toLocaleDateString('es-MX') : '',
                    Estado: c.status,
                  })))
                }}
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-orange-500/40 bg-zinc-900 text-orange-200 hover:bg-zinc-800"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
              <Button onClick={() => setShowAdd(true)} className="h-9 bg-orange-600 hover:bg-orange-500 text-zinc-950 font-semibold gap-1.5 group">
                <UserPlus className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                Agregar Tripulante
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <Card className={`overflow-hidden ${SURFACE_CARD}`}>
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300/80" />
                  <Input
                    placeholder="Buscar por nombre o licencia..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 border-orange-400/30 bg-zinc-900/90 text-zinc-100 placeholder:text-zinc-500"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[160px] h-9 border-orange-400/30 bg-zinc-900/90 text-zinc-100">
                    <SelectValue placeholder="Rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_ICONS[r] || ''} {r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[170px] h-9 border-orange-400/30 bg-zinc-900/90 text-zinc-100">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
                  <SelectTrigger className="w-[170px] h-9 border-orange-400/30 bg-zinc-900/90 text-zinc-100">
                    <SelectValue placeholder="Nacionalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {nationalities.map(n => <SelectItem key={n} value={n}>{getFlagEmoji(n)} {n}</SelectItem>)}
                  </SelectContent>
                </Select>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-6 px-2 text-[10px] bg-orange-500/20 text-orange-200 border-orange-500/40">
                    {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Table */}
        <Card className={`overflow-hidden ${SURFACE_CARD}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-orange-200">Tripulación ({filteredCrew.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-900/90 hover:bg-zinc-900/90">
                    <TableHead className="text-xs font-semibold text-orange-200">Nombre</TableHead>
                    <TableHead className="text-xs font-semibold text-orange-200">Licencia</TableHead>
                    <TableHead className="text-xs font-semibold text-orange-200">Rol</TableHead>
                    <TableHead className="text-xs font-semibold text-orange-200">Nacionalidad</TableHead>
                    <TableHead className="text-xs font-semibold text-orange-200">Empresa</TableHead>
                    <TableHead className="text-xs font-semibold text-orange-200">Licencia Vencimiento</TableHead>
                    <TableHead className="text-xs font-semibold text-orange-200">Estado</TableHead>
                    <TableHead className="text-xs font-semibold text-center text-orange-200">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCrew.map((c) => {
                    const isExpanded = expandedRows.has(c.id)
                    const crewVessels = Array.from(
                      new Set(
                        (c.assignments || [])
                          .map((a) => a.shipment?.vessel?.name)
                          .filter((name): name is string => Boolean(name))
                      )
                    )
                    return (
                      <React.Fragment key={c.id}>
                        <TableRow className={`border-orange-500/10 text-zinc-100 hover:bg-zinc-900/40 ${ROLE_ROW_ACCENT[c.role] || 'border-l-2 border-l-orange-500/30'}`}>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-400/40 bg-orange-500/20 text-[11px] font-bold text-orange-200">
                                {c.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-zinc-100 leading-none">{c.fullName}</p>
                                <p className="text-[10px] uppercase tracking-wide text-orange-300/80">Tripulante</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">{c.licenseId}</TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className={`gap-1 text-[11px] font-medium ${ROLE_BADGE_DARK[c.role] || 'border-orange-400/45 bg-orange-500/15 text-orange-200'}`}>
                              <span>{ROLE_ICONS[c.role] || '👤'}</span>
                              {c.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">{c.nationality}</TableCell>
                          <TableCell className="py-2">{c.carrierCompany || '—'}</TableCell>
                          <TableCell className="py-2">{c.licenseExpiry || '—'}</TableCell>
                          <TableCell className="py-2">{c.status}</TableCell>
                          <TableCell className="py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedCrew(c); setShowDetail(true) }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => toggleRow(c.id)}>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={8} className="p-3">
                              <div className={`space-y-3 p-3 ${SURFACE_SOFT}`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="inline-flex items-center gap-2 rounded-md border border-orange-500/30 bg-zinc-950/70 px-2.5 py-1">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/25 text-xs font-bold text-orange-200">
                                        {c.fullName.charAt(0).toUpperCase()}
                                      </span>
                                      <span className="font-semibold text-orange-100">{c.fullName}</span>
                                    </div>
                                    <div className="text-xs text-zinc-400">Licencia: {c.licenseId}</div>
                                    <div className="mt-1 text-[11px] text-orange-300/90">
                                      Embarcación:{' '}
                                      <span className="font-semibold text-orange-200">
                                        {crewVessels.length > 0 ? crewVessels.join(', ') : 'Sin embarcación asignada'}
                                      </span>
                                    </div>
                                    <Badge variant="outline" className={`mt-1 h-5 gap-1 text-[10px] ${ROLE_BADGE_DARK[c.role] || 'border-orange-400/45 bg-orange-500/15 text-orange-200'}`}>
                                      <span>{ROLE_ICONS[c.role] || '👤'}</span>
                                      {c.role}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                                    <input id={`attachments-${c.id}`} type="file" multiple className="hidden" onChange={async (e) => {
                                      const input = e.currentTarget
                                      const files = input.files ? Array.from(input.files) : []
                                      if (!files.length) return
                                      const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
                                        const reader = new FileReader()
                                        reader.onload = () => { const res = reader.result as string; resolve(res.split(',')[1] || '') }
                                        reader.onerror = reject
                                        reader.readAsDataURL(file)
                                      })
                                      const attachments = await Promise.all(files.map(async (f) => ({ filename: f.name, contentBase64: await toBase64(f), name: f.name, type: f.type })))
                                      try {
                                        const res = await fetch(`/api/crew/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attachments }) })
                                        if (!res.ok) {
                                          const j = (await res.json().catch(() => ({}))) as { error?: string }
                                          throw new Error(j.error || `No se pudo subir (${res.status})`)
                                        }
                                        const updated = await res.json()
                                        const raw = await fetch('/api/crew').then(r => r.json())
                                        const normalize = (d: any): CrewMember[] => {
                                          if (Array.isArray(d)) return d
                                          if (d && Array.isArray(d.crew)) return d.crew
                                          if (d && Array.isArray(d.data)) return d.data
                                          return []
                                        }
                                        setCrew(normalize(raw))
                                        setSelectedCrew(updated)
                                        toast.success('Documentos subidos')
                                      } catch (err) {
                                        console.error(err)
                                        toast.error(err instanceof Error ? err.message : 'Error al subir documentos')
                                      } finally {
                                        input.value = ''
                                      }
                                    }} />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      className="gap-1.5 text-orange-200 hover:bg-zinc-800"
                                      onClick={async () => {
                                        const raw = await fetch('/api/crew').then(r => r.json())
                                        const normalize = (d: any): CrewMember[] => {
                                          if (Array.isArray(d)) return d
                                          if (d && Array.isArray(d.crew)) return d.crew
                                          if (d && Array.isArray(d.data)) return d.data
                                          return []
                                        }
                                        setCrew(normalize(raw))
                                        toast.success('Lista actualizada')
                                      }}
                                    >
                                      <RefreshCw className="w-3.5 h-3.5" />
                                      Refrescar
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="gap-1.5 border-orange-400/35 bg-zinc-900 text-orange-200 hover:bg-zinc-800"
                                      onClick={() => document.getElementById(`attachments-${c.id}`)?.click()}
                                    >
                                      <Paperclip className="w-3.5 h-3.5" />
                                      Adjuntar documentos
                                    </Button>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-sm text-muted-foreground">Documentos</p>
                                  <div className="mt-2 space-y-2">
                                    {(c as any).documents && (c as any).documents.length > 0 ? (c as any).documents.map((doc: any) => (
                                      <div key={doc.id} className="flex items-center justify-between p-2 bg-zinc-950/70 border border-orange-500/20 rounded">
                                        <div>
                                          <div className="font-medium text-sm">{doc.name}</div>
                                          <div className="text-[11px] text-muted-foreground">{doc.type} • {doc.fileSize || '—'}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {doc.fileUrl && <a href={doc.fileUrl} download className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-200 hover:bg-orange-500/30">Descargar</a>}
                                        </div>
                                      </div>
                                    )) : (
                                      <div className="text-sm text-muted-foreground">Sin documentos</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

          </CardContent>
        </Card>

        {/* Crew Detail Dialog */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 border border-orange-500/35 bg-zinc-950 text-zinc-100">
            {selectedCrew && (() => {
              const licenseStatus = getLicenseStatus(selectedCrew.licenseExpiry)
              const certs = parseCertifications(selectedCrew.certifications)
              const isBlocked = licenseStatus.status === 'expired' || licenseStatus.status === 'expiring'

              return (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-black via-zinc-900 to-zinc-800 p-6 rounded-t-lg relative overflow-hidden border-b border-orange-500/30">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white">
                        {selectedCrew.fullName.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <DialogTitle className="text-lg font-bold bg-gradient-to-r from-orange-200 via-orange-300 to-orange-500 bg-clip-text text-transparent">
                          {selectedCrew.fullName}
                        </DialogTitle>
                        <p className="text-orange-200 text-xs font-mono mt-0.5">Licencia: {selectedCrew.licenseId}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge className={`text-[10px] ${STATUS_COLORS[selectedCrew.status]} border-0`}>
                            {selectedCrew.status}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] border ${ROLE_BADGE_DARK[selectedCrew.role] || 'border-orange-400/45 bg-orange-500/15 text-orange-200'}`}>
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
                      <div className="p-3 rounded-lg border border-orange-500/15 bg-zinc-900/70">
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Globe2 className="w-3 h-3" /> Nacionalidad</p>
                        <p className="text-sm font-semibold">{getFlagEmoji(selectedCrew.nationality)} {selectedCrew.nationality}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-orange-500/15 bg-zinc-900/70">
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Empresa</p>
                        <p className="text-sm font-semibold">{selectedCrew.carrierCompany || '—'}</p>
                      </div>
                      <div className="p-3 rounded-lg border border-orange-500/15 bg-zinc-900/70">
                        <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Licencia Vence</p>
                        <p className={`text-sm font-semibold ${licenseStatus.status === 'expired' ? 'text-red-600 dark:text-red-400' : licenseStatus.status === 'expiring' ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                          {selectedCrew.licenseExpiry ? new Date(selectedCrew.licenseExpiry).toLocaleDateString('es-MX') : '—'}
                        </p>
                      </div>
                      {selectedCrew.email && (
                        <div className="p-3 rounded-lg border border-orange-500/15 bg-zinc-900/70">
                          <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                          <p className="text-sm font-semibold break-all">{selectedCrew.email}</p>
                        </div>
                      )}
                      {selectedCrew.phone && (
                        <div className="p-3 rounded-lg border border-orange-500/15 bg-zinc-900/70">
                          <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono</p>
                          <p className="text-sm font-semibold">{selectedCrew.phone}</p>
                        </div>
                      )}
                      {selectedCrew.emergencyContact && (
                        <div className="p-3 rounded-lg border border-orange-500/15 bg-zinc-900/70">
                          <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Emergencia</p>
                          <p className="text-sm font-semibold">{selectedCrew.emergencyContact}</p>
                        </div>
                      )}
                    </div>

                    <Separator />

                      {/* Documents Upload */}
                      <div>
                        <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-orange-400" />
                          Documentos del Tripulante
                        </p>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input id="crew-attachments" type="file" multiple className="hidden" onChange={async (e) => {
                              const files = e.target.files ? Array.from(e.target.files) : []
                              if (!files.length) return
                              const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
                                const reader = new FileReader()
                                reader.onload = () => { const res = reader.result as string; resolve(res.split(',')[1] || '') }
                                reader.onerror = reject
                                reader.readAsDataURL(file)
                              })
                              const attachments = await Promise.all(files.map(async (f) => ({ filename: f.name, contentBase64: await toBase64(f), name: f.name, type: f.type })))
                              try {
                                const res = await fetch(`/api/crew/${selectedCrew!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attachments }) })
                                if (!res.ok) {
                                  const j = (await res.json().catch(() => ({}))) as { error?: string }
                                  throw new Error(j.error || `No se pudo subir (${res.status})`)
                                }
                                const updated = await res.json()
                                // refresh crew list and selected
                                const raw = await fetch('/api/crew').then(r => r.json())
                                const normalize = (d: any): CrewMember[] => {
                                  if (Array.isArray(d)) return d
                                  if (d && Array.isArray(d.crew)) return d.crew
                                  if (d && Array.isArray(d.data)) return d.data
                                  return []
                                }
                                const list = normalize(raw)
                                setCrew(list)
                                setSelectedCrew(updated)
                                toast.success('Documentos subidos')
                              } catch (err) {
                                console.error(err)
                                toast.error(err instanceof Error ? err.message : 'Error al subir documentos')
                              }
                            }} />
                            <Button size="sm" variant="outline" className="border-orange-400/35 bg-zinc-900 text-orange-200 hover:bg-zinc-800" onClick={() => document.getElementById('crew-attachments')?.click()}>Adjuntar CV / Contrato</Button>
                            <Button size="sm" className="bg-orange-600 hover:bg-orange-500 text-zinc-950" onClick={async () => {
                              // refresh documents
                              const raw = await fetch('/api/crew').then(r => r.json())
                              const normalize = (d: any): CrewMember[] => {
                                if (Array.isArray(d)) return d
                                if (d && Array.isArray(d.crew)) return d.crew
                                if (d && Array.isArray(d.data)) return d.data
                                return []
                              }
                              const list = normalize(raw)
                              setCrew(list)
                              const fresh = list.find((x: any) => x.id === selectedCrew?.id)
                              setSelectedCrew(fresh)
                              toast.success('Documentos actualizados')
                            }}>Refrescar</Button>
                          </div>
                          <div className="space-y-1">
                            {(selectedCrew.documents && selectedCrew.documents.length > 0) ? selectedCrew.documents.map((doc: any) => (
                              <div key={doc.id} className="flex items-center justify-between p-2 bg-zinc-900/60 border border-orange-500/20 rounded">
                                <div>
                                  <div className="font-medium text-sm">{doc.name}</div>
                                  <div className="text-[11px] text-muted-foreground">{doc.type} • {doc.fileSize || '—'}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {doc.fileUrl && <a href={doc.fileUrl} download className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-200 hover:bg-orange-500/30">Descargar</a>}
                                </div>
                              </div>
                            )) : (
                              <p className="text-sm text-muted-foreground">Sin documentos</p>
                            )}
                          </div>
                        </div>
                      </div>

                    {/* License Status Progress */}
                    <div>
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-400" />
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
                        <Award className="w-4 h-4 text-orange-400" />
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
                              <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900/60 border border-orange-500/15 rounded-lg">
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
                        <Ship className="w-4 h-4 text-orange-400" />
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
                              <div key={a.id} className="flex items-center justify-between p-3 bg-zinc-900/60 border border-orange-500/15 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Ship className="w-4 h-4 text-orange-400" />
                                  <div>
                                    <p className="text-sm font-mono font-medium text-orange-300">{a.shipment.reference}</p>
                                    <p className="text-[10px] text-muted-foreground">{a.shipment.origin} → {a.shipment.destination}</p>
                                    <p className="text-[10px] text-orange-300/80">
                                      Embarcación: {a.shipment.vessel?.name || 'No definida'}
                                    </p>
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
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 border border-orange-500/35 bg-zinc-950 text-zinc-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-black via-zinc-900 to-zinc-800 p-5 rounded-t-lg relative overflow-hidden border-b border-orange-500/30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
              <DialogTitle className="text-white text-lg font-bold flex items-center gap-2 relative z-10">
                <UserPlus className="w-5 h-5" />
                Nuevo Tripulante
              </DialogTitle>
              <p className="text-orange-200 text-xs mt-1 relative z-10">Complete los datos para registrar un nuevo miembro de la tripulación</p>
            </div>

            <form onSubmit={handleAddCrew} className="p-5 space-y-5">
              {/* Información Personal */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-orange-400" />
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
                  <Phone className="w-3.5 h-3.5 text-orange-400" />
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
                  <IdCard className="w-3.5 h-3.5 text-orange-400" />
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
                  <Award className="w-3.5 h-3.5 text-orange-400" />
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
                <div className="flex items-center gap-3">
                  <input ref={attachmentsRef} type="file" name="attachments" multiple className="hidden" onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : []
                    setSelectedFiles(files)
                  }} />
                  <Button type="button" variant="outline" onClick={() => attachmentsRef.current?.click()}>Adjuntar documentos</Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-500 text-zinc-950 font-semibold" disabled={addingCrew}>
                    {addingCrew ? 'Registrando...' : 'Registrar Tripulante'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  )
}
