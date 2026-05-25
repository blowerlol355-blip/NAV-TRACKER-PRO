import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]

    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json({ error: 'Mensaje inválido' }, { status: 400 })
    }

    const query = lastMessage.content.toLowerCase()

    // --------------------------------------------------------------------------
    // BASE PARA OPCIÓN B (LLM INTEGRATION)
    // --------------------------------------------------------------------------
    // const { text } = await generateText({
    //   model: openai('gpt-4o'),
    //   messages,
    //   tools: { searchDatabase: tool({...}) }
    // });
    // return NextResponse.json({ response: text })
    // --------------------------------------------------------------------------

    // OPCIÓN A: Motor heurístico interno basado en palabras clave
    let responseText = "No logré encontrar información específica sobre eso. Intenta buscar usando términos como 'embarque', 'contenedor', 'permiso' o 'tripulación' seguido de un número o nombre."

    if (query.includes('hola') || query.includes('saludos')) {
      responseText = "¡Hola! Soy NavBot. Puedo ayudarte a buscar información en tu base de datos sobre embarques, permisos, contenedores y más. ¿Qué necesitas buscar?"
      return NextResponse.json({ response: responseText })
    }

    // Extraer palabras clave largas para la búsqueda
    const keywords = query.split(' ').filter((w: string) => w.length > 2)
    const searchTerms = keywords.join(' ')

    if (searchTerms.length > 2) {
      let foundSomething = false
      let resultsText = "Aquí tienes lo que encontré:\n\n"

      // 1. Buscar en Shipments
      if (query.includes('embarque') || query.includes('envío') || query.includes('shipment') || keywords.length > 0) {
        const shipments = await db.shipment.findMany({
          where: { OR: keywords.map((k: string) => ({ reference: { contains: k, mode: 'insensitive' } })) },
          take: 2,
        })
        if (shipments.length > 0) {
          foundSomething = true
          resultsText += `📦 **Embarques:**\n`
          shipments.forEach((s: any) => {
            resultsText += `- [${s.reference}] ${s.origin} → ${s.destination} (BL: ${s.blNumber})\n`
          })
        }
      }

      // 2. Buscar en Contenedores
      if (query.includes('contenedor') || query.includes('container') || keywords.length > 0) {
        const containers = await db.container.findMany({
          where: { OR: keywords.map((k: string) => ({ number: { contains: k, mode: 'insensitive' } })) },
          take: 2,
        })
        if (containers.length > 0) {
          foundSomething = true
          resultsText += `\n🚢 **Contenedores:**\n`
          containers.forEach((c: any) => {
            resultsText += `- [${c.number}] Estado: ${c.status} (Precinto: ${c.sealNumber || 'N/A'})\n`
          })
        }
      }

      // 3. Buscar en Permisos
      if (query.includes('permiso') || query.includes('permit') || keywords.length > 0) {
        const permits = await db.permit.findMany({
          where: { OR: keywords.map((k: string) => ({ number: { contains: k, mode: 'insensitive' } })) },
          take: 2,
        })
        if (permits.length > 0) {
          foundSomething = true
          resultsText += `\n📄 **Permisos:**\n`
          permits.forEach((p: any) => {
            resultsText += `- [${p.number}] ${p.type} (${p.authority})\n`
          })
        }
      }

      if (foundSomething) {
        responseText = resultsText
      }
    }

    return NextResponse.json({ response: responseText })

  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar tu mensaje.' },
      { status: 500 }
    )
  }
}
