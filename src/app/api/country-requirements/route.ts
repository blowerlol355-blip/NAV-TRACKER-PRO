import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const requirements = await db.countryRequirement.findMany({
      orderBy: [{ productCategory: "asc" }, { country: "asc" }]
    });
    return NextResponse.json(requirements);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const req = await db.countryRequirement.create({ data: body });
    return NextResponse.json(req);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
