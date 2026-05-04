import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const claims = await db.claim.findMany({
      include: {
        shipment: {
          select: { reference: true, status: true, origin: true, destination: true, cargoType: true, value: true }
        }
      },
      orderBy: { reportedDate: "desc" }
    });
    return NextResponse.json(claims);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const claim = await db.claim.create({ data: body });
    return NextResponse.json(claim);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
