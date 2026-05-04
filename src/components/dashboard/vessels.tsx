'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Anchor, Ship, Gauge, Calendar, Building2, Flag, MapPin, Navigation, Clock, Package, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const VESSEL_STATUS_COLORS: Record<string, string> = {
  'En tránsito': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'En puerto': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'Cargando': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Descargando': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'En mantenimiento': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'En reparación': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const VESSEL_STATUS_ACCENT: Record<string, string> = {
  'En tránsito': 'bg-teal-500',
  'En puerto': 'bg-sky-500',
  'Cargando': 'bg-amber-500',
  'Descargando': 'bg-orange-500',
  'En mantenimiento': 'bg-red-500',
  'En reparación': 'bg-red-500',
}

const VESSEL_TYPES = ['Portacontenedores', 'Granelero', 'Tanque', 'Multipropósito', 'Ro-Ro', 'Crucero']

const FLAG_EMOJIS: Record<string, string> = {
  'Panamá': '🇵🇦',
  'Panama': '🇵🇦',
  'Liberia': '🇱🇷',
  'Marshall Islands': '🇲🇭',
  'Hong Kong': '🇭🇰',
  'Singapore': '🇸🇬',
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

export function Vessels() {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null)
  const [vesselShipments, setVesselShipments] = useState<Shipment[]>([])
  const [loadingShipments, setLoadingShipments] = useState(false)

  useEffect(() => {
    fetch('/api/vessels')
      .then((r) => r.json())
      .then((d) => { setVessels(d); setLoading(false) })
      .catch(() => setLoading(false))
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Summary Stats Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
          <Ship className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{totalVessels} Total</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
          <Navigation className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{inTransit} En tránsito</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20">
          <Anchor className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">{inPort} En puerto</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
          <Gauge className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <span className="text-xs font-semibold text-red-700 dark:text-red-300">{underRepair} En reparación</span>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setShowAdd(true)} className="h-9 bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-1" /> Nueva Embarcación
          </Button>
        </div>
      </div>

      {/* Vessel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {vessels.map((v, i) => {
          const utilization = getCapacityUtilization(v)
          const isTransit = v.status === 'En tránsito'
          const accentColor = VESSEL_STATUS_ACCENT[v.status] || 'bg-slate-500'

          return (
            <motion.div key={v.id} custom={i} variants={cardVariants} initial="hidden" animate="visible">
              <Card
                className="hover:shadow-lg hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-200 cursor-pointer relative overflow-hidden group"
                onClick={() => handleOpenDetail(v)}
              >
                {/* Gradient accent on left side */}
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentColor}`} />

                <CardContent className="p-4 space-y-3 flex flex-col h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                        <Ship className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{v.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">IMO: {v.imo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Animated pulse dot for transit */}
                      {isTransit && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
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
                        <span className="text-[10px] font-medium">{utilization}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            utilization > 80 ? 'bg-red-500' : utilization > 60 ? 'bg-amber-500' : 'bg-teal-500'
                          }`}
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
      </div>

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
                    <p>{selectedVessel.name}</p>
                    <p className="text-sm font-normal text-muted-foreground font-mono">IMO: {selectedVessel.imo}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status & Basic Info */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={VESSEL_STATUS_COLORS[selectedVessel.status] || ''}>{selectedVessel.status}</Badge>
                  <Badge variant="outline">{getFlagEmoji(selectedVessel.flag)} {selectedVessel.flag}</Badge>
                  <Badge variant="outline">{selectedVessel.type}</Badge>
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
                    <p className="text-[10px] text-muted-foreground mb-1">Utilización</p>
                    <p className="text-sm font-semibold">{getCapacityUtilization(selectedVessel)}%</p>
                  </div>
                </div>

                <Separator />

                {/* Related Shipments */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-teal-500" /> Envíos relacionados
                  </h4>
                  {loadingShipments ? (
                    <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                  ) : vesselShipments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay envíos asignados a esta embarcación</p>
                  ) : (
                    <div className="space-y-2">
                      {vesselShipments.map((s) => (
                        <div key={s.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-teal-600 dark:text-teal-400">{s.reference}</span>
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
                    <MapPin className="w-4 h-4 text-teal-500" /> Historial de posición
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
                          <div className={`w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-teal-500' : 'bg-muted-foreground/30'}`} />
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
                <Input name="flag" placeholder="🇵🇦 Panamá" required />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700">Registrar</Button>
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
            rgba(20, 184, 166, 0.3) 20px,
            rgba(20, 184, 166, 0.3) 22px
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
