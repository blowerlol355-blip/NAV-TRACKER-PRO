"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

type Port = { id: string; name: string; code?: string; country?: string; timezone?: string; coords?: { lat: number; lon: number } | null; meta?: any }

function projectEquirectangular(lat: number, lon: number, width: number, height: number) {
  const x = ((lon + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return { x, y }
}

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
            <svg viewBox="0 0 1000 500" className="w-full h-full bg-slate-50 rounded-md">
              <rect width="1000" height="500" fill="url(#bg)" />
              <defs>
                <linearGradient id="bg" x1="0" x2="1">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
              </defs>
              {ports.map((p) => {
                if (!p.coords) return null
                const { x, y } = projectEquirectangular(p.coords.lat, p.coords.lon, 1000, 500)
                return (
                  <g key={p.id} transform={`translate(${x}, ${y})`} style={{ cursor: 'pointer' }} onClick={() => setSelected(p)}>
                    <circle r={6} fill="#ef4444" stroke="#fff" strokeWidth={1.5} />
                    <text x={10} y={4} fontSize={12} fill="#0f172a">{p.code || p.name}</text>
                  </g>
                )
              })}
            </svg>
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
