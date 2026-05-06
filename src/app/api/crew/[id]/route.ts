import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const attachments = Array.isArray(body.attachments) ? body.attachments : []
    delete body.attachments

    const updatable: Record<string, any> = {}
    const allowed = ['fullName','licenseId','nationality','role','carrierCompany','email','phone','emergencyContact','licenseExpiry','status','certifications']
    for (const k of allowed) if (body[k] !== undefined) updatable[k] = body[k]

    let updated = null
    if (Object.keys(updatable).length > 0) {
      updated = await db.crew.update({ where: { id }, data: updatable })
    }

    if (attachments.length > 0) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

      await Promise.all(attachments.map(async (att: any) => {
        if (!att.filename || !att.contentBase64) return
        const filename = `${Date.now()}-${att.filename}`
        const filePath = path.join(uploadsDir, filename)
        const buffer = Buffer.from(att.contentBase64, 'base64')
        await fs.promises.writeFile(filePath, buffer)

        await db.document.create({ data: {
          name: att.name || att.filename || filename,
          type: att.type || 'file',
          crewId: id,
          uploadDate: new Date(),
          expiryDate: att.expiryDate ? new Date(att.expiryDate) : undefined,
          status: att.status || 'Vigente',
          fileSize: String(buffer.length),
          category: att.category || null,
          documentSubtype: att.documentSubtype || null,
          issuingAuthority: att.issuingAuthority || null,
          fileUrl: att.fileUrl || `/uploads/${filename}`,
          documentNumber: att.documentNumber || null,
        } })
      }))
    }

    // return fresh crew
    const crew = await db.crew.findUnique({ where: { id }, include: { assignments: { include: { shipment: { select: { reference: true, status: true, origin: true, destination: true } } } }, documents: { select: { id: true, name: true, fileUrl: true, uploadDate: true, type: true, fileSize: true } } } })
    return NextResponse.json(crew)
  } catch (error) {
    console.error('Update crew error', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    await db.crew.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete crew error', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
