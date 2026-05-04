import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const vessels = await db.vessel.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(vessels)
  } catch (error) {
    console.error('Vessels API error:', error)
    return NextResponse.json({ error: 'Failed to fetch vessels' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const vessel = await db.vessel.create({ data: body })
    return NextResponse.json(vessel, { status: 201 })
  } catch (error) {
    console.error('Create vessel error:', error)
    return NextResponse.json({ error: 'Failed to create vessel' }, { status: 500 })
  }
}
