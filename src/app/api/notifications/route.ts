import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  type: 'success' | 'warning' | 'error' | 'info'
  relatedTab: string
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Ahora mismo'
  if (diffMin < 60) return `Hace ${diffMin}m`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const notifications: NotificationItem[] = []

    // 1. Permits expiring within 30 days
    const expiringPermits = await db.permit.findMany({
      where: {
        expiryDate: { gte: now, lte: thirtyDaysFromNow },
        status: { not: 'Vencido' },
      },
      include: { shipment: { select: { reference: true } } },
      orderBy: { expiryDate: 'asc' },
      take: 5,
    })

    for (const permit of expiringPermits) {
      const daysLeft = permit.expiryDate
        ? Math.ceil((new Date(permit.expiryDate).getTime() - now.getTime()) / 86400000)
        : 0
      notifications.push({
        id: `permit-expiring-${permit.id}`,
        title: `Permiso ${permit.type} por vencer`,
        description: `${permit.number} — ${daysLeft}d restantes${permit.shipment ? ` (Envío ${permit.shipment.reference})` : ''}`,
        time: getRelativeTime(permit.updatedAt),
        type: 'warning',
        relatedTab: 'permits',
      })
    }

    // 2. Expired permits
    const expiredPermits = await db.permit.findMany({
      where: {
        expiryDate: { lt: now },
        status: { not: 'Vencido' },
      },
      include: { shipment: { select: { reference: true } } },
      orderBy: { expiryDate: 'desc' },
      take: 3,
    })

    for (const permit of expiredPermits) {
      notifications.push({
        id: `permit-expired-${permit.id}`,
        title: `Permiso ${permit.type} vencido`,
        description: `${permit.number} — requiere renovación${permit.shipment ? ` (Envío ${permit.shipment.reference})` : ''}`,
        time: getRelativeTime(permit.updatedAt),
        type: 'error',
        relatedTab: 'permits',
      })
    }

    // 3. Shipments with delays
    const delayedShipments = await db.shipment.findMany({
      where: { status: 'Con retraso' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    })

    for (const shipment of delayedShipments) {
      notifications.push({
        id: `shipment-delay-${shipment.id}`,
        title: `Envío ${shipment.reference} con retraso`,
        description: `${shipment.originPort} → ${shipment.destinationPort} — requiere atención`,
        time: getRelativeTime(shipment.updatedAt),
        type: 'error',
        relatedTab: 'shipments',
      })
    }

    // 4. Documents pending verification
    const pendingDocuments = await db.document.findMany({
      where: {
        isVerified: false,
        status: 'Vigente',
      },
      include: { shipment: { select: { reference: true } } },
      orderBy: { uploadDate: 'desc' },
      take: 5,
    })

    for (const doc of pendingDocuments) {
      notifications.push({
        id: `doc-pending-${doc.id}`,
        title: `Documento pendiente de verificación`,
        description: `${doc.name}${doc.shipment ? ` (Envío ${doc.shipment.reference})` : ''}`,
        time: getRelativeTime(doc.updatedAt),
        type: 'info',
        relatedTab: 'documents',
      })
    }

    // 5. Crew with expiring licenses (within 30 days)
    const expiringCrew = await db.crew.findMany({
      where: {
        licenseExpiry: { gte: now, lte: thirtyDaysFromNow },
        status: { not: 'Licencia Vencida' },
      },
      orderBy: { licenseExpiry: 'asc' },
      take: 5,
    })

    for (const member of expiringCrew) {
      const daysLeft = member.licenseExpiry
        ? Math.ceil((new Date(member.licenseExpiry).getTime() - now.getTime()) / 86400000)
        : 0
      notifications.push({
        id: `crew-expiring-${member.id}`,
        title: `Licencia de ${member.fullName} por vencer`,
        description: `Licencia ${member.licenseId} — ${daysLeft}d restantes`,
        time: getRelativeTime(member.updatedAt),
        type: 'warning',
        relatedTab: 'crew',
      })
    }

    // 6. Crew with expired licenses
    const expiredCrew = await db.crew.findMany({
      where: {
        licenseExpiry: { lt: now },
        status: { not: 'Licencia Vencida' },
      },
      orderBy: { licenseExpiry: 'desc' },
      take: 3,
    })

    for (const member of expiredCrew) {
      notifications.push({
        id: `crew-expired-${member.id}`,
        title: `Licencia de ${member.fullName} vencida`,
        description: `Licencia ${member.licenseId} — no asignable a nuevos envíos`,
        time: getRelativeTime(member.updatedAt),
        type: 'error',
        relatedTab: 'crew',
      })
    }

    // 7. Open claims
    const openClaims = await db.claim.findMany({
      where: { status: { in: ['Abierto', 'En investigación'] } },
      include: { shipment: { select: { reference: true } } },
      orderBy: { reportedDate: 'desc' },
      take: 5,
    })

    for (const claim of openClaims) {
      notifications.push({
        id: `claim-open-${claim.id}`,
        title: `Reclamación ${claim.status.toLowerCase()}`,
        description: `${claim.type}${claim.shipment ? ` — Envío ${claim.shipment.reference}` : ''}`,
        time: getRelativeTime(new Date(claim.reportedDate)),
        type: claim.status === 'Abierto' ? 'error' : 'warning',
        relatedTab: 'claims',
      })
    }

    // 8. Shipments delivered recently (success notifications)
    const deliveredShipments = await db.shipment.findMany({
      where: { status: 'Entregado' },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    })

    for (const shipment of deliveredShipments) {
      notifications.push({
        id: `shipment-delivered-${shipment.id}`,
        title: `Envío ${shipment.reference} entregado`,
        description: `${shipment.originPort} → ${shipment.destinationPort}`,
        time: getRelativeTime(shipment.updatedAt),
        type: 'success',
        relatedTab: 'shipments',
      })
    }

    // Sort by type priority: error > warning > info > success
    const typePriority: Record<string, number> = { error: 0, warning: 1, info: 2, success: 3 }
    notifications.sort((a, b) => typePriority[a.type] - typePriority[b.type])

    return NextResponse.json({ notifications, total: notifications.length })
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ notifications: [], total: 0 }, { status: 500 })
  }
}
