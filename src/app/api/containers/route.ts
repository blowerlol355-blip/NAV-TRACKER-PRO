import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

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
    return NextResponse.json(container, { status: 201 })
  } catch (error) {
    console.error('Create container error:', error)
    return NextResponse.json({ error: 'Failed to create container' }, { status: 500 })
  }
}
