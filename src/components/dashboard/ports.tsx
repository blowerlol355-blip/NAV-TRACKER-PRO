'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Globe, Clock, Landmark } from 'lucide-react'
import { motion } from 'framer-motion'

interface Port {
  id: string
  name: string
  country: string
  code: string
  timezone: string | null
}

const COUNTRY_FLAGS: Record<string, string> = {
  'Venezuela': '🇻🇪',
  'Colombia': '🇨🇴',
  'Panamá': '🇵🇦',
  'Panama': '🇵🇦',
  'Estados Unidos': '🇺🇸',
  'EE.UU.': '🇺🇸',
  'Países Bajos': '🇳🇱',
  'China': '🇨🇳',
  'Brasil': '🇧🇷',
  'Chile': '🇨🇱',
  'México': '🇲🇽',
  'España': '🇪🇸',
  'Japón': '🇯🇵',
  'Corea del Sur': '🇰🇷',
  'Singapur': '🇸🇬',
  'Reino Unido': '🇬🇧',
  'Alemania': '🇩🇪',
  'Italia': '🇮🇹',
  'Argentina': '🇦🇷',
  'Perú': '🇵🇪',
  'Ecuador': '🇪🇨',
}

function getCountryFlag(country: string): string {
  // Try exact match first
  if (COUNTRY_FLAGS[country]) return COUNTRY_FLAGS[country]
  // Try partial match
  for (const [key, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (country.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(country.toLowerCase())) {
      return flag
    }
  }
  return '🏴'
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

  // Stats: ports per country
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    ports.forEach(p => {
      counts[p.country] = (counts[p.country] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [ports])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
      {/* Header with Globe */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
          <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Directorio de Puertos</h2>
          <p className="text-sm text-muted-foreground">{ports.length} puertos registrados en {countryCounts.length} países</p>
        </div>
      </div>

      {/* Puertos principales stat bar */}
      <div className="flex flex-wrap items-center gap-2">
        {countryCounts.slice(0, 6).map(([country, count]) => (
          <div key={country} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
            <span className="text-sm">{getCountryFlag(country)}</span>
            <span className="text-xs font-medium">{country}</span>
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
              {count}
            </Badge>
          </div>
        ))}
      </div>

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
            <MapPin className="w-4 h-4 text-teal-500" /> Puertos ({ports.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-360px)]">
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
                  {ports.map((p, idx) => (
                    <TableRow key={p.id} className={idx % 2 === 1 ? 'bg-muted/30' : ''}>
                      <TableCell className="font-medium text-sm">
                        <div className="flex items-center gap-2">
                          <Landmark className="w-3.5 h-3.5 text-muted-foreground" />
                          {p.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="mr-1.5">{getCountryFlag(p.country)}</span>{p.country}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted/70">{p.code}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.timezone ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{p.timezone}</span>
                          </div>
                        ) : (
                          <span>—</span>
                        )}
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
