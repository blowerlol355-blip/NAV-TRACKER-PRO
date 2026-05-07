const { PrismaClient } = require('@prisma/client')

(async function(){
  const db = new PrismaClient()
  try{
    const crew = await db.crew.findMany({
      include: {
        assignments: {
          include: {
            shipment: {
              select: { reference: true, status: true, origin: true, destination: true }
            }
          }
        },
        documents: {
          select: { id: true, name: true, fileUrl: true, uploadDate: true, type: true, fileSize: true }
        }
      },
      orderBy: { fullName: 'asc' }
    })
    console.log('crew length', crew.length)
  }catch(e){
    console.error('DEBUG ERROR', e)
  }finally{
    await db.$disconnect()
  }
})()
