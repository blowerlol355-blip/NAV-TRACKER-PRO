import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const shipment = await db.shipment.findUnique({
      where: { id },
      include: {
        vessel: true,
        permits: true,
        containers: true,
        documents: true,
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Envío no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error("Error fetching shipment:", error);
    return NextResponse.json(
      { error: "Error al obtener el envío" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingShipment = await db.shipment.findUnique({ where: { id } });

    if (!existingShipment) {
      return NextResponse.json(
        { error: "Envío no encontrado" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    const fields = [
      "reference",
      "blNumber",
      "origin",
      "destination",
      "originPort",
      "destinationPort",
      "status",
      "cargoType",
      "weight",
      "containerCount",
      "value",
      "vesselId",
      "clientId",
      "clientName",
      "notes",
      "destinationCountry",
      "regulatoryCategory",
      "incoterm",
      "packagingType",
      "hsCode",
      "productDescription",
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.eta !== undefined) {
      updateData.eta = body.eta ? new Date(body.eta) : null;
    }
    if (body.departureDate !== undefined) {
      updateData.departureDate = body.departureDate
        ? new Date(body.departureDate)
        : null;
    }
    if (body.arrivalDate !== undefined) {
      updateData.arrivalDate = body.arrivalDate
        ? new Date(body.arrivalDate)
        : null;
    }

    const shipment = await db.shipment.update({
      where: { id },
      data: updateData,
      include: {
        vessel: true,
        permits: true,
        containers: true,
        documents: true,
      },
    });

    return NextResponse.json(shipment);
  } catch (error) {
    console.error("Error updating shipment:", error);
    return NextResponse.json(
      { error: "Error al actualizar el envío" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingShipment = await db.shipment.findUnique({ where: { id } });

    if (!existingShipment) {
      return NextResponse.json(
        { error: "Envío no encontrado" },
        { status: 404 }
      );
    }

    await db.shipment.delete({ where: { id } });

    return NextResponse.json({ message: "Envío eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting shipment:", error);
    return NextResponse.json(
      { error: "Error al eliminar el envío" },
      { status: 500 }
    );
  }
}
