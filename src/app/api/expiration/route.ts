import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    // Get expiring permits
    const expiringPermits = await db.permit.findMany({
      where: {
        expiryDate: { lte: ninetyDays, gte: now },
        status: { not: "Vencido" }
      },
      include: {
        shipment: { select: { reference: true, status: true } }
      },
      orderBy: { expiryDate: "asc" }
    });

    // Get expired permits
    const expiredPermits = await db.permit.findMany({
      where: {
        expiryDate: { lt: now },
        status: { not: "Vencido" }
      },
      include: {
        shipment: { select: { reference: true, status: true } }
      },
      orderBy: { expiryDate: "desc" }
    });

    // Get expiring crew licenses
    const expiringCrew = await db.crew.findMany({
      where: {
        licenseExpiry: { lte: ninetyDays, gte: now },
        status: { not: "Licencia Vencida" }
      },
      orderBy: { licenseExpiry: "asc" }
    });

    // Get expired crew licenses
    const expiredCrew = await db.crew.findMany({
      where: {
        licenseExpiry: { lt: now },
        status: { not: "Licencia Vencida" }
      },
      orderBy: { licenseExpiry: "desc" }
    });

    // Get expiring documents
    const expiringDocuments = await db.document.findMany({
      where: {
        expiryDate: { lte: ninetyDays, gte: now },
        status: { not: "Vencido" }
      },
      include: {
        shipment: { select: { reference: true, status: true } }
      },
      orderBy: { expiryDate: "asc" }
    });

    // Get expired documents
    const expiredDocuments = await db.document.findMany({
      where: {
        expiryDate: { lt: now },
        status: { not: "Vencido" }
      },
      include: {
        shipment: { select: { reference: true, status: true } }
      },
      orderBy: { expiryDate: "desc" }
    });

    // Items expiring within 30 days (urgent)
    const urgentPermits = expiringPermits.filter(p => p.expiryDate && new Date(p.expiryDate) <= thirtyDays);
    const urgentCrew = expiringCrew.filter(c => c.licenseExpiry && new Date(c.licenseExpiry) <= thirtyDays);
    const urgentDocuments = expiringDocuments.filter(d => d.expiryDate && new Date(d.expiryDate) <= thirtyDays);

    return NextResponse.json({
      summary: {
        totalExpiring: expiringPermits.length + expiringCrew.length + expiringDocuments.length,
        totalExpired: expiredPermits.length + expiredCrew.length + expiredDocuments.length,
        totalUrgent: urgentPermits.length + urgentCrew.length + urgentDocuments.length,
        permitsExpiring: expiringPermits.length,
        permitsExpired: expiredPermits.length,
        crewExpiring: expiringCrew.length,
        crewExpired: expiredCrew.length,
        documentsExpiring: expiringDocuments.length,
        documentsExpired: expiredDocuments.length,
      },
      expiring: {
        permits: expiringPermits,
        crew: expiringCrew,
        documents: expiringDocuments,
      },
      expired: {
        permits: expiredPermits,
        crew: expiredCrew,
        documents: expiredDocuments,
      },
      urgent: {
        permits: urgentPermits,
        crew: urgentCrew,
        documents: urgentDocuments,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
