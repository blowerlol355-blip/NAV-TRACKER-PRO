'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Box } from 'lucide-react'
import { motion } from 'framer-motion'

const CONTAINER_STATUS_COLORS: Record<string, string> = {
  'Vacío': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'Cargado': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'Lleno': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  'En tránsito': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  'En espera': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Descargado': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'En inspección': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'En aduana': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
}

const CONTAINER_TYPES = ['20ft Dry', '40ft Dry', '40ft HC', '20ft Refrigerado', '40ft Refrigerado', '20ft Open Top']

interface Container {
  id: string
  number: string
  type: string
  sealNumber: string | null
  weight: number
  status: string
  shipment: { reference: string }
}

export function Containers() {
  const [containers, setContainers] = useState<Container[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const fetchContainers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, type: typeFilter })
      const res = await fetch(`/api/containers?${params}`)
      const data = await res.json()
      setContainers(data)
    } catch {
      console.error('Error fetching containers')
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter])

  useEffect(() => {
    fetchContainers()
  }, [fetchContainers])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por número o sello..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {CONTAINER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Box className="w-4 h-4 text-teal-500" /> Contenedores ({containers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-280px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Sello</TableHead>
                    <TableHead>Peso (ton)</TableHead>
                    <TableHead>Envío</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {containers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-sm font-mono">{c.number}</TableCell>
                      <TableCell className="text-sm">{c.type}</TableCell>
                      <TableCell className="text-sm font-mono text-xs">{c.sealNumber || '—'}</TableCell>
                      <TableCell className="text-sm">{c.weight.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{c.shipment?.reference || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${CONTAINER_STATUS_COLORS[c.status] || ''}`}>{c.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
