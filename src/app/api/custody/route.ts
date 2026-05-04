import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const custody = await db.chainOfCustody.findMany({
      include: {
        shipment: {
          select: { reference: true, status: true, origin: true, destination: true, cargoType: true }
        }
      },
      orderBy: { transferDate: "desc" }
    });
    return NextResponse.json(custody);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const custody = await db.chainOfCustody.create({ data: body });
    return NextResponse.json(custody);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
