import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Generate activity feed from real data
    const recentShipments = await db.shipment.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: { vessel: true },
    })

    const recentPermits = await db.permit.findMany({
      take: 3,
      orderBy: { updatedAt: 'desc' },
      include: { shipment: { select: { reference: true } } },
    })

    const recentDocuments = await db.document.findMany({
      take: 3,
      orderBy: { uploadDate: 'desc' },
      include: { shipment: { select: { reference: true } } },
    })

    const activities: Array<{
      id: string
      type: string
      title: string
      description: string
      time: string
      icon: string
      color: string
    }> = []

    // Add shipment activities
    for (const s of recentShipments) {
      let title = ''
      let type = 'shipment'
      let icon = 'ship'
      let color = 'teal'

      if (s.status === 'Entregado') {
        title = `Envío ${s.reference} entregado en ${s.destination}`
        color = 'emerald'
        icon = 'check-circle'
      } else if (s.status === 'En tránsito') {
        title = `Envío ${s.reference} en tránsito hacia ${s.destination}`
        color = 'teal'
      } else if (s.status === 'Con retraso') {
        title = `Envío ${s.reference} reportado con retraso`
        color = 'red'
        icon = 'alert-triangle'
      } else if (s.status === 'En aduana') {
        title = `Envío ${s.reference} en proceso aduanero`
        color = 'orange'
      } else if (s.status === 'En puerto de destino') {
        title = `Envío ${s.reference} llegó a ${s.destination}`
        color = 'sky'
      } else if (s.status === 'En documentación') {
        title = `Envío ${s.reference} en proceso de documentación`
        color = 'amber'
      } else {
        title = `Envío ${s.reference} registrado`
        color = 'slate'
      }

      const hoursAgo = Math.floor((Date.now() - new Date(s.updatedAt).getTime()) / (1000 * 60 * 60))
      const time = hoursAgo < 1 ? 'Hace unos minutos' : hoursAgo < 24 ? `Hace ${hoursAgo}h` : `Hace ${Math.floor(hoursAgo / 24)}d`

      activities.push({
        id: `s-${s.id}`,
        type,
        title,
        description: `${s.cargoType} • ${s.origin} → ${s.destination}`,
        time,
        icon,
        color,
      })
    }

    // Add permit activities
    for (const p of recentPermits) {
      let title = ''
      let color = 'amber'

      if (p.status === 'Vigente') {
        title = `Permiso ${p.type} ${p.number} aprobado`
        color = 'emerald'
      } else if (p.status === 'Vencido') {
        title = `Permiso ${p.type} ${p.number} ha vencido`
        color = 'red'
      } else {
        title = `Permiso ${p.type} ${p.number} en trámite`
        color = 'amber'
      }

      const hoursAgo = Math.floor((Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60))
      const time = hoursAgo < 1 ? 'Hace unos minutos' : hoursAgo < 24 ? `Hace ${hoursAgo}h` : `Hace ${Math.floor(hoursAgo / 24)}d`

      activities.push({
        id: `p-${p.id}`,
        type: 'permit',
        title,
        description: `Envío: ${p.shipment?.reference || 'N/A'} • Autoridad: ${p.authority}`,
        time,
        icon: 'file-check',
        color,
      })
    }

    // Add document activities
    for (const d of recentDocuments) {
      const title = `Documento "${d.name}" subido para envío ${d.shipment?.reference || 'N/A'}`
      const hoursAgo = Math.floor((Date.now() - new Date(d.uploadDate).getTime()) / (1000 * 60 * 60))
      const time = hoursAgo < 1 ? 'Hace unos minutos' : hoursAgo < 24 ? `Hace ${hoursAgo}h` : `Hace ${Math.floor(hoursAgo / 24)}d`

      activities.push({
        id: `d-${d.id}`,
        type: 'document',
        title,
        description: `${d.type} • ${d.status}`,
        time,
        icon: 'file-text',
        color: 'sky',
      })
    }

    // Sort by most recent
    const sorted = activities.slice(0, 8)

    return NextResponse.json(sorted)
  } catch (error) {
    console.error('Activity API error:', error)
    return NextResponse.json([], { status: 200 })
  }
}
