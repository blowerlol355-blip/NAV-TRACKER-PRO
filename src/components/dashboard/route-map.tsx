import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navigation } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import the leaflet map with SSR disabled to avoid "window is not defined" errors
const InnerRouteMap = dynamic(
  () => import('./inner-route-map'),
  { 
    ssr: false,
    loading: () => <Skeleton className="w-full h-full min-h-[320px] rounded-md" />
  }
)

export default function RouteMapVisualization({ shipments }: { shipments: any[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex items-center gap-2">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Navigation className="w-4 h-4 text-teal-500" />
            Mapa de Rutas Marítimas
          </CardTitle>
          <p className="text-xs text-muted-foreground">Rutas activas de envíos</p>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-4">
        <div className="relative w-full h-[320px] sm:h-[400px]">
          <InnerRouteMap shipments={shipments} />
        </div>
      </CardContent>
    </Card>
  )
}
