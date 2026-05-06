import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

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
        include: { vessel: true, permits: true, containers: true, documents: true },
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
    const shipment = await db.shipment.create({ data: body })
    return NextResponse.json(shipment, { status: 201 })
  } catch (error) {
    console.error('Create shipment error:', error)
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 })
  }
}
