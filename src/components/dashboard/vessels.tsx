'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Anchor, Ship, Gauge, Calendar, Building2, Flag } from 'lucide-react'
import { motion } from 'framer-motion'

const VESSEL_STATUS_COLORS: Record<string, string> = {
  'En tránsito': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'En puerto': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'Cargando': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Descargando': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'En mantenimiento': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'En reparación': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const VESSEL_TYPES = ['Portacontenedores', 'Granelero', 'Tanque', 'Multipropósito', 'Ro-Ro', 'Crucero']

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

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
}

export function Vessels() {
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    fetch('/api/vessels')
      .then((r) => r.json())
      .then((d) => { setVessels(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Flota de Embarcaciones ({vessels.length})</h2>
        <Button onClick={() => setShowAdd(true)} className="h-9 bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-1" /> Nueva Embarcación
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {vessels.map((v, i) => (
          <motion.div key={v.id} custom={i} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
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
                  <Badge variant="secondary" className={`text-[10px] ${VESSEL_STATUS_COLORS[v.status] || ''}`}>
                    {v.status}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Flag className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{v.flag}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Anchor className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{v.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5 text-muted-foreground" />
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

                {v.currentLocation && (
                  <div className="pt-2 border-t">
                    <p className="text-[10px] text-muted-foreground">Ubicación actual</p>
                    <p className="text-xs font-medium">{v.currentLocation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

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
    </motion.div>
  )
}
