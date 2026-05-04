import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Delete existing data in the correct order (respecting foreign keys)
    await db.document.deleteMany();
    await db.container.deleteMany();
    await db.permit.deleteMany();
    await db.shipment.deleteMany();
    await db.vessel.deleteMany();
    await db.port.deleteMany();

    // ==================== CREATE PORTS ====================
    const ports = await Promise.all([
      db.port.create({
        data: {
          name: "Puerto de La Guaira",
          country: "Venezuela",
          code: "VELGU",
          timezone: "America/Caracas",
        },
      }),
      db.port.create({
        data: {
          name: "Puerto de Puerto Cabello",
          country: "Venezuela",
          code: "VEPBL",
          timezone: "America/Caracas",
        },
      }),
      db.port.create({
        data: {
          name: "Puerto de Maracaibo",
          country: "Venezuela",
          code: "VEMAR",
          timezone: "America/Caracas",
        },
      }),
      db.port.create({
        data: {
          name: "Puerto de Cartagena",
          country: "Colombia",
          code: "COCTG",
          timezone: "America/Bogota",
        },
      }),
      db.port.create({
        data: {
          name: "Puerto de Panamá",
          country: "Panamá",
          code: "PAPAN",
          timezone: "America/Panama",
        },
      }),
      db.port.create({
        data: {
          name: "Puerto de Miami",
          country: "EE.UU.",
          code: "USMIA",
          timezone: "America/New_York",
        },
      }),
      db.port.create({
        data: {
          name: "Puerto de Rotterdam",
          country: "Países Bajos",
          code: "NLRTM",
          timezone: "Europe/Amsterdam",
        },
      }),
      db.port.create({
        data: {
          name: "Puerto de Shanghái",
          country: "China",
          code: "CNSHA",
          timezone: "Asia/Shanghai",
        },
      }),
      db.port.create({
        data: {
          name: "Puerto de Santos",
          country: "Brasil",
          code: "BRSSZ",
          timezone: "America/Sao_Paulo",
        },
      }),
      db.port.create({
        data: {
          name: "Puerto de Valparaíso",
          country: "Chile",
          code: "CLVAP",
          timezone: "America/Santiago",
        },
      }),
    ]);

    // ==================== CREATE VESSELS ====================
    const vessels = await Promise.all([
      db.vessel.create({
        data: {
          name: "MV Caribbean Star",
          imo: "9123456",
          flag: "Panamá",
          type: "Portacontenedores",
          capacity: 8500,
          currentLocation: "Caribe, 12°30'N 71°W",
          status: "En tránsito",
          speed: 18.5,
          built: 2018,
          owner: "Naviera Caribe S.A.",
        },
      }),
      db.vessel.create({
        data: {
          name: "MV Atlántico Express",
          imo: "9234567",
          flag: "Liberia",
          type: "Granelero",
          capacity: 52000,
          currentLocation: "Puerto de Puerto Cabello",
          status: "En puerto",
          speed: 14.2,
          built: 2015,
          owner: "Express Maritime Ltd.",
        },
      }),
      db.vessel.create({
        data: {
          name: "MV Pacífico Voyager",
          imo: "9345678",
          flag: "Islas Marshall",
          type: "Portacontenedores",
          capacity: 12000,
          currentLocation: "Pacífico, 5°S 85°W",
          status: "En tránsito",
          speed: 22.0,
          built: 2020,
          owner: "Pacific Shipping Corp.",
        },
      }),
      db.vessel.create({
        data: {
          name: "MV Sur del Mar",
          imo: "9456789",
          flag: "Malta",
          type: "Tanque",
          capacity: 75000,
          currentLocation: "Astillero de Singapur",
          status: "En reparación",
          speed: 16.0,
          built: 2012,
          owner: "Petromar Inc.",
        },
      }),
      db.vessel.create({
        data: {
          name: "MV Norte Light",
          imo: "9567890",
          flag: "Bahamas",
          type: "Carga General",
          capacity: 15000,
          currentLocation: "Atlántico Norte, 35°N 45°W",
          status: "En tránsito",
          speed: 17.5,
          built: 2016,
          owner: "Nordic Cargo AS",
        },
      }),
    ]);

    // ==================== CREATE SHIPMENTS ====================
    const shipments = await Promise.all([
      // 1 - En tránsito, with vessel
      db.shipment.create({
        data: {
          reference: "ENV-2025-001",
          blNumber: "BL-CRS-2025-45892",
          origin: "Puerto de La Guaira",
          destination: "Puerto de Rotterdam",
          originPort: "VELGU",
          destinationPort: "NLRTM",
          status: "En tránsito",
          cargoType: "Contenedorizado",
          weight: 2850.5,
          containerCount: 4,
          value: 1250000,
          eta: new Date("2025-03-18"),
          departureDate: new Date("2025-02-20"),
          vesselId: vessels[0].id,
          clientName: "Importadora del Caribe C.A.",
          notes: "Carga mixta de productos manufacturados y materia prima",
        },
      }),
      // 2 - En documentación, with vessel
      db.shipment.create({
        data: {
          reference: "ENV-2025-002",
          blNumber: "BL-AEX-2025-78451",
          origin: "Puerto de Puerto Cabello",
          destination: "Puerto de Cartagena",
          originPort: "VEPBL",
          destinationPort: "COCTG",
          status: "En documentación",
          cargoType: "Granel Sólido",
          weight: 15000.0,
          containerCount: 0,
          value: 850000,
          departureDate: new Date("2025-03-05"),
          vesselId: vessels[1].id,
          clientName: "Distribuidora Andina S.A.",
          notes: "Carga de cemento a granel para proyecto de construcción",
        },
      }),
      // 3 - En puerto de destino, with vessel
      db.shipment.create({
        data: {
          reference: "ENV-2025-003",
          blNumber: "BL-PVO-2025-32156",
          origin: "Puerto de Shanghái",
          destination: "Puerto de La Guaira",
          originPort: "CNSHA",
          destinationPort: "VELGU",
          status: "En puerto de destino",
          cargoType: "Contenedorizado",
          weight: 5200.0,
          containerCount: 8,
          value: 3200000,
          eta: new Date("2025-02-28"),
          departureDate: new Date("2025-01-15"),
          arrivalDate: new Date("2025-02-28"),
          vesselId: vessels[2].id,
          clientName: "Tecnología Oriental C.A.",
          notes: "Equipos electrónicos y componentes de computación",
        },
      }),
      // 4 - Registrado, NO vessel
      db.shipment.create({
        data: {
          reference: "ENV-2025-004",
          blNumber: "PENDIENTE",
          origin: "Puerto de Maracaibo",
          destination: "Puerto de Panamá",
          originPort: "VEMAR",
          destinationPort: "PAPAN",
          status: "Registrado",
          cargoType: "Carga General",
          weight: 3200.0,
          containerCount: 2,
          value: 450000,
          vesselId: null,
          clientName: "Exportadora Zuliana S.A.",
          notes: "Productos agrícolas no perecederos",
        },
      }),
      // 5 - Entregado, with vessel
      db.shipment.create({
        data: {
          reference: "ENV-2025-005",
          blNumber: "BL-NLT-2025-11234",
          origin: "Puerto de Miami",
          destination: "Puerto de Puerto Cabello",
          originPort: "USMIA",
          destinationPort: "VEPBL",
          status: "Entregado",
          cargoType: "Maquinaria",
          weight: 18500.0,
          containerCount: 3,
          value: 5600000,
          eta: new Date("2025-01-20"),
          departureDate: new Date("2025-01-05"),
          arrivalDate: new Date("2025-01-19"),
          vesselId: vessels[4].id,
          clientName: "Inversiones Petroleras C.A.",
          notes: "Equipos de perforación y partes de repuesto para plataforma",
        },
      }),
      // 6 - En aduana, with vessel
      db.shipment.create({
        data: {
          reference: "ENV-2025-006",
          blNumber: "BL-CRS-2025-55789",
          origin: "Puerto de Santos",
          destination: "Puerto de La Guaira",
          originPort: "BRSSZ",
          destinationPort: "VELGU",
          status: "En aduana",
          cargoType: "Perecederos",
          weight: 850.0,
          containerCount: 3,
          value: 320000,
          eta: new Date("2025-02-25"),
          departureDate: new Date("2025-02-15"),
          arrivalDate: new Date("2025-02-24"),
          vesselId: vessels[0].id,
          clientName: "Alimentos del Trópico S.A.",
          notes: "Productos alimenticios refrigerados - despacho prioritario",
        },
      }),
      // 7 - Con retraso, NO vessel
      db.shipment.create({
        data: {
          reference: "ENV-2025-007",
          blNumber: "PENDIENTE",
          origin: "Puerto de Valparaíso",
          destination: "Puerto de Maracaibo",
          originPort: "CLVAP",
          destinationPort: "VEMAR",
          status: "Con retraso",
          cargoType: "Granel Líquido",
          weight: 25000.0,
          containerCount: 0,
          value: 1800000,
          eta: new Date("2025-02-10"),
          vesselId: null,
          clientName: "Petroquímica Venezolana S.A.",
          notes: "Retraso por falta de buque disponible - carga de aceites industriales",
        },
      }),
      // 8 - En tránsito, with vessel
      db.shipment.create({
        data: {
          reference: "ENV-2025-008",
          blNumber: "BL-PVO-2025-44321",
          origin: "Puerto de Panamá",
          destination: "Puerto de Miami",
          originPort: "PAPAN",
          destinationPort: "USMIA",
          status: "En tránsito",
          cargoType: "Contenedorizado",
          weight: 4100.0,
          containerCount: 6,
          value: 2100000,
          eta: new Date("2025-03-10"),
          departureDate: new Date("2025-02-25"),
          vesselId: vessels[2].id,
          clientName: "Comercializadora Pan-Am S.A.",
          notes: "Mercancía general en tránsito zona libre",
        },
      }),
      // 9 - Registrado, NO vessel
      db.shipment.create({
        data: {
          reference: "ENV-2025-009",
          blNumber: "PENDIENTE",
          origin: "Puerto de Rotterdam",
          destination: "Puerto de Puerto Cabello",
          originPort: "NLRTM",
          destinationPort: "VEPBL",
          status: "Registrado",
          cargoType: "Carga General",
          weight: 6800.0,
          containerCount: 5,
          value: 3900000,
          vesselId: null,
          clientName: "Euro Import C.A.",
          notes: "Maquinaria industrial y repuestos desde Europa",
        },
      }),
      // 10 - En documentación, with vessel
      db.shipment.create({
        data: {
          reference: "ENV-2025-010",
          blNumber: "BL-AEX-2025-88990",
          origin: "Puerto de Cartagena",
          destination: "Puerto de Santos",
          originPort: "COCTG",
          destinationPort: "BRSSZ",
          status: "En documentación",
          cargoType: "Granel Sólido",
          weight: 22000.0,
          containerCount: 0,
          value: 1500000,
          departureDate: new Date("2025-03-12"),
          vesselId: vessels[1].id,
          clientName: "Carbones de la Costa S.A.S.",
          notes: "Exportación de carbón térmico - permisos ambientales en trámite",
        },
      }),
    ]);

    // ==================== CREATE PERMITS ====================
    await Promise.all([
      // Shipment 1 permits
      db.permit.create({
        data: {
          type: "Importación",
          number: "IMP-2025-004512",
          shipmentId: shipments[0].id,
          issueDate: new Date("2025-02-10"),
          expiryDate: new Date("2025-05-10"),
          status: "Vigente",
          authority: "SENIAT - Aduana de La Guaira",
          notes: "Permiso de importación general",
        },
      }),
      db.permit.create({
        data: {
          type: "Sanitario",
          number: "SAN-2025-12783",
          shipmentId: shipments[0].id,
          issueDate: new Date("2025-02-05"),
          expiryDate: new Date("2025-04-05"),
          status: "Vigente",
          authority: "Ministerio de Salud",
          notes: "Certificado sanitario para productos manufacturados",
        },
      }),
      // Shipment 2 permits
      db.permit.create({
        data: {
          type: "Exportación",
          number: "EXP-2025-008923",
          shipmentId: shipments[1].id,
          issueDate: new Date("2025-02-20"),
          expiryDate: new Date("2025-05-20"),
          status: "Vigente",
          authority: "SENIAT - Aduana de Puerto Cabello",
        },
      }),
      db.permit.create({
        data: {
          type: "Zona Franca",
          number: "ZF-2025-00345",
          shipmentId: shipments[1].id,
          issueDate: null,
          expiryDate: null,
          status: "En trámite",
          authority: "Zona Franca de Cartagena",
          notes: "En espera de aprobación de la autoridad colombiana",
        },
      }),
      // Shipment 3 permits
      db.permit.create({
        data: {
          type: "Importación",
          number: "IMP-2025-006789",
          shipmentId: shipments[2].id,
          issueDate: new Date("2025-01-10"),
          expiryDate: new Date("2025-04-10"),
          status: "Vigente",
          authority: "SENIAT - Aduana de La Guaira",
        },
      }),
      db.permit.create({
        data: {
          type: "Fitosanitario",
          number: "FITO-2025-00456",
          shipmentId: shipments[2].id,
          issueDate: new Date("2024-12-15"),
          expiryDate: new Date("2025-02-15"),
          status: "Vencido",
          authority: "INSAI - Instituto Nacional de Salud Agrícola",
          notes: "Permiso vencido - requiere renovación urgente",
        },
      }),
      db.permit.create({
        data: {
          type: "Arma Naval",
          number: "AN-2025-00078",
          shipmentId: shipments[2].id,
          issueDate: new Date("2025-01-08"),
          expiryDate: new Date("2025-07-08"),
          status: "Vigente",
          authority: "Comando Naval de Venezuela",
        },
      }),
      // Shipment 4 permits
      db.permit.create({
        data: {
          type: "Exportación",
          number: "EXP-2025-011234",
          shipmentId: shipments[3].id,
          issueDate: null,
          expiryDate: null,
          status: "Pendiente",
          authority: "SENIAT - Aduana de Maracaibo",
          notes: "Pendiente de presentación de documentos",
        },
      }),
      // Shipment 5 permits
      db.permit.create({
        data: {
          type: "Importación",
          number: "IMP-2025-002345",
          shipmentId: shipments[4].id,
          issueDate: new Date("2024-12-20"),
          expiryDate: new Date("2025-03-20"),
          status: "Vigente",
          authority: "SENIAT - Aduana de Puerto Cabello",
        },
      }),
      db.permit.create({
        data: {
          type: "Tránsito Aduanero",
          number: "TA-2025-00567",
          shipmentId: shipments[4].id,
          issueDate: new Date("2025-01-03"),
          expiryDate: new Date("2025-02-03"),
          status: "Vencido",
          authority: "SENIAT - Oficina Principal",
        },
      }),
      // Shipment 6 permits
      db.permit.create({
        data: {
          type: "Sanitario",
          number: "SAN-2025-09876",
          shipmentId: shipments[5].id,
          issueDate: new Date("2025-02-10"),
          expiryDate: new Date("2025-03-10"),
          status: "Vigente",
          authority: "Ministerio de Salud - INH",
          notes: "Inspección sanitaria de alimentos perecederos",
        },
      }),
      db.permit.create({
        data: {
          type: "Fitosanitario",
          number: "FITO-2025-00789",
          shipmentId: shipments[5].id,
          issueDate: new Date("2025-02-08"),
          expiryDate: new Date("2025-03-08"),
          status: "Vigente",
          authority: "INSAI",
        },
      }),
      // Shipment 7 permits
      db.permit.create({
        data: {
          type: "Importación",
          number: "IMP-2025-009876",
          shipmentId: shipments[6].id,
          issueDate: new Date("2025-01-25"),
          expiryDate: new Date("2025-04-25"),
          status: "Vigente",
          authority: "SENIAT - Aduana de Maracaibo",
        },
      }),
      db.permit.create({
        data: {
          type: "Sanitario",
          number: "SAN-2025-05432",
          shipmentId: shipments[6].id,
          issueDate: null,
          expiryDate: null,
          status: "Pendiente",
          authority: "Ministerio de Salud",
          notes: "Requiere inspección antes de emitir",
        },
      }),
      // Shipment 8 permits
      db.permit.create({
        data: {
          type: "Exportación",
          number: "EXP-2025-015678",
          shipmentId: shipments[7].id,
          issueDate: new Date("2025-02-20"),
          expiryDate: new Date("2025-05-20"),
          status: "Vigente",
          authority: "Autoridad Aduanera de Panamá",
        },
      }),
      db.permit.create({
        data: {
          type: "Tránsito Aduanero",
          number: "TA-2025-00890",
          shipmentId: shipments[7].id,
          issueDate: new Date("2025-02-22"),
          expiryDate: new Date("2025-04-22"),
          status: "Vigente",
          authority: "SENIAT - Aduana Principal",
        },
      }),
      // Shipment 9 permits
      db.permit.create({
        data: {
          type: "Importación",
          number: "IMP-2025-013579",
          shipmentId: shipments[8].id,
          issueDate: null,
          expiryDate: null,
          status: "Pendiente",
          authority: "SENIAT - Aduana de Puerto Cabello",
          notes: "En espera de documentación del proveedor europeo",
        },
      }),
      // Shipment 10 permits
      db.permit.create({
        data: {
          type: "Exportación",
          number: "EXP-2025-024680",
          shipmentId: shipments[9].id,
          issueDate: new Date("2025-02-25"),
          expiryDate: new Date("2025-05-25"),
          status: "Vigente",
          authority: "DIAN - Colombia",
        },
      }),
      db.permit.create({
        data: {
          type: "Sanitario",
          number: "SAN-2025-11223",
          shipmentId: shipments[9].id,
          issueDate: null,
          expiryDate: null,
          status: "En trámite",
          authority: "INVIMA - Colombia",
          notes: "Permiso ambiental en proceso de evaluación",
        },
      }),
    ]);

    // ==================== CREATE CONTAINERS ====================
    await Promise.all([
      // Shipment 1 containers (4)
      db.container.create({
        data: {
          number: "CRSU-4589231",
          type: "40' High Cube",
          shipmentId: shipments[0].id,
          weight: 780.0,
          status: "Lleno",
          sealNumber: "SL-2025-44551",
          dimensions: "12.19m x 2.44m x 2.90m",
        },
      }),
      db.container.create({
        data: {
          number: "CRSU-4589232",
          type: "40' Estándar",
          shipmentId: shipments[0].id,
          weight: 650.0,
          status: "Lleno",
          sealNumber: "SL-2025-44552",
          dimensions: "12.19m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "CRSU-4589233",
          type: "20' Estándar",
          shipmentId: shipments[0].id,
          weight: 820.0,
          status: "Lleno",
          sealNumber: "SL-2025-44553",
          dimensions: "6.06m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "CRSU-4589234",
          type: "20' Estándar",
          shipmentId: shipments[0].id,
          weight: 600.5,
          status: "Lleno",
          sealNumber: "SL-2025-44554",
          dimensions: "6.06m x 2.44m x 2.59m",
        },
      }),
      // Shipment 2 containers (0 - granel)
      // Shipment 3 containers (8)
      db.container.create({
        data: {
          number: "PVOU-3215601",
          type: "40' High Cube",
          shipmentId: shipments[2].id,
          weight: 680.0,
          status: "Lleno",
          sealNumber: "SL-2025-33201",
          dimensions: "12.19m x 2.44m x 2.90m",
        },
      }),
      db.container.create({
        data: {
          number: "PVOU-3215602",
          type: "40' High Cube",
          shipmentId: shipments[2].id,
          weight: 720.0,
          status: "Lleno",
          sealNumber: "SL-2025-33202",
          dimensions: "12.19m x 2.44m x 2.90m",
        },
      }),
      db.container.create({
        data: {
          number: "PVOU-3215603",
          type: "40' Estándar",
          shipmentId: shipments[2].id,
          weight: 590.0,
          status: "Lleno",
          sealNumber: "SL-2025-33203",
          dimensions: "12.19m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "PVOU-3215604",
          type: "20' Estándar",
          shipmentId: shipments[2].id,
          weight: 550.0,
          status: "Lleno",
          sealNumber: "SL-2025-33204",
          dimensions: "6.06m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "PVOU-3215605",
          type: "20' Estándar",
          shipmentId: shipments[2].id,
          weight: 610.0,
          status: "Lleno",
          sealNumber: "SL-2025-33205",
          dimensions: "6.06m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "PVOU-3215606",
          type: "20' Estándar",
          shipmentId: shipments[2].id,
          weight: 480.0,
          status: "Lleno",
          sealNumber: "SL-2025-33206",
          dimensions: "6.06m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "PVOU-3215607",
          type: "40' High Cube",
          shipmentId: shipments[2].id,
          weight: 830.0,
          status: "Lleno",
          sealNumber: "SL-2025-33207",
          dimensions: "12.19m x 2.44m x 2.90m",
        },
      }),
      db.container.create({
        data: {
          number: "PVOU-3215608",
          type: "40' Estándar",
          shipmentId: shipments[2].id,
          weight: 740.0,
          status: "Lleno",
          sealNumber: "SL-2025-33208",
          dimensions: "12.19m x 2.44m x 2.59m",
        },
      }),
      // Shipment 4 containers (2)
      db.container.create({
        data: {
          number: "MRBU-8891201",
          type: "40' Estándar",
          shipmentId: shipments[3].id,
          weight: 1600.0,
          status: "En espera",
          sealNumber: null,
          dimensions: "12.19m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "MRBU-8891202",
          type: "40' Estándar",
          shipmentId: shipments[3].id,
          weight: 1600.0,
          status: "En espera",
          sealNumber: null,
          dimensions: "12.19m x 2.44m x 2.59m",
        },
      }),
      // Shipment 5 containers (3)
      db.container.create({
        data: {
          number: "NLTU-1123401",
          type: "Open Top",
          shipmentId: shipments[4].id,
          weight: 7500.0,
          status: "Descargado",
          sealNumber: "SL-2025-11001",
          dimensions: "12.19m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "NLTU-1123402",
          type: "40' High Cube",
          shipmentId: shipments[4].id,
          weight: 6200.0,
          status: "Descargado",
          sealNumber: "SL-2025-11002",
          dimensions: "12.19m x 2.44m x 2.90m",
        },
      }),
      db.container.create({
        data: {
          number: "NLTU-1123403",
          type: "40' Estándar",
          shipmentId: shipments[4].id,
          weight: 4800.0,
          status: "Descargado",
          sealNumber: "SL-2025-11003",
          dimensions: "12.19m x 2.44m x 2.59m",
        },
      }),
      // Shipment 6 containers (3)
      db.container.create({
        data: {
          number: "CRSU-5578901",
          type: "Refrigerado",
          shipmentId: shipments[5].id,
          weight: 280.0,
          status: "En aduana",
          sealNumber: "SL-2025-55801",
          dimensions: "6.06m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "CRSU-5578902",
          type: "Refrigerado",
          shipmentId: shipments[5].id,
          weight: 310.0,
          status: "En aduana",
          sealNumber: "SL-2025-55802",
          dimensions: "6.06m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "CRSU-5578903",
          type: "Refrigerado",
          shipmentId: shipments[5].id,
          weight: 260.0,
          status: "En aduana",
          sealNumber: "SL-2025-55803",
          dimensions: "6.06m x 2.44m x 2.59m",
        },
      }),
      // Shipment 7 containers (0 - granel líquido)
      // Shipment 8 containers (6)
      db.container.create({
        data: {
          number: "PVOU-4432101",
          type: "40' High Cube",
          shipmentId: shipments[7].id,
          weight: 700.0,
          status: "Lleno",
          sealNumber: "SL-2025-44301",
          dimensions: "12.19m x 2.44m x 2.90m",
        },
      }),
      db.container.create({
        data: {
          number: "PVOU-4432102",
          type: "40' Estándar",
          shipmentId: shipments[7].id,
          weight: 650.0,
          status: "Lleno",
          sealNumber: "SL-2025-44302",
          dimensions: "12.19m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "PVOU-4432103",
          type: "20' Estándar",
          shipmentId: shipments[7].id,
          weight: 580.0,
          status: "Lleno",
          sealNumber: "SL-2025-44303",
          dimensions: "6.06m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "PVOU-4432104",
          type: "20' Estándar",
          shipmentId: shipments[7].id,
          weight: 620.0,
          status: "Lleno",
          sealNumber: "SL-2025-44304",
          dimensions: "6.06m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "PVOU-4432105",
          type: "40' High Cube",
          shipmentId: shipments[7].id,
          weight: 770.0,
          status: "Lleno",
          sealNumber: "SL-2025-44305",
          dimensions: "12.19m x 2.44m x 2.90m",
        },
      }),
      db.container.create({
        data: {
          number: "PVOU-4432106",
          type: "40' Estándar",
          shipmentId: shipments[7].id,
          weight: 780.0,
          status: "Lleno",
          sealNumber: "SL-2025-44306",
          dimensions: "12.19m x 2.44m x 2.59m",
        },
      }),
      // Shipment 9 containers (5)
      db.container.create({
        data: {
          number: "RTMU-9987701",
          type: "40' High Cube",
          shipmentId: shipments[8].id,
          weight: 1400.0,
          status: "En espera",
          sealNumber: null,
          dimensions: "12.19m x 2.44m x 2.90m",
        },
      }),
      db.container.create({
        data: {
          number: "RTMU-9987702",
          type: "Open Top",
          shipmentId: shipments[8].id,
          weight: 1800.0,
          status: "En espera",
          sealNumber: null,
          dimensions: "12.19m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "RTMU-9987703",
          type: "40' Estándar",
          shipmentId: shipments[8].id,
          weight: 1200.0,
          status: "En espera",
          sealNumber: null,
          dimensions: "12.19m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "RTMU-9987704",
          type: "40' Estándar",
          shipmentId: shipments[8].id,
          weight: 1100.0,
          status: "En espera",
          sealNumber: null,
          dimensions: "12.19m x 2.44m x 2.59m",
        },
      }),
      db.container.create({
        data: {
          number: "RTMU-9987705",
          type: "20' Estándar",
          shipmentId: shipments[8].id,
          weight: 1300.0,
          status: "En espera",
          sealNumber: null,
          dimensions: "6.06m x 2.44m x 2.59m",
        },
      }),
      // Shipment 10 containers (0 - granel)
    ]);

    // ==================== CREATE DOCUMENTS ====================
    await Promise.all([
      // Shipment 1 documents
      db.document.create({
        data: {
          name: "Conocimiento de Embarque ENV-2025-001",
          type: "BL",
          shipmentId: shipments[0].id,
          uploadDate: new Date("2025-02-18"),
          status: "Vigente",
          fileSize: "2.4 MB",
          category: "Transporte",
        },
      }),
      db.document.create({
        data: {
          name: "Factura Comercial - Importadora del Caribe",
          type: "Factura Comercial",
          shipmentId: shipments[0].id,
          uploadDate: new Date("2025-02-15"),
          status: "Vigente",
          fileSize: "1.8 MB",
          category: "Comercial",
        },
      }),
      db.document.create({
        data: {
          name: "Póliza de Seguro ENV-2025-001",
          type: "Póliza de Seguro",
          shipmentId: shipments[0].id,
          uploadDate: new Date("2025-02-16"),
          expiryDate: new Date("2025-08-16"),
          status: "Vigente",
          fileSize: "3.1 MB",
          category: "Seguro",
        },
      }),
      db.document.create({
        data: {
          name: "Lista de Empaque ENV-2025-001",
          type: "Lista de Empaque",
          shipmentId: shipments[0].id,
          uploadDate: new Date("2025-02-17"),
          status: "Vigente",
          fileSize: "1.2 MB",
          category: "Aduana",
        },
      }),
      // Shipment 2 documents
      db.document.create({
        data: {
          name: "Conocimiento de Embarque ENV-2025-002",
          type: "BL",
          shipmentId: shipments[1].id,
          uploadDate: new Date("2025-03-01"),
          status: "En trámite",
          fileSize: "2.1 MB",
          category: "Transporte",
        },
      }),
      db.document.create({
        data: {
          name: "Factura Comercial - Distribuidora Andina",
          type: "Factura Comercial",
          shipmentId: shipments[1].id,
          uploadDate: new Date("2025-02-25"),
          status: "Vigente",
          fileSize: "1.5 MB",
          category: "Comercial",
        },
      }),
      db.document.create({
        data: {
          name: "Certificado de Origen ENV-2025-002",
          type: "Certificado de Origen",
          shipmentId: shipments[1].id,
          uploadDate: new Date("2025-02-26"),
          status: "Vigente",
          fileSize: "0.8 MB",
          category: "Aduana",
        },
      }),
      // Shipment 3 documents
      db.document.create({
        data: {
          name: "Conocimiento de Embarque ENV-2025-003",
          type: "BL",
          shipmentId: shipments[2].id,
          uploadDate: new Date("2025-01-14"),
          status: "Vigente",
          fileSize: "2.6 MB",
          category: "Transporte",
        },
      }),
      db.document.create({
        data: {
          name: "Factura Comercial - Tecnología Oriental",
          type: "Factura Comercial",
          shipmentId: shipments[2].id,
          uploadDate: new Date("2025-01-10"),
          status: "Vigente",
          fileSize: "2.3 MB",
          category: "Comercial",
        },
      }),
      db.document.create({
        data: {
          name: "Declaración Aduanera ENV-2025-003",
          type: "Declaración Aduanera",
          shipmentId: shipments[2].id,
          uploadDate: new Date("2025-02-28"),
          status: "Vigente",
          fileSize: "4.5 MB",
          category: "Aduana",
        },
      }),
      db.document.create({
        data: {
          name: "Certificado Fitosanitario ENV-2025-003",
          type: "Certificado Fitosanitario",
          shipmentId: shipments[2].id,
          uploadDate: new Date("2024-12-15"),
          expiryDate: new Date("2025-02-15"),
          status: "Vencido",
          fileSize: "1.1 MB",
          category: "Sanitario",
        },
      }),
      // Shipment 4 documents
      db.document.create({
        data: {
          name: "Factura Comercial - Exportadora Zuliana",
          type: "Factura Comercial",
          shipmentId: shipments[3].id,
          uploadDate: new Date("2025-02-28"),
          status: "Pendiente",
          fileSize: "0.9 MB",
          category: "Comercial",
        },
      }),
      db.document.create({
        data: {
          name: "Lista de Empaque ENV-2025-004",
          type: "Lista de Empaque",
          shipmentId: shipments[3].id,
          uploadDate: new Date("2025-02-28"),
          status: "Pendiente",
          fileSize: "0.7 MB",
          category: "Aduana",
        },
      }),
      // Shipment 5 documents
      db.document.create({
        data: {
          name: "Conocimiento de Embarque ENV-2025-005",
          type: "BL",
          shipmentId: shipments[4].id,
          uploadDate: new Date("2025-01-04"),
          status: "Vigente",
          fileSize: "2.2 MB",
          category: "Transporte",
        },
      }),
      db.document.create({
        data: {
          name: "Factura Comercial - Inversiones Petroleras",
          type: "Factura Comercial",
          shipmentId: shipments[4].id,
          uploadDate: new Date("2025-01-02"),
          status: "Vigente",
          fileSize: "3.4 MB",
          category: "Comercial",
        },
      }),
      db.document.create({
        data: {
          name: "Seguro de Carga ENV-2025-005",
          type: "Seguro",
          shipmentId: shipments[4].id,
          uploadDate: new Date("2025-01-03"),
          expiryDate: new Date("2025-07-03"),
          status: "Vigente",
          fileSize: "2.8 MB",
          category: "Seguro",
        },
      }),
      db.document.create({
        data: {
          name: "Declaración Aduanera ENV-2025-005",
          type: "Declaración Aduanera",
          shipmentId: shipments[4].id,
          uploadDate: new Date("2025-01-19"),
          status: "Vigente",
          fileSize: "5.1 MB",
          category: "Aduana",
        },
      }),
      // Shipment 6 documents
      db.document.create({
        data: {
          name: "Conocimiento de Embarque ENV-2025-006",
          type: "BL",
          shipmentId: shipments[5].id,
          uploadDate: new Date("2025-02-14"),
          status: "Vigente",
          fileSize: "1.9 MB",
          category: "Transporte",
        },
      }),
      db.document.create({
        data: {
          name: "Certificado Fitosanitario ENV-2025-006",
          type: "Certificado Fitosanitario",
          shipmentId: shipments[5].id,
          uploadDate: new Date("2025-02-08"),
          expiryDate: new Date("2025-03-08"),
          status: "Vigente",
          fileSize: "1.0 MB",
          category: "Sanitario",
        },
      }),
      db.document.create({
        data: {
          name: "Factura Comercial - Alimentos del Trópico",
          type: "Factura Comercial",
          shipmentId: shipments[5].id,
          uploadDate: new Date("2025-02-10"),
          status: "Vigente",
          fileSize: "1.3 MB",
          category: "Comercial",
        },
      }),
      // Shipment 7 documents
      db.document.create({
        data: {
          name: "Factura Comercial - Petroquímica Venezolana",
          type: "Factura Comercial",
          shipmentId: shipments[6].id,
          uploadDate: new Date("2025-01-20"),
          status: "Vigente",
          fileSize: "1.7 MB",
          category: "Comercial",
        },
      }),
      db.document.create({
        data: {
          name: "Certificado de Origen ENV-2025-007",
          type: "Certificado de Origen",
          shipmentId: shipments[6].id,
          uploadDate: new Date("2025-01-22"),
          status: "Vencido",
          expiryDate: new Date("2025-02-01"),
          fileSize: "0.6 MB",
          category: "Aduana",
        },
      }),
      db.document.create({
        data: {
          name: "Póliza de Seguro ENV-2025-007",
          type: "Póliza de Seguro",
          shipmentId: shipments[6].id,
          uploadDate: new Date("2025-01-18"),
          expiryDate: new Date("2025-04-18"),
          status: "Vigente",
          fileSize: "2.5 MB",
          category: "Seguro",
        },
      }),
      // Shipment 8 documents
      db.document.create({
        data: {
          name: "Conocimiento de Embarque ENV-2025-008",
          type: "BL",
          shipmentId: shipments[7].id,
          uploadDate: new Date("2025-02-24"),
          status: "Vigente",
          fileSize: "2.0 MB",
          category: "Transporte",
        },
      }),
      db.document.create({
        data: {
          name: "Factura Comercial - Comercializadora Pan-Am",
          type: "Factura Comercial",
          shipmentId: shipments[7].id,
          uploadDate: new Date("2025-02-22"),
          status: "Vigente",
          fileSize: "2.1 MB",
          category: "Comercial",
        },
      }),
      db.document.create({
        data: {
          name: "Declaración Aduanera ENV-2025-008",
          type: "Declaración Aduanera",
          shipmentId: shipments[7].id,
          uploadDate: new Date("2025-02-25"),
          status: "En trámite",
          fileSize: "3.8 MB",
          category: "Aduana",
        },
      }),
      db.document.create({
        data: {
          name: "Lista de Empaque ENV-2025-008",
          type: "Lista de Empaque",
          shipmentId: shipments[7].id,
          uploadDate: new Date("2025-02-23"),
          status: "Vigente",
          fileSize: "0.9 MB",
          category: "Aduana",
        },
      }),
      // Shipment 9 documents
      db.document.create({
        data: {
          name: "Conocimiento de Embarque ENV-2025-009",
          type: "BL",
          shipmentId: shipments[8].id,
          uploadDate: new Date("2025-03-01"),
          status: "Pendiente",
          fileSize: "0 KB",
          category: "Transporte",
        },
      }),
      db.document.create({
        data: {
          name: "Factura Comercial - Euro Import",
          type: "Factura Comercial",
          shipmentId: shipments[8].id,
          uploadDate: new Date("2025-02-27"),
          status: "Pendiente",
          fileSize: "2.9 MB",
          category: "Comercial",
        },
      }),
      db.document.create({
        data: {
          name: "Certificado de Origen ENV-2025-009",
          type: "Certificado de Origen",
          shipmentId: shipments[8].id,
          uploadDate: new Date("2025-02-28"),
          status: "Pendiente",
          fileSize: "0.5 MB",
          category: "Aduana",
        },
      }),
      // Shipment 10 documents
      db.document.create({
        data: {
          name: "Conocimiento de Embarque ENV-2025-010",
          type: "BL",
          shipmentId: shipments[9].id,
          uploadDate: new Date("2025-03-05"),
          status: "En trámite",
          fileSize: "1.8 MB",
          category: "Transporte",
        },
      }),
      db.document.create({
        data: {
          name: "Factura Comercial - Carbones de la Costa",
          type: "Factura Comercial",
          shipmentId: shipments[9].id,
          uploadDate: new Date("2025-03-02"),
          status: "Vigente",
          fileSize: "1.4 MB",
          category: "Comercial",
        },
      }),
      db.document.create({
        data: {
          name: "Certificado de Origen ENV-2025-010",
          type: "Certificado de Origen",
          shipmentId: shipments[9].id,
          uploadDate: new Date("2025-03-01"),
          status: "Vigente",
          fileSize: "0.7 MB",
          category: "Aduana",
        },
      }),
      db.document.create({
        data: {
          name: "Seguro de Carga ENV-2025-010",
          type: "Seguro",
          shipmentId: shipments[9].id,
          uploadDate: new Date("2025-03-03"),
          expiryDate: new Date("2025-09-03"),
          status: "Vigente",
          fileSize: "2.3 MB",
          category: "Seguro",
        },
      }),
    ]);

    // Get final counts
    const finalCounts = {
      ports: await db.port.count(),
      vessels: await db.vessel.count(),
      shipments: await db.shipment.count(),
      permits: await db.permit.count(),
      containers: await db.container.count(),
      documents: await db.document.count(),
    };

    return NextResponse.json({
      message: "Base de datos poblada exitosamente",
      counts: finalCounts,
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Error al poblar la base de datos", details: String(error) },
      { status: 500 }
    );
  }
}
