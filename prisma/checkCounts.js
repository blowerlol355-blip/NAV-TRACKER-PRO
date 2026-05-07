const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const crewCount = await prisma.crew.count()
    const shipmentCount = await prisma.shipment.count()
    const vesselCount = await prisma.vessel.count()
    console.log('crew count:', crewCount)
    console.log('shipment count:', shipmentCount)
    console.log('vessel count:', vesselCount)
  } catch (e) {
    console.error('Error checking counts:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
