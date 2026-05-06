require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')

async function main() {
  const db = new PrismaClient()
  try {
    const rows = await db.shipment.findMany({ include: { vessel: true } })
    console.log(JSON.stringify(rows, null, 2))
  } catch (e) {
    console.error('Error querying shipments:', e)
  } finally {
    await db.$disconnect()
  }
}

main()
