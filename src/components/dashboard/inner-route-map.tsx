'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix missing marker icons in leaflet
if (typeof L !== 'undefined' && L.Icon && L.Icon.Default) {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

const shipIcon = new L.DivIcon({
  html: '<div style="font-size: 20px; text-shadow: 0 0 4px rgba(255,255,255,0.8); line-height: 1; margin-left: -10px; margin-top: -10px;">🚢</div>',
  className: 'ship-icon',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const portIcon = new L.DivIcon({
  html: '<div style="width: 12px; height: 12px; background-color: #ef4444; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>',
  className: 'port-icon',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

const PORT_COORDS: Record<string, { lat: number; lng: number; label: string }> = {
  'VELGU': { lat: 10.603, lng: -66.932, label: 'La Guaira' },
  'USMIA': { lat: 25.776, lng: -80.177, label: 'Miami' },
  'NLRDM': { lat: 51.949, lng: 4.145, label: 'Rotterdam' },
  'CNSHA': { lat: 31.222, lng: 121.458, label: 'Shanghái' },
  'PAPTY': { lat: 8.950, lng: -79.533, label: 'Panamá' },
  'DEHAM': { lat: 53.548, lng: 9.987, label: 'Hamburgo' },
  'ESBCN': { lat: 41.340, lng: 2.164, label: 'Barcelona' },
  'COCTG': { lat: 10.391, lng: -75.479, label: 'Cartagena' },
  'BRSSZ': { lat: -23.961, lng: -46.305, label: 'Santos' },
  'JPYOK': { lat: 35.443, lng: 139.638, label: 'Yokohama' },
  'GUAYAQUIL': { lat: -2.203, lng: -79.916, label: 'Guayaquil' },
  'VALENCIA': { lat: 39.469, lng: -0.377, label: 'Valencia' },
  'CALLAO': { lat: -12.062, lng: -77.143, label: 'Callao' },
  'CARTAGENA': { lat: 10.391, lng: -75.479, label: 'Cartagena' },
  'MANZANILLO': { lat: 19.070, lng: -104.298, label: 'Manzanillo' },
  'ROTTERDAM': { lat: 51.949, lng: 4.145, label: 'Rotterdam' },
}

const ROUTE_STATUS_COLORS: Record<string, string> = {
  'En tránsito': '#14b8a6', // teal-500
  'Con retraso': '#ef4444', // red-500
  'Entregado': '#22c55e', // emerald-500
}

const DEFAULT_ROUTE_COLOR = '#f59e0b'

export default function InnerRouteMap({ shipments }: { shipments: any[] }) {
  const router = useRouter()

  const uniqueRoutes = useMemo(() => {
    const seen = new Set<string>()
    return (shipments || []).filter((s: any) => {
      const key = `${s.originPort}-${s.destinationPort}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [shipments])

  // Get active bounds based on routes
  const bounds = useMemo(() => {
    const points: [number, number][] = []
    uniqueRoutes.forEach((s: any) => {
      const origin = PORT_COORDS[s.originPort]
      const dest = PORT_COORDS[s.destinationPort]
      if (origin) points.push([origin.lat, origin.lng])
      if (dest) points.push([dest.lat, dest.lng])
    })
    
    if (points.length === 0) return [[10, -80], [50, 10]] // default bounds (Americas to Europe)
    
    const latMin = Math.min(...points.map(p => p[0]))
    const latMax = Math.max(...points.map(p => p[0]))
    const lngMin = Math.min(...points.map(p => p[1]))
    const lngMax = Math.max(...points.map(p => p[1]))
    return [[latMin - 5, lngMin - 5], [latMax + 5, lngMax + 5]]
  }, [uniqueRoutes])

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

      {uniqueRoutes.map((shipment: any) => {
        const origin = PORT_COORDS[shipment.originPort]
        const dest = PORT_COORDS[shipment.destinationPort]
        if (!origin || !dest) return null

        const routeKey = `${shipment.originPort}-${shipment.destinationPort}`
        const routeColor = ROUTE_STATUS_COLORS[shipment.status] || DEFAULT_ROUTE_COLOR
        
        const now = Date.now()
        const depMs = shipment.departureDate ? new Date(shipment.departureDate).getTime() : null
        const etaMs = shipment.eta ? new Date(shipment.eta).getTime() : null
        
        let progress = 0.5
        if (depMs && etaMs && etaMs > depMs) {
          progress = Math.min(1, Math.max(0, (now - depMs) / (etaMs - depMs)))
        }

        // Simplistic interpolation for current ship location
        const shipLat = origin.lat + (dest.lat - origin.lat) * progress
        const shipLng = origin.lng + (dest.lng - origin.lng) * progress

        return (
          <React.Fragment key={routeKey}>
            <Polyline 
              positions={[[origin.lat, origin.lng], [dest.lat, dest.lng]]}
              color={routeColor}
              weight={2}
              dashArray="5, 10"
              opacity={0.7}
            />
            
            <Marker 
              position={[origin.lat, origin.lng]} 
              icon={portIcon}
              eventHandlers={{
                click: () => {
                  import('@/lib/store').then(mod => {
                    const store = mod.useAppStore.getState()
                    store.setSelectedPortCodeToView(shipment.originPort)
                    store.setActiveTab('ports')
                  })
                }
              }}
            >
              <Popup>{origin.label}</Popup>
            </Marker>
            
            <Marker 
              position={[dest.lat, dest.lng]} 
              icon={portIcon}
              eventHandlers={{
                click: () => {
                  import('@/lib/store').then(mod => {
                    const store = mod.useAppStore.getState()
                    store.setSelectedPortCodeToView(shipment.destinationPort)
                    store.setActiveTab('ports')
                  })
                }
              }}
            >
              <Popup>{dest.label}</Popup>
            </Marker>

            <Marker position={[shipLat, shipLng]} icon={shipIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>{shipment.reference}</strong><br/>
                  <span>Ruta: {shipment.originPort} → {shipment.destinationPort}</span><br/>
                  <span className="text-muted-foreground">{shipment.status}</span>
                  {shipment.vesselId && (
                    <div className="mt-2">
                      <button 
                        onClick={(e) => { e.preventDefault(); router.push(`/vessels/${shipment.vesselId}`) }}
                        className="text-teal-600 hover:underline cursor-pointer text-xs"
                      >
                        Ver embarcación
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        )
      })}
    </MapContainer>
  )
}
