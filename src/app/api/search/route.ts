import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface SearchResult {
  id: string
  type: 'shipment' | 'permit' | 'vessel' | 'container' | 'document' | 'crew' | 'port' | 'claim'
  title: string
  subtitle: string
  icon: string
}

interface GroupedResults {
  [key: string]: {
    label: string
    tab: string
    items: SearchResult[]
  }
}

const TYPE_META: Record<string, { label: string; tab: string; icon: string }> = {
  shipment: { label: 'Envíos', tab: 'shipments', icon: 'Ship' },
  permit: { label: 'Permisos', tab: 'permits', icon: 'Shield' },
  vessel: { label: 'Embarcaciones', tab: 'vessels', icon: 'Anchor' },
  container: { label: 'Contenedores', tab: 'containers', icon: 'Container' },
  document: { label: 'Documentos', tab: 'documents', icon: 'FileText' },
  crew: { label: 'Tripulación', tab: 'crew', icon: 'Users' },
  port: { label: 'Puertos', tab: 'ports', icon: 'MapPin' },
  claim: { label: 'Reclamaciones', tab: 'claims', icon: 'AlertTriangle' },
}

const MAX_PER_GROUP = 5

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ results: {} })
    }

    const term = q.toLowerCase()
    const contains = (field: string) => Prisma.sql`LOWER(${field}) LIKE ${'%' + term + '%'}`

    const results: GroupedResults = {}

    // Shipments
    try {
      const shipments = await db.shipment.findMany({
        where: {
          OR: [
            { reference: { contains: q, mode: 'insensitive' } },
            { origin: { contains: q, mode: 'insensitive' } },
            { destination: { contains: q, mode: 'insensitive' } },
            { blNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: MAX_PER_GROUP,
        select: { id: true, reference: true, origin: true, destination: true, blNumber: true },
      })
      if (shipments.length > 0) {
        results.shipment = {
          ...TYPE_META.shipment,
          items: shipments.map((s) => ({
            id: s.id,
            type: 'shipment' as const,
            title: s.reference,
            subtitle: `${s.origin} → ${s.destination}`,
            icon: TYPE_META.shipment.icon,
          })),
        }
      }
    } catch {
      // Table may not exist yet
    }

    // Permits
    try {
      const permits = await db.permit.findMany({
        where: {
          OR: [
            { type: { contains: q, mode: 'insensitive' } },
            { number: { contains: q, mode: 'insensitive' } },
            { authority: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: MAX_PER_GROUP,
        select: { id: true, type: true, number: true, authority: true },
      })
      if (permits.length > 0) {
        results.permit = {
          ...TYPE_META.permit,
          items: permits.map((p) => ({
            id: p.id,
            type: 'permit' as const,
            title: `${p.type} - ${p.number}`,
            subtitle: p.authority,
            icon: TYPE_META.permit.icon,
          })),
        }
      }
    } catch {
      // Table may not exist yet
    }

    // Vessels
    try {
      const vessels = await db.vessel.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { imo: { contains: q, mode: 'insensitive' } },
            { owner: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: MAX_PER_GROUP,
        select: { id: true, name: true, imo: true, owner: true },
      })
      if (vessels.length > 0) {
        results.vessel = {
          ...TYPE_META.vessel,
          items: vessels.map((v) => ({
            id: v.id,
            type: 'vessel' as const,
            title: v.name,
            subtitle: `IMO: ${v.imo}${v.owner ? ` • ${v.owner}` : ''}`,
            icon: TYPE_META.vessel.icon,
          })),
        }
      }
    } catch {
      // Table may not exist yet
    }

    // Containers
    try {
      const containers = await db.container.findMany({
        where: {
          OR: [
            { number: { contains: q, mode: 'insensitive' } },
            { sealNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: MAX_PER_GROUP,
        select: { id: true, number: true, sealNumber: true, status: true },
      })
      if (containers.length > 0) {
        results.container = {
          ...TYPE_META.container,
          items: containers.map((c) => ({
            id: c.id,
            type: 'container' as const,
            title: c.number,
            subtitle: `Precinto: ${c.sealNumber || 'N/A'} • ${c.status}`,
            icon: TYPE_META.container.icon,
          })),
        }
      }
    } catch {
      // Table may not exist yet
    }

    // Documents
    try {
      const documents = await db.document.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { type: { contains: q, mode: 'insensitive' } },
            { documentNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: MAX_PER_GROUP,
        select: { id: true, name: true, type: true, documentNumber: true },
      })
      if (documents.length > 0) {
        results.document = {
          ...TYPE_META.document,
          items: documents.map((d) => ({
            id: d.id,
            type: 'document' as const,
            title: d.name,
            subtitle: `${d.type}${d.documentNumber ? ` • ${d.documentNumber}` : ''}`,
            icon: TYPE_META.document.icon,
          })),
        }
      }
    } catch {
      // Table may not exist yet
    }

    // Crew
    try {
      const crew = await db.crew.findMany({
        where: {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { licenseId: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: MAX_PER_GROUP,
        select: { id: true, fullName: true, licenseId: true, role: true },
      })
      if (crew.length > 0) {
        results.crew = {
          ...TYPE_META.crew,
          items: crew.map((c) => ({
            id: c.id,
            type: 'crew' as const,
            title: c.fullName,
            subtitle: `Licencia: ${c.licenseId} • ${c.role}`,
            icon: TYPE_META.crew.icon,
          })),
        }
      }
    } catch {
      // Table may not exist yet
    }

    // Ports
    try {
      const ports = await db.port.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
            { country: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: MAX_PER_GROUP,
        select: { id: true, name: true, code: true, country: true },
      })
      if (ports.length > 0) {
        results.port = {
          ...TYPE_META.port,
          items: ports.map((p) => ({
            id: p.id,
            type: 'port' as const,
            title: p.name,
            subtitle: `${p.code} • ${p.country}`,
            icon: TYPE_META.port.icon,
          })),
        }
      }
    } catch {
      // Table may not exist yet
    }

    // Claims
    try {
      const claims = await db.claim.findMany({
        where: {
          OR: [
            { type: { contains: q, mode: 'insensitive' } },
            { reason: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: MAX_PER_GROUP,
        select: { id: true, type: true, reason: true, status: true },
      })
      if (claims.length > 0) {
        results.claim = {
          ...TYPE_META.claim,
          items: claims.map((c) => ({
            id: c.id,
            type: 'claim' as const,
            title: c.type,
            subtitle: `${c.reason.substring(0, 60)}${c.reason.length > 60 ? '...' : ''} • ${c.status}`,
            icon: TYPE_META.claim.icon,
          })),
        }
      }
    } catch {
      // Table may not exist yet
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ results: {} }, { status: 500 })
  }
}
