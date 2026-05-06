const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)]
}

function randFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomDate(from = new Date(2020, 0, 1), to = new Date()) {
  return new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()))
}

const ORIGINS = ['Guayaquil', 'Quito', 'Buenaventura', 'Callao', 'Cartagena', 'Manzanillo']
const DESTINATIONS = ['Valencia', 'Barcelona', 'Rotterdam', 'Hamburg', 'New York', 'Miami']
const PORTS = ['GUAYAQUIL', 'VALENCIA', 'CALLAO', 'CARTAGENA', 'MANZANILLO', 'ROTTERDAM']

// Approximate lat/lon for ports used in map visualization and ETA prediction
const PORT_COORDS_GEO = {
  GUAYAQUIL: { lat: -2.170998, lon: -79.922359 },
  VALENCIA: { lat: 39.4699, lon: -0.3763 },
  CALLAO: { lat: -12.056, lon: -77.118 },
  CARTAGENA: { lat: 10.391, lon: -75.4794 },
  MANZANILLO: { lat: 19.1411, lon: -104.315 },
  ROTTERDAM: { lat: 51.947, lon: 4.142 },
}
const CARGO_TYPES = ['General', 'Refrigerated', 'Hazardous', 'Bulk', 'Liquid']
const PACKAGING = ['Caja', 'Saco', 'Tambor', 'Contenedor']
const HAZARD = ['Clase I', 'Clase II', 'Clase III', 'No peligroso']
const COUNTRIES = ['Ecuador', 'España', 'Países Bajos', 'Alemania', 'Estados Unidos', 'Colombia']
const STATUSES = ['Registrado', 'En tránsito', 'Entregado', 'Retenido']

async function clearAll() {
  console.log('Clearing existing data...')
  const models = ['claim','chainOfCustody','cargoDetail','document','container','permit','crewAssignment','crew','shipment','vessel','countryRequirement','complianceCostItem']
  for (const m of models) {
    try {
      await prisma[m].deleteMany()
    } catch (e) {
      // ignore missing models in case
    }
  }
}

async function main() {
  console.log('Starting large seed...')
  await clearAll()

  const vessels = []
  for (let i = 0; i < 6; i++) {
    const v = await prisma.vessel.create({
      data: {
        name: `MV Demo ${i + 1}`,
        imo: `IMO${randInt(1000000, 9999999)}`,
        flag: pick(COUNTRIES).toUpperCase(),
        type: pick(['Container','Bulk','Tanker','RoRo']),
        capacity: randInt(1000, 10000),
        currentLocation: pick(PORTS),
        // realistic transit speed in knots (used for ETA predictions)
        speed: randFloat(10, 20, 1),
      },
    })
    vessels.push(v)
  }

  const crews = []
  for (let i = 0; i < 20; i++) {
    const c = await prisma.crew.create({
      data: {
        fullName: `Crew Member ${i + 1}`,
        licenseId: `LIC${randInt(10000,99999)}`,
        nationality: pick(COUNTRIES),
        role: pick(['Capitán','Oficial','Marinero']),
        status: pick(['Activo','En viaje','Inactivo']),
      },
    })
    crews.push(c)
  }

  // Helper to create shipments with controlled properties
  async function createShipment(index, opts = {}) {
    const origin = opts.origin || pick(ORIGINS)
    const destination = opts.destination || pick(DESTINATIONS)
    const vessel = opts.vessel || pick(vessels)
    const weight = opts.weight ?? randFloat(100, 20000, 2)

    const base = {
      reference: opts.reference || `REF-${String(index).padStart(4, '0')}`,
      blNumber: opts.blNumber || `BL-${String(randInt(1000, 9999))}`,
      origin,
      destination,
      originPort: opts.originPort || pick(PORTS),
      destinationPort: opts.destinationPort || pick(PORTS),
      status: opts.status || pick(STATUSES),
      cargoType: opts.cargoType || pick(CARGO_TYPES),
      weight,
      containerCount: opts.containerCount ?? randInt(0, 10),
      value: opts.value ?? randFloat(1000, 100000, 2),
      eta: opts.eta ?? randomDate(new Date(), new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)),
      departureDate: opts.departureDate ?? randomDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), new Date()),
      arrivalDate: opts.arrivalDate ?? null,
      // relation to vessel will be connected when creating the shipment
      clientName: opts.clientName || `Client ${randInt(1, 50)}`,
      notes: opts.notes || `Auto-generated shipment ${index}`,
    }

    // port geo is available in PORT_COORDS_GEO for the frontend; we do not write GPS fields to the DB schema here

    const shipment = await prisma.shipment.create({ data: { ...base, vessel: { connect: { id: vessel.id } } } })

    // Documents (allow zero documents when requested)
    const docCount = opts.documentsCount !== undefined ? opts.documentsCount : randInt(0, 3)
    const docOps = []
    for (let d = 0; d < docCount; d++) {
      docOps.push(
        prisma.document.create({ data: { name: `Doc ${d + 1} for ${shipment.reference}`, type: pick(['BL', 'Invoice', 'Packing List']), shipmentId: shipment.id, isVerified: Math.random() > 0.5 } })
      )
    }

    // Containers
    const containerOps = []
    const contCount = opts.containerCountExplicit !== undefined ? opts.containerCountExplicit : randInt(1, 4)
    for (let c = 0; c < contCount; c++) {
      containerOps.push(prisma.container.create({ data: { number: `CONT-${randInt(100000, 999999)}`, type: pick(['20ft', '40ft', 'Reefer']), shipmentId: shipment.id, weight: randFloat(500, 10000, 2), status: pick(['Vacío', 'Lleno', 'En tránsito']) } }))
    }

    // Cargo details
    const cargoOps = []
    for (let cd = 0; cd < randInt(1, 3); cd++) {
      cargoOps.push(prisma.cargoDetail.create({ data: { shipmentId: shipment.id, description: `Product ${cd + 1}`, hsCode: `${randInt(100000, 999999)}`, grossWeight: randFloat(10, 5000, 2), netWeight: randFloat(5, 4000, 2), packageCount: randInt(1, 1000), packagingType: pick(PACKAGING) } }))
    }

    // Permits (rare)
    const permitOps = []
    if (Math.random() > 0.6) {
      permitOps.push(prisma.permit.create({ data: { type: pick(['Import', 'Export', 'Transit']), number: `PERM-${randInt(10000, 99999)}`, shipmentId: shipment.id, authority: 'Maritime Authority', status: pick(['Pendiente','Aprobado','Rechazado']) } }))
    }

    // Chain of custody
    const custodyOps = []
    if (Math.random() > 0.3) {
      custodyOps.push(prisma.chainOfCustody.create({ data: { shipmentId: shipment.id, stage: pick(['Productor','Exportador','Naviera','Importador']), fromParty: `Party ${randInt(1,20)}`, toParty: `Party ${randInt(21,40)}`, transferDate: new Date(), notes: 'Auto custody record' } }))
    }

    // Claims (rare)
    const claimOps = []
    if (Math.random() > 0.9) {
      claimOps.push(prisma.claim.create({ data: { shipmentId: shipment.id, type: pick(['Daño','Retraso','Documentación incompleta']), reason: 'Auto-generated claim' } }))
    }

    // Crew assignments
    const crewOps = []
    if (crews.length) {
      const crew = pick(crews)
      crewOps.push(prisma.crewAssignment.create({ data: { crewId: crew.id, shipmentId: shipment.id, role: pick(['Capitán','Oficial','Marinero']) } }))
    }

    await Promise.all([...docOps, ...containerOps, ...cargoOps, ...permitOps, ...custodyOps, ...claimOps, ...crewOps])
    return shipment
  }

  // Create forced groups to ensure coverage
  const forcedPerGroup = 20
  let idx = 1

  // 1) Delayed shipments (Con retraso) - ETA in the past
  for (let i = 0; i < forcedPerGroup; i++) {
    const eta = new Date(Date.now() - randInt(1, 10) * 24 * 60 * 60 * 1000) // 1-10 days ago
    await createShipment(idx++, { status: 'Con retraso', eta: eta.toISOString(), documentsCount: randInt(0,1) })
  }

  // 2) Delivered shipments (Entregado) - arrivalDate in past
  for (let i = 0; i < forcedPerGroup; i++) {
    const arrival = new Date(Date.now() - randInt(0, 14) * 24 * 60 * 60 * 1000) // up to 2 weeks ago
    const eta = new Date(arrival.getTime() - randInt(1, 5) * 24 * 60 * 60 * 1000)
    await createShipment(idx++, { status: 'Entregado', eta: eta.toISOString(), arrivalDate: arrival.toISOString(), documentsCount: randInt(1,3) })
  }

  // 3) In documentation / pending documents (En documentación) - no documents
  for (let i = 0; i < forcedPerGroup; i++) {
    const eta = randomDate(new Date(), new Date(Date.now() + 1000 * 60 * 60 * 24 * 30))
    await createShipment(idx++, { status: 'En documentación', eta: eta.toISOString(), documentsCount: 0 })
  }

  // 4) Shipments with explicitly missing documents (documentsCount = 0) and varied statuses
  for (let i = 0; i < forcedPerGroup; i++) {
    const status = pick(['Registrado','En tránsito','En puerto de destino','En aduana'])
    const eta = randomDate(new Date(), new Date(Date.now() + 1000 * 60 * 60 * 24 * 60))
    await createShipment(idx++, { status, eta: eta.toISOString(), documentsCount: 0 })
  }

  // 5) Remaining random shipments to reach a healthy total
  const remaining = 40
  for (let i = 0; i < remaining; i++) {
    await createShipment(idx++)
  }

  // Country requirements and compliance items
  for (let i = 0; i < 12; i++) {
    await prisma.countryRequirement.create({
      data: {
        productCategory: pick(['Alimento agrícola','Químico','Textil']),
        country: pick(COUNTRIES),
        requirementName: `Req ${i + 1}`,
      },
    })
    await prisma.complianceCostItem.create({
      data: {
        category: pick(['Certificación','Inspección','Demora']),
        name: `Cost ${i + 1}`,
        estimatedCost: randFloat(50, 2000, 2),
      },
    })
  }

  console.log('Large seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
