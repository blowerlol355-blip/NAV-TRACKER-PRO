import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const body = await request.json()
    
    // Solo actualizamos los campos permitidos
    const data: Record<string, any> = {}
    
    if (body.number !== undefined) data.number = body.number
    if (body.type !== undefined) data.type = body.type
    if (body.sealNumber !== undefined) data.sealNumber = body.sealNumber || null
    if (body.weight !== undefined) data.weight = typeof body.weight === 'string' ? parseFloat(body.weight) : body.weight
    if (body.status !== undefined) data.status = body.status
    if (body.shipmentId !== undefined) data.shipmentId = body.shipmentId

    const updatedContainer = await db.container.update({
      where: { id },
      data,
      include: { shipment: { select: { reference: true } } }
    })

    return NextResponse.json(updatedContainer)
  } catch (error) {
    console.error('Update container error:', error)
    return NextResponse.json({ error: 'Failed to update container' }, { status: 500 })
  }
}
