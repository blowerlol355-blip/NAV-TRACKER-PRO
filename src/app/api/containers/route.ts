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
