'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

interface Port {
  id: string
  name: string
  country: string
  code: string
  timezone: string | null
}

export function Ports() {
  const [ports, setPorts] = useState<Port[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`/api/ports?search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((d) => { setPorts(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [search])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, país o código..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-500" /> Directorio de Puertos ({ports.length})
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
                    <TableHead>Nombre</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Zona Horaria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ports.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="text-sm">{p.country}</TableCell>
                      <TableCell className="text-sm font-mono">{p.code}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.timezone || '—'}</TableCell>
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
