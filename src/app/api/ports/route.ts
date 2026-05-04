import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { country: { contains: search } },
        { code: { contains: search } },
      ]
    }

    const ports = await db.port.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(ports)
  } catch (error) {
    console.error('Ports API error:', error)
    return NextResponse.json({ error: 'Failed to fetch ports' }, { status: 500 })
  }
}
