import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

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
    const attachments = Array.isArray(body.attachments) ? body.attachments : []
    delete body.attachments

    const vessel = await db.vessel.create({ data: body })

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
              vesselId: vessel.id,
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

    return NextResponse.json(vessel, { status: 201 })
  } catch (error) {
    console.error('Create vessel error:', error)
    return NextResponse.json({ error: 'Failed to create vessel' }, { status: 500 })
  }
}
