import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const costs = await db.complianceCostItem.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }]
    });
    return NextResponse.json(costs);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cost = await db.complianceCostItem.create({ data: body });
    return NextResponse.json(cost);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
