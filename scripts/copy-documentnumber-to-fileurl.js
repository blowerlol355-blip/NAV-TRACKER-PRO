const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Searching for documents with documentNumber and missing fileUrl...')
  const docs = await prisma.document.findMany({ where: { AND: [{ documentNumber: { not: null } }, { fileUrl: null }] } })
  console.log(`Found ${docs.length} documents to migrate.`)
  for (const d of docs) {
    const newUrl = d.documentNumber
    await prisma.document.update({ where: { id: d.id }, data: { fileUrl: newUrl } })
    console.log(`Updated ${d.id} -> ${newUrl}`)
  }
  console.log('Migration complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
