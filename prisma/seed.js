const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Running seed...');

  const vessel = await prisma.vessel.create({
    data: {
      name: 'MV Demo Carrier',
      imo: 'IMO1234567',
      flag: 'PANAMA',
      type: 'Container',
      capacity: 5000,
    },
  });

  const shipment = await prisma.shipment.create({
    data: {
      reference: 'REF-0001',
      blNumber: 'BL-0001',
      origin: 'Guayaquil',
      destination: 'Valencia',
      originPort: 'GUAYAQUIL',
      destinationPort: 'VALENCIA',
      cargoType: 'General',
      weight: 1200.5,
      containerCount: 2,
      vesselId: vessel.id,
      clientName: 'Cliente Demo S.A.',
    },
  });

  console.log('Seed completed:', { vesselId: vessel.id, shipmentId: shipment.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
