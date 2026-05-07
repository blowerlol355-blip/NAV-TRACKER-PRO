import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15+ handles params as a promise
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    console.log(`Updating claim ${id}:`, body);

    // If status is being changed to Resolved or Closed, we might want to set the resolvedDate
    if ((body.status === 'Resuelto' || body.status === 'Cerrado') && !body.resolvedDate) {
      body.resolvedDate = new Date().toISOString();
    }

    const claim = await db.claim.update({
      where: { id },
      data: {
        status: body.status,
        resolution: body.resolution,
        lessonsLearned: body.lessonsLearned,
        notes: body.notes,
        incidentCost: body.incidentCost,
        resolvedDate: body.resolvedDate,
      },
    });

    return NextResponse.json(claim);
  } catch (error) {
    console.error('Error updating claim:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    await db.claim.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
