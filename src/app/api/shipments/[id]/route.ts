import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

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
        crewAssignments: {
          include: {
            crew: { select: { id: true, fullName: true, role: true } },
          },
        },
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

    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    delete body.attachments;

    // Extract crew assignments from body
    const crewAssignments = Array.isArray(body.crewAssignments) ? body.crewAssignments : undefined;
    delete body.crewAssignments;

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

    if (Object.keys(updateData).length > 0) {
      await db.shipment.update({
        where: { id },
        data: updateData,
      });
    }

    // Sync crew assignments if provided
    if (crewAssignments !== undefined) {
      // Delete all existing assignments for this shipment
      await db.crewAssignment.deleteMany({ where: { shipmentId: id } });
      // Re-create with the new list
      if (crewAssignments.length > 0) {
        await db.crewAssignment.createMany({
          data: crewAssignments.map((a: { crewId: string; role: string }) => ({
            crewId: a.crewId,
            shipmentId: id,
            role: a.role || 'Tripulante',
          })),
          skipDuplicates: true,
        });
      }
    }

    if (attachments.length > 0) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      await Promise.all(
        attachments.map(async (att: Record<string, unknown>) => {
          if (!att.filename || !att.contentBase64) return;
          const filename = `${Date.now()}-${att.filename}`;
          const filePath = path.join(uploadsDir, filename);
          const buffer = Buffer.from(att.contentBase64 as string, "base64");
          await fs.promises.writeFile(filePath, buffer);

          await db.document.create({
            data: {
              name: (att.name as string) || (att.filename as string) || filename,
              type: (att.type as string) || "file",
              shipmentId: id,
              uploadDate: new Date(),
              expiryDate: att.expiryDate ? new Date(att.expiryDate as string) : undefined,
              status: (att.status as string) || "Vigente",
              fileSize: String(buffer.length),
              category: (att.category as string) || null,
              documentSubtype:
                (att.documentSubtype as string) || (att.category as string) || null,
              issuingAuthority: (att.issuingAuthority as string) || null,
              fileUrl: (att.fileUrl as string) || `/uploads/${filename}`,
              documentNumber: (att.documentNumber as string) || null,
            },
          });
        })
      );
    }

    const shipment = await db.shipment.findUnique({
      where: { id },
      include: {
        vessel: true,
        permits: true,
        containers: true,
        documents: true,
        crewAssignments: {
          include: {
            crew: { select: { id: true, fullName: true, role: true } },
          },
        },
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
