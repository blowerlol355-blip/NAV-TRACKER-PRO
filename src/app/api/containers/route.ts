import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { sealNumber: { contains: search } },
      ]
    }

    if (type && type !== 'all') {
      where.type = type
    }

    const containers = await db.container.findMany({
      where,
      include: { shipment: { select: { reference: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(containers)
  } catch (error) {
    console.error('Containers API error:', error)
    return NextResponse.json({ error: 'Failed to fetch containers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const attachments = Array.isArray(body.attachments) ? body.attachments : []
    delete body.attachments

    if (!body.number || !body.type || !body.shipmentId || body.weight === undefined) {
      return NextResponse.json({ error: 'number, type, shipmentId and weight are required' }, { status: 400 })
    }

    const data: Record<string, unknown> = {
      number: body.number,
      type: body.type,
      shipmentId: body.shipmentId,
      weight: typeof body.weight === 'string' ? parseFloat(body.weight) : body.weight,
      status: body.status || 'Vacío',
      sealNumber: body.sealNumber || null,
      dimensions: body.dimensions || null,
    }

    const container = await db.container.create({ data })

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
              containerId: container.id,
              uploadDate: new Date(),
              expiryDate: att.expiryDate ? new Date(att.expiryDate) : undefined,
              status: att.status || 'Vigente',
              fileSize: String(buffer.length),
              category: att.category || null,
              documentSubtype: att.documentSubtype || null,
              issuingAuthority: att.issuingAuthority || null,
              fileUrl: att.fileUrl || `/uploads/${filename}`,
              documentNumber: att.documentNumber || null,
            },
          })
        })
      )
    }

    return NextResponse.json(container, { status: 201 })
  } catch (error) {
    console.error('Create container error:', error)
    return NextResponse.json({ error: 'Failed to create container' }, { status: 500 })
  }
}
