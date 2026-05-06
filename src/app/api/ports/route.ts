import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { PORT_COORDS_GEO, PORT_META, getPortKey } from '@/lib/port-data'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, any> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { country: { contains: search } },
        { code: { contains: search } },
      ]
    }

    // Prefer DB ports but fallback to static mapping when DB is empty
    const portsDb = await db.port.findMany({ where, orderBy: { name: 'asc' } })
    if (portsDb && portsDb.length > 0) {
      const mapped = portsDb.map(p => {
        const key = getPortKey(p.code || p.name)
        return {
          id: p.id,
          name: p.name,
          code: p.code,
          country: p.country,
          timezone: p.timezone,
          coords: PORT_COORDS_GEO[key] || null,
          meta: PORT_META[key] || null,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }
      })
      return NextResponse.json(mapped)
    }

    const staticPorts = Object.keys(PORT_COORDS_GEO).map(k => ({ id: k, name: k, code: k, country: PORT_META[k]?.country || '', timezone: PORT_META[k]?.timezone || '', coords: PORT_COORDS_GEO[k], meta: PORT_META[k] }))
    return NextResponse.json(staticPorts)
  } catch (error) {
    console.error('Ports API error:', error)
    return NextResponse.json({ error: 'Failed to fetch ports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const attachments = Array.isArray(body.attachments) ? body.attachments : []
    delete body.attachments

    const data: Record<string, unknown> = {
      name: body.name,
      country: body.country || null,
      code: body.code || null,
      timezone: body.timezone || null,
    }
    const port = await db.port.create({ data })

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
              portId: port.id,
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

    return NextResponse.json(port, { status: 201 })
  } catch (error) {
    console.error('Create port error:', error)
    return NextResponse.json({ error: 'Failed to create port' }, { status: 500 })
  }
}
