'use client'

import React, { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

type Port = { id: string; name: string; code?: string; country?: string; timezone?: string; coords?: { lat: number; lon: number } | null; meta?: any }

export default function InnerPortsMap({ ports, onSelect }: { ports: Port[], onSelect: (p: Port) => void }) {
  // Fix missing marker icons in leaflet
  if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })
  }

  const validPorts = useMemo(() => ports.filter(p => p.coords), [ports])

  const bounds = useMemo(() => {
    if (validPorts.length === 0) return [[-40, -100], [60, 40]]
    const latMin = Math.min(...validPorts.map(p => p.coords!.lat))
    const latMax = Math.max(...validPorts.map(p => p.coords!.lat))
    const lngMin = Math.min(...validPorts.map(p => p.coords!.lon))
    const lngMax = Math.max(...validPorts.map(p => p.coords!.lon))
    return [[latMin - 5, lngMin - 5], [latMax + 5, lngMax + 5]]
  }, [validPorts])

  return (
    <MapContainer 
      bounds={bounds as L.LatLngBoundsExpression} 
      className="w-full h-full rounded-md z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {validPorts.map((p) => (
        <CircleMarker 
          key={p.id}
          center={[p.coords!.lat, p.coords!.lon]}
          radius={6}
          fillColor="#ef4444"
          color="#ffffff"
          weight={2}
          fillOpacity={1}
          eventHandlers={{
            click: () => {
              onSelect(p)
              import('@/lib/store').then(mod => {
                const store = mod.useAppStore.getState()
                if (p.code) {
                  store.setSelectedPortCodeToView(p.code)
                  store.setActiveTab('ports')
                }
              })
            }
          }}
        >
          <Popup>
            <div className="text-sm font-semibold">{p.name} {p.code ? `(${p.code})` : ''}</div>
            <div className="text-xs text-muted-foreground">{p.country}</div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
