import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const category = searchParams.get('category') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { type: { contains: search } },
        { documentNumber: { contains: search } },
        { issuingAuthority: { contains: search } },
      ]
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (category && category !== 'all') {
      where.category = category
    }

    const documents = await db.document.findMany({
      where,
      include: { shipment: { select: { reference: true } } },
      orderBy: { uploadDate: 'desc' },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Documents API error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data: Record<string, unknown> = {
      name: body.name,
      type: body.type || null,
      shipmentId: body.shipmentId || null,
      status: body.status || 'Pendiente',
      fileSize: body.fileSize ? Number(body.fileSize) : null,
      category: body.category || null,
      documentSubtype: body.documentSubtype || null,
      issuingAuthority: body.issuingAuthority || null,
      documentNumber: body.documentNumber || null,
      fileUrl: body.fileUrl || null,
    }

    if (body.uploadDate) data.uploadDate = new Date(body.uploadDate)
    if (body.expiryDate) data.expiryDate = new Date(body.expiryDate)

    const document = await db.document.create({ data })
    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Create document error:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
