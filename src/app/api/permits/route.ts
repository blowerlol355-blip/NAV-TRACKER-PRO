import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const authority = searchParams.get('authority') || ''
    const expiryFrom = searchParams.get('expiryFrom') || ''
    const expiryTo = searchParams.get('expiryTo') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { type: { contains: search } },
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (authority && authority !== 'all') {
      where.authority = authority
    }

    // Expiry date range filter
    const expiryConditions: Record<string, unknown>[] = []
    if (expiryFrom) {
      expiryConditions.push({ expiryDate: { gte: new Date(expiryFrom) } })
    }
    if (expiryTo) {
      expiryConditions.push({ expiryDate: { lte: new Date(expiryTo) } })
    }
    if (expiryConditions.length > 0) {
      where.AND = [...expiryConditions]
    }

    const permits = await db.permit.findMany({
      where,
      include: {
        shipment: {
          select: {
            reference: true,
            origin: true,
            destination: true,
            status: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(permits)
  } catch (error) {
    console.error('Permits API error:', error)
    return NextResponse.json({ error: 'Failed to fetch permits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.shipmentId) {
      return NextResponse.json({ error: 'shipmentId is required' }, { status: 400 })
    }

    const data: Record<string, unknown> = {
      type: body.type,
      number: body.number,
      shipmentId: body.shipmentId,
      authority: body.authority || null,
      notes: body.notes || null,
      status: body.status || 'Pendiente',
    }

    if (body.issueDate) {
      data.issueDate = new Date(body.issueDate)
    }
    if (body.expiryDate) {
      data.expiryDate = new Date(body.expiryDate)
    }

    const permit = await db.permit.create({ data })
    return NextResponse.json(permit, { status: 201 })
  } catch (error) {
    console.error('Create permit error:', error)
    return NextResponse.json({ error: 'Failed to create permit' }, { status: 500 })
  }
}
