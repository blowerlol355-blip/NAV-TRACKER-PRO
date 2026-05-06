import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { filename, contentBase64 } = body
    if (!filename || !contentBase64) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    const filePath = path.join(uploadsDir, filename)
    const buffer = Buffer.from(contentBase64, 'base64')
    await fs.promises.writeFile(filePath, buffer)

    // Return public URL
    const url = `/uploads/${filename}`
    return NextResponse.json({ url, size: buffer.length })
  } catch (error) {
    console.error('Upload error', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
