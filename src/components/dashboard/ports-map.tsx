"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

type Port = { id: string; name: string; code?: string; country?: string; timezone?: string; coords?: { lat: number; lon: number } | null; meta?: any }

// Dynamically import the leaflet map with SSR disabled
const InnerPortsMap = dynamic(
  () => import('./inner-ports-map'),
  { 
    ssr: false,
    loading: () => <Skeleton className="w-full h-full min-h-[320px] rounded-md" />
  }
)

export default function PortsMap() {
  const [ports, setPorts] = useState<Port[]>([])
  const [selected, setSelected] = useState<Port | null>(null)

  useEffect(() => {
    fetch('/api/ports').then(r => r.json()).then(setPorts).catch(console.error)
  }, [])

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-500" /> Puertos y Destinos</CardTitle>
        <p className="text-xs text-muted-foreground">Selecciona un puerto para ver detalles</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative" style={{ minHeight: 320 }}>
            <InnerPortsMap ports={ports} onSelect={setSelected} />
          </div>

          <div className="w-full sm:w-80">
            <div className="space-y-2">
              <div className="h-12 flex items-center justify-between">
                <strong className="text-sm">Puertos ({ports.length})</strong>
              </div>
              <div className="space-y-2 max-h-[360px] overflow-auto">
                {ports.map(p => (
                  <div key={p.id} className="p-2 rounded hover:bg-muted cursor-pointer flex items-center justify-between" onClick={() => setSelected(p)}>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.country} {p.code ? `• ${p.code}` : ''}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{p.coords ? `${p.coords.lat.toFixed(2)}, ${p.coords.lon.toFixed(2)}` : '—'}</div>
                  </div>
                ))}
              </div>
              {selected && (
                <div className="mt-3 p-3 border rounded">
                  <h4 className="font-semibold">{selected.name} {selected.code ? `(${selected.code})` : ''}</h4>
                  <p className="text-xs text-muted-foreground">{selected.country} • {selected.timezone}</p>
                  {selected.meta && (
                    <ul className="text-sm mt-2 space-y-1">
                      <li><strong>Max Draft:</strong> {selected.meta.maxDraft}</li>
                      <li><strong>Berths:</strong> {selected.meta.berths}</li>
                      <li><strong>Facilities:</strong> {selected.meta.facilities?.join(', ')}</li>
                      {selected.meta.website && <li><a href={selected.meta.website} target="_blank" className="text-teal-600">Sitio web</a></li>}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
