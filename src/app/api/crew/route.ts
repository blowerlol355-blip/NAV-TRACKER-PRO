import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const crew = await db.crew.findMany({
      include: {
        assignments: {
          include: {
            shipment: {
              select: { reference: true, status: true, origin: true, destination: true }
            }
          }
        }
      },
      orderBy: { fullName: "asc" }
    });
    return NextResponse.json(crew);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const crew = await db.crew.create({ data: body });
    return NextResponse.json(crew);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
