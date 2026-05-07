import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const cargoType = searchParams.get('cargoType') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { blNumber: { contains: search } },
        { clientName: { contains: search } },
        { origin: { contains: search } },
        { destination: { contains: search } },
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (cargoType && cargoType !== 'all') {
      where.cargoType = cargoType
    }

    const [shipments, total] = await Promise.all([
      db.shipment.findMany({
        where,
        include: {
          vessel: true,
          permits: true,
          containers: true,
          documents: true,
          crewAssignments: {
            include: {
              crew: { select: { id: true, fullName: true, role: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.shipment.count({ where }),
    ])

    return NextResponse.json({
      shipments,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('Shipments API error:', error)
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Support attachments sent inline as base64 array: { attachments: [{ filename, contentBase64, name, type, category, ... }] }
    const attachments = Array.isArray(body.attachments) ? body.attachments : []
    delete body.attachments

    // Extract crew assignments before creating shipment
    const crewAssignments: { crewId: string; role: string }[] = Array.isArray(body.crewAssignments) ? body.crewAssignments : []
    delete body.crewAssignments

    // Convert some date-like fields if provided as strings
    if (body.eta) body.eta = new Date(body.eta)
    if (body.departureDate) body.departureDate = new Date(body.departureDate)
    if (body.arrivalDate) body.arrivalDate = new Date(body.arrivalDate)

    const shipment = await db.shipment.create({ data: body })

    // Create crew assignments if provided
    if (crewAssignments.length > 0) {
      await db.crewAssignment.createMany({
        data: crewAssignments.map((a) => ({
          crewId: a.crewId,
          shipmentId: shipment.id,
          role: a.role || 'Tripulante',
        })),
        skipDuplicates: true,
      })
    }

    if (attachments.length > 0) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

      await Promise.all(
        attachments.map(async (att: any) => {
          if (!att.filename || !att.contentBase64) return
          const filename = `${Date.now()}-${att.filename}`
          const filePath = path.join(uploadsDir, filename)
          const buffer = Buffer.from(att.contentBase64, 'base64')
          await fs.promises.writeFile(filePath, buffer)

          await db.document.create({
            data: {
              name: att.name || att.filename || filename,
              type: att.type || 'file',
              shipmentId: shipment.id,
              uploadDate: new Date(),
              expiryDate: att.expiryDate ? new Date(att.expiryDate) : undefined,
              status: att.status || 'Vigente',
              fileSize: String(buffer.length),
              category: att.category || null,
              documentSubtype: att.documentSubtype || att.category || null,
              issuingAuthority: att.issuingAuthority || null,
              // persist public URL to file
              fileUrl: att.fileUrl || `/uploads/${filename}`,
              // keep documentNumber if provided for legacy data
              documentNumber: att.documentNumber || null,
            },
          })
        })
      )
    }

    const created = await db.shipment.findUnique({
      where: { id: shipment.id },
      include: {
        documents: true,
        permits: true,
        containers: true,
        vessel: true,
        crewAssignments: {
          include: {
            crew: { select: { id: true, fullName: true, role: true } },
          },
        },
      },
    })
    return NextResponse.json(created || shipment, { status: 201 })
  } catch (error) {
    console.error('Create shipment error:', error)
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 })
  }
}
