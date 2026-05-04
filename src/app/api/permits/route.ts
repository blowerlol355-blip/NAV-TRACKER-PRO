import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''

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

    const permits = await db.permit.findMany({
      where,
      include: { shipment: { select: { reference: true } } },
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
    const permit = await db.permit.create({ data: body })
    return NextResponse.json(permit, { status: 201 })
  } catch (error) {
    console.error('Create permit error:', error)
    return NextResponse.json({ error: 'Failed to create permit' }, { status: 500 })
  }
}
