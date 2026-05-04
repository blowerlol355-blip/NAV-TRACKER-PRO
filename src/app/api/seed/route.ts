import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Check if database already has data
    const existingShipments = await db.shipment.count()
    if (existingShipments > 0) {
      return NextResponse.json({ success: true, message: "Database already seeded, skipping" })
    }

    // Delete existing data in the correct order (respecting foreign keys)
    await db.crewAssignment.deleteMany();
    await db.chainOfCustody.deleteMany();
    await db.claim.deleteMany();
    await db.cargoDetail.deleteMany();
    await db.document.deleteMany();
    await db.container.deleteMany();
    await db.permit.deleteMany();
    await db.shipment.deleteMany();
    await db.vessel.deleteMany();
    await db.port.deleteMany();
    await db.crew.deleteMany();
    await db.countryRequirement.deleteMany();
    await db.complianceCostItem.deleteMany();

    // ==================== CREATE PORTS ====================
    const ports = await Promise.all([
      db.port.create({ data: { name: "Puerto de La Guaira", country: "Venezuela", code: "VELGU", timezone: "America/Caracas" } }),
      db.port.create({ data: { name: "Puerto de Puerto Cabello", country: "Venezuela", code: "VEPBL", timezone: "America/Caracas" } }),
      db.port.create({ data: { name: "Puerto de Maracaibo", country: "Venezuela", code: "VEMAR", timezone: "America/Caracas" } }),
      db.port.create({ data: { name: "Puerto de Cartagena", country: "Colombia", code: "COCTG", timezone: "America/Bogota" } }),
      db.port.create({ data: { name: "Puerto de Panamá", country: "Panamá", code: "PAPAN", timezone: "America/Panama" } }),
      db.port.create({ data: { name: "Puerto de Miami", country: "EE.UU.", code: "USMIA", timezone: "America/New_York" } }),
      db.port.create({ data: { name: "Puerto de Rotterdam", country: "Países Bajos", code: "NLRTM", timezone: "Europe/Amsterdam" } }),
      db.port.create({ data: { name: "Puerto de Shanghái", country: "China", code: "CNSHA", timezone: "Asia/Shanghai" } }),
      db.port.create({ data: { name: "Puerto de Santos", country: "Brasil", code: "BRSSZ", timezone: "America/Sao_Paulo" } }),
      db.port.create({ data: { name: "Puerto de Valparaíso", country: "Chile", code: "CLVAP", timezone: "America/Santiago" } }),
      db.port.create({ data: { name: "Puerto de Hamburgo", country: "Alemania", code: "DEHAM", timezone: "Europe/Berlin" } }),
      db.port.create({ data: { name: "Puerto de Yokohama", country: "Japón", code: "JPYOK", timezone: "Asia/Tokyo" } }),
    ]);

    // ==================== CREATE VESSELS ====================
    const vessels = await Promise.all([
      db.vessel.create({ data: { name: "MV Caribbean Star", imo: "9123456", flag: "Panamá", type: "Portacontenedores", capacity: 8500, currentLocation: "Caribe, 12°30'N 71°W", status: "En tránsito", speed: 18.5, built: 2018, owner: "Naviera Caribe S.A." } }),
      db.vessel.create({ data: { name: "MV Atlántico Express", imo: "9234567", flag: "Liberia", type: "Granelero", capacity: 52000, currentLocation: "Puerto de Puerto Cabello", status: "En puerto", speed: 14.2, built: 2015, owner: "Express Maritime Ltd." } }),
      db.vessel.create({ data: { name: "MV Pacífico Voyager", imo: "9345678", flag: "Islas Marshall", type: "Portacontenedores", capacity: 12000, currentLocation: "Pacífico, 5°S 85°W", status: "En tránsito", speed: 22.0, built: 2020, owner: "Pacific Shipping Corp." } }),
      db.vessel.create({ data: { name: "MV Sur del Mar", imo: "9456789", flag: "Malta", type: "Tanque", capacity: 75000, currentLocation: "Astillero de Singapur", status: "En reparación", speed: 16.0, built: 2012, owner: "Petromar Inc." } }),
      db.vessel.create({ data: { name: "MV Norte Light", imo: "9567890", flag: "Bahamas", type: "Carga General", capacity: 15000, currentLocation: "Atlántico Norte, 35°N 45°W", status: "En tránsito", speed: 17.5, built: 2016, owner: "Nordic Cargo AS" } }),
    ]);

    // ==================== CREATE CREW ====================
    const crewMembers = await Promise.all([
      db.crew.create({
        data: {
          fullName: "Cap. Carlos Mendoza",
          licenseId: "SMC-VENE-2018-4521",
          nationality: "Venezolana",
          identityDoc: "V-12345678",
          identityDocType: "Cédula",
          certifications: JSON.stringify([
            { name: "GMDSS", number: "GMDSS-4521", expiryDate: "2026-03-15" },
            { name: "SSO", number: "SSO-4521", expiryDate: "2025-08-20" },
            { name: "Médico", number: "MED-4521", expiryDate: "2026-01-10" },
          ]),
          carrierCompany: "Naviera Caribe S.A.",
          emergencyContact: "+58 414-1234567 (Sra. María Mendoza)",
          licenseExpiry: new Date("2026-06-15"),
          role: "Capitán",
          status: "Activo",
          email: "c.mendoza@navieracaribe.com",
          phone: "+58 414-9876543",
        },
      }),
      db.crew.create({
        data: {
          fullName: "Cap. Roberto Fuentes",
          licenseId: "SMC-COL-2019-7834",
          nationality: "Colombiana",
          identityDoc: "CC-76543210",
          identityDocType: "Cédula",
          certifications: JSON.stringify([
            { name: "GMDSS", number: "GMDSS-7834", expiryDate: "2026-05-01" },
            { name: "SSO", number: "SSO-7834", expiryDate: "2025-04-01" },
            { name: "STCW", number: "STCW-7834", expiryDate: "2025-03-20" },
          ]),
          carrierCompany: "Express Maritime Ltd.",
          emergencyContact: "+57 310-7654321 (Sr. Pedro Fuentes)",
          licenseExpiry: new Date("2025-04-01"),
          role: "Capitán",
          status: "Licencia Vencida",
          email: "r.fuentes@expressmaritime.com",
          phone: "+57 310-8765432",
        },
      }),
      db.crew.create({
        data: {
          fullName: "C/E Ana Rodríguez",
          licenseId: "SMC-PAN-2020-3456",
          nationality: "Panameña",
          identityDoc: "PE-89012345",
          identityDocType: "Pasaporte",
          certifications: JSON.stringify([
            { name: "GMDSS", number: "GMDSS-3456", expiryDate: "2027-02-10" },
            { name: "SSO", number: "SSO-3456", expiryDate: "2026-11-15" },
            { name: "Médico", number: "MED-3456", expiryDate: "2026-07-20" },
          ]),
          carrierCompany: "Pacific Shipping Corp.",
          emergencyContact: "+507 6789-0123 (Sra. Laura Rodríguez)",
          licenseExpiry: new Date("2027-01-15"),
          role: "Jefe de Máquinas",
          status: "En viaje",
          email: "a.rodriguez@pacificshipping.com",
          phone: "+507 6789-4567",
        },
      }),
      db.crew.create({
        data: {
          fullName: "Of. Miguel Torres",
          licenseId: "STCW-VENE-2021-9012",
          nationality: "Venezolana",
          identityDoc: "V-45678901",
          identityDocType: "Cédula",
          certifications: JSON.stringify([
            { name: "STCW", number: "STCW-9012", expiryDate: "2025-06-30" },
            { name: "SSO", number: "SSO-9012", expiryDate: "2025-09-15" },
          ]),
          carrierCompany: "Naviera Caribe S.A.",
          emergencyContact: "+58 416-3456789 (Sra. Carmen Torres)",
          licenseExpiry: new Date("2025-06-30"),
          role: "Oficial de Cubierta",
          status: "Activo",
          email: "m.torres@navieracaribe.com",
          phone: "+58 416-2345678",
        },
      }),
      db.crew.create({
        data: {
          fullName: "Cap. Hans Müller",
          licenseId: "SMC-DEU-2017-5678",
          nationality: "Alemana",
          identityDoc: "DE-A1234567",
          identityDocType: "Pasaporte",
          certifications: JSON.stringify([
            { name: "GMDSS", number: "GMDSS-5678", expiryDate: "2026-12-01" },
            { name: "SSO", number: "SSO-5678", expiryDate: "2026-06-15" },
            { name: "Médico", number: "MED-5678", expiryDate: "2026-03-20" },
            { name: "ARPA", number: "ARPA-5678", expiryDate: "2027-01-10" },
          ]),
          carrierCompany: "Nordic Cargo AS",
          emergencyContact: "+49 170-1234567 (Frau Ingrid Müller)",
          licenseExpiry: new Date("2027-02-28"),
          role: "Capitán",
          status: "En viaje",
          email: "h.muller@nordiccargo.de",
          phone: "+49 170-9876543",
        },
      }),
      db.crew.create({
        data: {
          fullName: "Mar. José García",
          licenseId: "STCW-VENE-2022-2345",
          nationality: "Venezolana",
          identityDoc: "V-98765432",
          identityDocType: "Cédula",
          certifications: JSON.stringify([
            { name: "STCW", number: "STCW-2345", expiryDate: "2026-08-15" },
          ]),
          carrierCompany: "Petromar Inc.",
          emergencyContact: "+58 412-8765432 (Sr. Luis García)",
          licenseExpiry: new Date("2026-08-15"),
          role: "Marinero",
          status: "Inactivo",
          email: "j.garcia@petromar.com",
          phone: "+58 412-7654321",
        },
      }),
      db.crew.create({
        data: {
          fullName: "C/E Kenji Tanaka",
          licenseId: "SMC-JPN-2019-6789",
          nationality: "Japonesa",
          identityDoc: "JP-CD5678901",
          identityDocType: "Pasaporte",
          certifications: JSON.stringify([
            { name: "GMDSS", number: "GMDSS-6789", expiryDate: "2026-04-20" },
            { name: "SSO", number: "SSO-6789", expiryDate: "2026-10-01" },
            { name: "Médico", number: "MED-6789", expiryDate: "2025-03-25" },
          ]),
          carrierCompany: "Pacific Shipping Corp.",
          emergencyContact: "+81 90-1234-5678 (Mrs. Yuki Tanaka)",
          licenseExpiry: new Date("2026-09-30"),
          role: "Jefe de Máquinas",
          status: "En viaje",
          email: "k.tanaka@pacificshipping.jp",
          phone: "+81 90-9876-5432",
        },
      }),
      db.crew.create({
        data: {
          fullName: "Of. María Santos",
          licenseId: "STCW-BRA-2020-4321",
          nationality: "Brasileña",
          identityDoc: "BR-234567890",
          identityDocType: "RG",
          certifications: JSON.stringify([
            { name: "STCW", number: "STCW-4321", expiryDate: "2025-05-10" },
            { name: "SSO", number: "SSO-4321", expiryDate: "2025-07-15" },
            { name: "GMDSS", number: "GMDSS-4321", expiryDate: "2026-02-28" },
          ]),
          carrierCompany: "Express Maritime Ltd.",
          emergencyContact: "+55 11-98765-4321 (Sr. Paulo Santos)",
          licenseExpiry: new Date("2025-05-10"),
          role: "Oficial de Cubierta",
          status: "Activo",
          email: "m.santos@expressmaritime.br",
          phone: "+55 11-91234-5678",
        },
      }),
    ]);

    // ==================== CREATE SHIPMENTS ====================
    const shipments = await Promise.all([
      db.shipment.create({
        data: {
          reference: "ENV-2025-001", blNumber: "BL-CRS-2025-45892",
          origin: "Puerto de La Guaira", destination: "Puerto de Rotterdam",
          originPort: "VELGU", destinationPort: "NLRTM",
          status: "En tránsito", cargoType: "Contenedorizado",
          weight: 2850.5, containerCount: 4, value: 1250000,
          eta: new Date("2025-03-18"), departureDate: new Date("2025-02-20"),
          vesselId: vessels[0].id, clientName: "Importadora del Caribe C.A.",
          notes: "Carga mixta de productos manufacturados y materia prima",
          hsCode: "8479.89", hsDescription: "Máquinas y aparatos mecánicos con función propia",
          productDescription: "Equipos y maquinaria industrial diversa",
          regulatoryCategory: "Maquinaria", incoterm: "CIF",
          incotermPoint: "Rotterdam", originCountry: "Venezuela",
          destinationCountry: "Países Bajos",
        },
      }),
      db.shipment.create({
        data: {
          reference: "ENV-2025-002", blNumber: "BL-AEX-2025-78451",
          origin: "Puerto de Puerto Cabello", destination: "Puerto de Cartagena",
          originPort: "VEPBL", destinationPort: "COCTG",
          status: "En documentación", cargoType: "Granel Sólido",
          weight: 15000.0, containerCount: 0, value: 850000,
          departureDate: new Date("2025-03-05"),
          vesselId: vessels[1].id, clientName: "Distribuidora Andina S.A.",
          notes: "Carga de cemento a granel para proyecto de construcción",
          hsCode: "2523.29", hsDescription: "Cemento hidráulico, excepto Portland",
          productDescription: "Cemento gris a granel para construcción",
          regulatoryCategory: "Material de construcción", incoterm: "FOB",
          incotermPoint: "Puerto Cabello", originCountry: "Venezuela",
          destinationCountry: "Colombia",
        },
      }),
      db.shipment.create({
        data: {
          reference: "ENV-2025-003", blNumber: "BL-PVO-2025-32156",
          origin: "Puerto de Shanghái", destination: "Puerto de La Guaira",
          originPort: "CNSHA", destinationPort: "VELGU",
          status: "En puerto de destino", cargoType: "Contenedorizado",
          weight: 5200.0, containerCount: 8, value: 3200000,
          eta: new Date("2025-02-28"), departureDate: new Date("2025-01-15"),
          arrivalDate: new Date("2025-02-28"),
          vesselId: vessels[2].id, clientName: "Tecnología Oriental C.A.",
          notes: "Equipos electrónicos y componentes de computación",
          hsCode: "8471.30", hsDescription: "Máquinas automáticas para tratamiento de datos, portátiles",
          productDescription: "Computadoras portátiles y componentes electrónicos",
          regulatoryCategory: "Electrónica", incoterm: "CIF",
          incotermPoint: "La Guaira", originCountry: "China",
          destinationCountry: "Venezuela",
        },
      }),
      db.shipment.create({
        data: {
          reference: "ENV-2025-004", blNumber: "PENDIENTE",
          origin: "Puerto de Maracaibo", destination: "Puerto de Panamá",
          originPort: "VEMAR", destinationPort: "PAPAN",
          status: "Registrado", cargoType: "Carga General",
          weight: 3200.0, containerCount: 2, value: 450000,
          vesselId: null, clientName: "Exportadora Zuliana S.A.",
          notes: "Productos agrícolas no perecederos",
          hsCode: "0901.11", hsDescription: "Café, sin tostar, sin descafeinar",
          productDescription: "Café arábica verde, tipo Excelso",
          regulatoryCategory: "Alimento agrícola", subcategory: "Café verde",
          incoterm: "FOB", incotermPoint: "Maracaibo",
          originCountry: "Venezuela", originRegion: "Zulia",
          originMunicipality: "Perijá", originGpsLat: 10.3667, originGpsLng: -72.5667,
          destinationCountry: "Panamá",
        },
      }),
      db.shipment.create({
        data: {
          reference: "ENV-2025-005", blNumber: "BL-NLT-2025-11234",
          origin: "Puerto de Miami", destination: "Puerto de Puerto Cabello",
          originPort: "USMIA", destinationPort: "VEPBL",
          status: "Entregado", cargoType: "Maquinaria",
          weight: 18500.0, containerCount: 3, value: 5600000,
          eta: new Date("2025-01-20"), departureDate: new Date("2025-01-05"),
          arrivalDate: new Date("2025-01-19"),
          vesselId: vessels[4].id, clientName: "Inversiones Petroleras C.A.",
          notes: "Equipos de perforación y partes de repuesto para plataforma",
          hsCode: "8430.41", hsDescription: "Máquinas para perforación de petróleo",
          productDescription: "Equipos de perforación petrolera y repuestos",
          regulatoryCategory: "Maquinaria petrolera", incoterm: "DDP",
          incotermPoint: "Puerto Cabello", originCountry: "EE.UU.",
          destinationCountry: "Venezuela",
        },
      }),
      db.shipment.create({
        data: {
          reference: "ENV-2025-006", blNumber: "BL-CRS-2025-55789",
          origin: "Puerto de Santos", destination: "Puerto de La Guaira",
          originPort: "BRSSZ", destinationPort: "VELGU",
          status: "En aduana", cargoType: "Perecederos",
          weight: 850.0, containerCount: 3, value: 320000,
          eta: new Date("2025-02-25"), departureDate: new Date("2025-02-15"),
          arrivalDate: new Date("2025-02-24"),
          vesselId: vessels[0].id, clientName: "Alimentos del Trópico S.A.",
          notes: "Productos alimenticios refrigerados - despacho prioritario",
          hsCode: "0304.89", hsDescription: "Pescado congelado, excepto filetes",
          productDescription: "Pescado congelado diverso para consumo humano",
          regulatoryCategory: "Alimento perecedero", subcategory: "Productos del mar",
          incoterm: "CIF", incotermPoint: "La Guaira",
          originCountry: "Brasil", destinationCountry: "Venezuela",
        },
      }),
      db.shipment.create({
        data: {
          reference: "ENV-2025-007", blNumber: "PENDIENTE",
          origin: "Puerto de Valparaíso", destination: "Puerto de Maracaibo",
          originPort: "CLVAP", destinationPort: "VEMAR",
          status: "Con retraso", cargoType: "Granel Líquido",
          weight: 25000.0, containerCount: 0, value: 1800000,
          eta: new Date("2025-02-10"),
          vesselId: null, clientName: "Petroquímica Venezolana S.A.",
          notes: "Retraso por falta de buque disponible - carga de aceites industriales",
          hsCode: "2710.19", hsDescription: "Aceites de petróleo, otros",
          productDescription: "Aceites industriales lubricantes a granel",
          regulatoryCategory: "Químico", hazardClass: "3",
          unNumber: "UN1268", packagingGroup: "III",
          incoterm: "FOB", incotermPoint: "Valparaíso",
          originCountry: "Chile", destinationCountry: "Venezuela",
        },
      }),
      db.shipment.create({
        data: {
          reference: "ENV-2025-008", blNumber: "BL-PVO-2025-44321",
          origin: "Puerto de Panamá", destination: "Puerto de Miami",
          originPort: "PAPAN", destinationPort: "USMIA",
          status: "En tránsito", cargoType: "Contenedorizado",
          weight: 4100.0, containerCount: 6, value: 2100000,
          eta: new Date("2025-03-10"), departureDate: new Date("2025-02-25"),
          vesselId: vessels[2].id, clientName: "Comercializadora Pan-Am S.A.",
          notes: "Mercancía general en tránsito zona libre",
          hsCode: "6110.20", hsDescription: "Suéteres de algodón, de punto",
          productDescription: "Prendas de vestir de algodón para exportación",
          regulatoryCategory: "Textil", incoterm: "FOB",
          incotermPoint: "Panamá", originCountry: "Panamá",
          destinationCountry: "EE.UU.",
        },
      }),
      db.shipment.create({
        data: {
          reference: "ENV-2025-009", blNumber: "PENDIENTE",
          origin: "Puerto de Rotterdam", destination: "Puerto de Puerto Cabello",
          originPort: "NLRTM", destinationPort: "VEPBL",
          status: "Registrado", cargoType: "Carga General",
          weight: 6800.0, containerCount: 5, value: 3900000,
          vesselId: null, clientName: "Euro Import C.A.",
          notes: "Maquinaria industrial y repuestos desde Europa",
          hsCode: "8482.10", hsDescription: "Rodamientos de bolas",
          productDescription: "Rodamientos y partes de maquinaria industrial",
          regulatoryCategory: "Maquinaria", incoterm: "CIF",
          incotermPoint: "Puerto Cabello", originCountry: "Países Bajos",
          destinationCountry: "Venezuela",
        },
      }),
      db.shipment.create({
        data: {
          reference: "ENV-2025-010", blNumber: "BL-AEX-2025-88990",
          origin: "Puerto de Cartagena", destination: "Puerto de Santos",
          originPort: "COCTG", destinationPort: "BRSSZ",
          status: "En documentación", cargoType: "Granel Sólido",
          weight: 22000.0, containerCount: 0, value: 1500000,
          departureDate: new Date("2025-03-12"),
          vesselId: vessels[1].id, clientName: "Carbones de la Costa S.A.S.",
          notes: "Exportación de carbón térmico - permisos ambientales en trámite",
          hsCode: "2701.12", hsDescription: "Carbón bituminoso",
          productDescription: "Carbón térmico bituminoso para generación eléctrica",
          regulatoryCategory: "Mineral", hazardClass: "4.2",
          unNumber: "UN2714", packagingGroup: "III",
          incoterm: "FOB", incotermPoint: "Cartagena",
          originCountry: "Colombia", destinationCountry: "Brasil",
        },
      }),
    ]);

    // ==================== CREATE CREW ASSIGNMENTS ====================
    await Promise.all([
      db.crewAssignment.create({ data: { crewId: crewMembers[0].id, shipmentId: shipments[0].id, role: "Capitán", remarks: "Capitán principal del MV Caribbean Star" } }),
      db.crewAssignment.create({ data: { crewId: crewMembers[3].id, shipmentId: shipments[0].id, role: "Oficial de Cubierta", remarks: "Segundo al mando" } }),
      db.crewAssignment.create({ data: { crewId: crewMembers[1].id, shipmentId: shipments[1].id, role: "Capitán", remarks: "Licencia próxima a vencer" } }),
      db.crewAssignment.create({ data: { crewId: crewMembers[2].id, shipmentId: shipments[2].id, role: "Jefe de Máquinas", remarks: "Asignada al MV Pacífico Voyager" } }),
      db.crewAssignment.create({ data: { crewId: crewMembers[4].id, shipmentId: shipments[4].id, role: "Capitán", remarks: "Envío ya entregado" } }),
      db.crewAssignment.create({ data: { crewId: crewMembers[6].id, shipmentId: shipments[2].id, role: "Jefe de Máquinas", remarks: "Asignación compartida" } }),
      db.crewAssignment.create({ data: { crewId: crewMembers[0].id, shipmentId: shipments[5].id, role: "Capitán", remarks: "Envío en aduana" } }),
      db.crewAssignment.create({ data: { crewId: crewMembers[7].id, shipmentId: shipments[1].id, role: "Oficial de Cubierta", remarks: "Asignación temporal" } }),
    ]);

    // ==================== CREATE PERMITS ====================
    await Promise.all([
      db.permit.create({ data: { type: "Importación", number: "IMP-2025-004512", shipmentId: shipments[0].id, issueDate: new Date("2025-02-10"), expiryDate: new Date("2025-05-10"), status: "Vigente", authority: "SENIAT - Aduana de La Guaira", notes: "Permiso de importación general" } }),
      db.permit.create({ data: { type: "Sanitario", number: "SAN-2025-12783", shipmentId: shipments[0].id, issueDate: new Date("2025-02-05"), expiryDate: new Date("2025-04-05"), status: "Vigente", authority: "Ministerio de Salud", notes: "Certificado sanitario para productos manufacturados" } }),
      db.permit.create({ data: { type: "Exportación", number: "EXP-2025-008923", shipmentId: shipments[1].id, issueDate: new Date("2025-02-20"), expiryDate: new Date("2025-05-20"), status: "Vigente", authority: "SENIAT - Aduana de Puerto Cabello" } }),
      db.permit.create({ data: { type: "Zona Franca", number: "ZF-2025-00345", shipmentId: shipments[1].id, issueDate: null, expiryDate: null, status: "En trámite", authority: "Zona Franca de Cartagena", notes: "En espera de aprobación de la autoridad colombiana" } }),
      db.permit.create({ data: { type: "Importación", number: "IMP-2025-006789", shipmentId: shipments[2].id, issueDate: new Date("2025-01-10"), expiryDate: new Date("2025-04-10"), status: "Vigente", authority: "SENIAT - Aduana de La Guaira" } }),
      db.permit.create({ data: { type: "Fitosanitario", number: "FITO-2025-00456", shipmentId: shipments[2].id, issueDate: new Date("2024-12-15"), expiryDate: new Date("2025-02-15"), status: "Vencido", authority: "INSAI - Instituto Nacional de Salud Agrícola", notes: "Permiso vencido - requiere renovación urgente" } }),
      db.permit.create({ data: { type: "Arma Naval", number: "AN-2025-00078", shipmentId: shipments[2].id, issueDate: new Date("2025-01-08"), expiryDate: new Date("2025-07-08"), status: "Vigente", authority: "Comando Naval de Venezuela" } }),
      db.permit.create({ data: { type: "Exportación", number: "EXP-2025-011234", shipmentId: shipments[3].id, issueDate: null, expiryDate: null, status: "Pendiente", authority: "SENIAT - Aduana de Maracaibo", notes: "Pendiente de presentación de documentos" } }),
      db.permit.create({ data: { type: "Importación", number: "IMP-2025-002345", shipmentId: shipments[4].id, issueDate: new Date("2024-12-20"), expiryDate: new Date("2025-03-20"), status: "Vigente", authority: "SENIAT - Aduana de Puerto Cabello" } }),
      db.permit.create({ data: { type: "Tránsito Aduanero", number: "TA-2025-00567", shipmentId: shipments[4].id, issueDate: new Date("2025-01-03"), expiryDate: new Date("2025-02-03"), status: "Vencido", authority: "SENIAT - Oficina Principal" } }),
      db.permit.create({ data: { type: "Sanitario", number: "SAN-2025-09876", shipmentId: shipments[5].id, issueDate: new Date("2025-02-10"), expiryDate: new Date("2025-03-10"), status: "Vigente", authority: "Ministerio de Salud - INH", notes: "Inspección sanitaria de alimentos perecederos" } }),
      db.permit.create({ data: { type: "Fitosanitario", number: "FITO-2025-00789", shipmentId: shipments[5].id, issueDate: new Date("2025-02-08"), expiryDate: new Date("2025-03-08"), status: "Vigente", authority: "INSAI" } }),
      db.permit.create({ data: { type: "Importación", number: "IMP-2025-009876", shipmentId: shipments[6].id, issueDate: new Date("2025-01-25"), expiryDate: new Date("2025-04-25"), status: "Vigente", authority: "SENIAT - Aduana de Maracaibo" } }),
      db.permit.create({ data: { type: "Sanitario", number: "SAN-2025-05432", shipmentId: shipments[6].id, issueDate: null, expiryDate: null, status: "Pendiente", authority: "Ministerio de Salud", notes: "Requiere inspección antes de emitir" } }),
      db.permit.create({ data: { type: "Exportación", number: "EXP-2025-015678", shipmentId: shipments[7].id, issueDate: new Date("2025-02-20"), expiryDate: new Date("2025-05-20"), status: "Vigente", authority: "Autoridad Aduanera de Panamá" } }),
      db.permit.create({ data: { type: "Tránsito Aduanero", number: "TA-2025-00890", shipmentId: shipments[7].id, issueDate: new Date("2025-02-22"), expiryDate: new Date("2025-04-22"), status: "Vigente", authority: "SENIAT - Aduana Principal" } }),
      db.permit.create({ data: { type: "Importación", number: "IMP-2025-013579", shipmentId: shipments[8].id, issueDate: null, expiryDate: null, status: "Pendiente", authority: "SENIAT - Aduana de Puerto Cabello", notes: "En espera de documentación del proveedor europeo" } }),
      db.permit.create({ data: { type: "Exportación", number: "EXP-2025-024680", shipmentId: shipments[9].id, issueDate: new Date("2025-02-25"), expiryDate: new Date("2025-05-25"), status: "Vigente", authority: "DIAN - Colombia" } }),
      db.permit.create({ data: { type: "Sanitario", number: "SAN-2025-11223", shipmentId: shipments[9].id, issueDate: null, expiryDate: null, status: "En trámite", authority: "INVIMA - Colombia", notes: "Permiso ambiental en proceso de evaluación" } }),
    ]);

    // ==================== CREATE CONTAINERS ====================
    await Promise.all([
      db.container.create({ data: { number: "CRSU-4589231", type: "40' High Cube", shipmentId: shipments[0].id, weight: 780.0, status: "Lleno", sealNumber: "SL-2025-44551", dimensions: "12.19m x 2.44m x 2.90m" } }),
      db.container.create({ data: { number: "CRSU-4589232", type: "40' Estándar", shipmentId: shipments[0].id, weight: 650.0, status: "Lleno", sealNumber: "SL-2025-44552", dimensions: "12.19m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "CRSU-4589233", type: "20' Estándar", shipmentId: shipments[0].id, weight: 820.0, status: "Lleno", sealNumber: "SL-2025-44553", dimensions: "6.06m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "CRSU-4589234", type: "20' Estándar", shipmentId: shipments[0].id, weight: 600.5, status: "Lleno", sealNumber: "SL-2025-44554", dimensions: "6.06m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "PVOU-3215601", type: "40' High Cube", shipmentId: shipments[2].id, weight: 680.0, status: "Lleno", sealNumber: "SL-2025-33201", dimensions: "12.19m x 2.44m x 2.90m" } }),
      db.container.create({ data: { number: "PVOU-3215602", type: "40' High Cube", shipmentId: shipments[2].id, weight: 720.0, status: "Lleno", sealNumber: "SL-2025-33202", dimensions: "12.19m x 2.44m x 2.90m" } }),
      db.container.create({ data: { number: "PVOU-3215603", type: "40' Estándar", shipmentId: shipments[2].id, weight: 590.0, status: "Lleno", sealNumber: "SL-2025-33203", dimensions: "12.19m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "PVOU-3215604", type: "20' Estándar", shipmentId: shipments[2].id, weight: 550.0, status: "Lleno", sealNumber: "SL-2025-33204", dimensions: "6.06m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "PVOU-3215605", type: "20' Estándar", shipmentId: shipments[2].id, weight: 610.0, status: "Lleno", sealNumber: "SL-2025-33205", dimensions: "6.06m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "PVOU-3215606", type: "20' Estándar", shipmentId: shipments[2].id, weight: 480.0, status: "Lleno", sealNumber: "SL-2025-33206", dimensions: "6.06m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "PVOU-3215607", type: "40' High Cube", shipmentId: shipments[2].id, weight: 830.0, status: "Lleno", sealNumber: "SL-2025-33207", dimensions: "12.19m x 2.44m x 2.90m" } }),
      db.container.create({ data: { number: "PVOU-3215608", type: "40' Estándar", shipmentId: shipments[2].id, weight: 740.0, status: "Lleno", sealNumber: "SL-2025-33208", dimensions: "12.19m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "MRBU-8891201", type: "40' Estándar", shipmentId: shipments[3].id, weight: 1600.0, status: "En espera", sealNumber: null, dimensions: "12.19m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "MRBU-8891202", type: "40' Estándar", shipmentId: shipments[3].id, weight: 1600.0, status: "En espera", sealNumber: null, dimensions: "12.19m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "NLTU-1123401", type: "Open Top", shipmentId: shipments[4].id, weight: 7500.0, status: "Descargado", sealNumber: "SL-2025-11001", dimensions: "12.19m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "NLTU-1123402", type: "40' High Cube", shipmentId: shipments[4].id, weight: 6200.0, status: "Descargado", sealNumber: "SL-2025-11002", dimensions: "12.19m x 2.44m x 2.90m" } }),
      db.container.create({ data: { number: "NLTU-1123403", type: "40' Estándar", shipmentId: shipments[4].id, weight: 4800.0, status: "Descargado", sealNumber: "SL-2025-11003", dimensions: "12.19m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "CRSU-5578901", type: "Refrigerado", shipmentId: shipments[5].id, weight: 280.0, status: "En aduana", sealNumber: "SL-2025-55801", dimensions: "6.06m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "CRSU-5578902", type: "Refrigerado", shipmentId: shipments[5].id, weight: 310.0, status: "En aduana", sealNumber: "SL-2025-55802", dimensions: "6.06m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "CRSU-5578903", type: "Refrigerado", shipmentId: shipments[5].id, weight: 260.0, status: "En aduana", sealNumber: "SL-2025-55803", dimensions: "6.06m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "PVOU-4432101", type: "40' High Cube", shipmentId: shipments[7].id, weight: 700.0, status: "Lleno", sealNumber: "SL-2025-44301", dimensions: "12.19m x 2.44m x 2.90m" } }),
      db.container.create({ data: { number: "PVOU-4432102", type: "40' Estándar", shipmentId: shipments[7].id, weight: 650.0, status: "Lleno", sealNumber: "SL-2025-44302", dimensions: "12.19m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "PVOU-4432103", type: "20' Estándar", shipmentId: shipments[7].id, weight: 580.0, status: "Lleno", sealNumber: "SL-2025-44303", dimensions: "6.06m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "PVOU-4432104", type: "20' Estándar", shipmentId: shipments[7].id, weight: 620.0, status: "Lleno", sealNumber: "SL-2025-44304", dimensions: "6.06m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "PVOU-4432105", type: "40' High Cube", shipmentId: shipments[7].id, weight: 770.0, status: "Lleno", sealNumber: "SL-2025-44305", dimensions: "12.19m x 2.44m x 2.90m" } }),
      db.container.create({ data: { number: "PVOU-4432106", type: "40' Estándar", shipmentId: shipments[7].id, weight: 780.0, status: "Lleno", sealNumber: "SL-2025-44306", dimensions: "12.19m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "RTMU-9987701", type: "40' High Cube", shipmentId: shipments[8].id, weight: 1400.0, status: "En espera", sealNumber: null, dimensions: "12.19m x 2.44m x 2.90m" } }),
      db.container.create({ data: { number: "RTMU-9987702", type: "Open Top", shipmentId: shipments[8].id, weight: 1800.0, status: "En espera", sealNumber: null, dimensions: "12.19m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "RTMU-9987703", type: "40' Estándar", shipmentId: shipments[8].id, weight: 1200.0, status: "En espera", sealNumber: null, dimensions: "12.19m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "RTMU-9987704", type: "40' Estándar", shipmentId: shipments[8].id, weight: 1100.0, status: "En espera", sealNumber: null, dimensions: "12.19m x 2.44m x 2.59m" } }),
      db.container.create({ data: { number: "RTMU-9987705", type: "20' Estándar", shipmentId: shipments[8].id, weight: 1300.0, status: "En espera", sealNumber: null, dimensions: "6.06m x 2.44m x 2.59m" } }),
    ]);

    // ==================== CREATE DOCUMENTS (EXPANDED) ====================
    await Promise.all([
      // Shipment 1
      db.document.create({ data: { name: "Conocimiento de Embarque ENV-2025-001", type: "BL", shipmentId: shipments[0].id, uploadDate: new Date("2025-02-18"), status: "Vigente", fileSize: "2.4 MB", category: "Transporte", documentSubtype: "Bill of Lading Original", issuingAuthority: "Naviera Caribe S.A.", documentNumber: "BL-CRS-2025-45892" } }),
      db.document.create({ data: { name: "Factura Comercial - Importadora del Caribe", type: "Factura Comercial", shipmentId: shipments[0].id, uploadDate: new Date("2025-02-15"), status: "Vigente", fileSize: "1.8 MB", category: "Comercial", documentSubtype: "Factura Definitiva" } }),
      db.document.create({ data: { name: "Póliza de Seguro ENV-2025-001", type: "Póliza de Seguro", shipmentId: shipments[0].id, uploadDate: new Date("2025-02-16"), expiryDate: new Date("2025-08-16"), status: "Vigente", fileSize: "3.1 MB", category: "Seguro", documentSubtype: "Certificate of Insurance" } }),
      db.document.create({ data: { name: "Lista de Empaque ENV-2025-001", type: "Lista de Empaque", shipmentId: shipments[0].id, uploadDate: new Date("2025-02-17"), status: "Vigente", fileSize: "1.2 MB", category: "Aduana" } }),
      db.document.create({ data: { name: "Certificado de Origen EUR.1", type: "Certificado de Origen", shipmentId: shipments[0].id, uploadDate: new Date("2025-02-14"), status: "Vigente", fileSize: "0.9 MB", category: "Regulatorio", documentSubtype: "EUR.1", isVerified: true } }),
      // Shipment 2
      db.document.create({ data: { name: "Conocimiento de Embarque ENV-2025-002", type: "BL", shipmentId: shipments[1].id, uploadDate: new Date("2025-03-01"), status: "En trámite", fileSize: "2.1 MB", category: "Transporte", documentSubtype: "Bill of Lading Original" } }),
      db.document.create({ data: { name: "Factura Comercial - Distribuidora Andina", type: "Factura Comercial", shipmentId: shipments[1].id, uploadDate: new Date("2025-02-25"), status: "Vigente", fileSize: "1.5 MB", category: "Comercial" } }),
      db.document.create({ data: { name: "Certificado de Origen ENV-2025-002", type: "Certificado de Origen", shipmentId: shipments[1].id, uploadDate: new Date("2025-02-26"), status: "Vigente", fileSize: "0.8 MB", category: "Aduana" } }),
      db.document.create({ data: { name: "Manifiesto de Carga ENV-2025-002", type: "Manifiesto de Carga", shipmentId: shipments[1].id, uploadDate: new Date("2025-02-27"), status: "Vigente", fileSize: "4.2 MB", category: "Transporte", documentSubtype: "Cargo Manifest" } }),
      // Shipment 3
      db.document.create({ data: { name: "Conocimiento de Embarque ENV-2025-003", type: "BL", shipmentId: shipments[2].id, uploadDate: new Date("2025-01-14"), status: "Vigente", fileSize: "2.6 MB", category: "Transporte", documentSubtype: "Bill of Lading Original" } }),
      db.document.create({ data: { name: "Factura Comercial - Tecnología Oriental", type: "Factura Comercial", shipmentId: shipments[2].id, uploadDate: new Date("2025-01-10"), status: "Vigente", fileSize: "2.3 MB", category: "Comercial" } }),
      db.document.create({ data: { name: "Declaración Aduanera ENV-2025-003", type: "Declaración Aduanera", shipmentId: shipments[2].id, uploadDate: new Date("2025-02-28"), status: "Vigente", fileSize: "4.5 MB", category: "Aduana" } }),
      db.document.create({ data: { name: "Certificado Fitosanitario ENV-2025-003", type: "Certificado Fitosanitario", shipmentId: shipments[2].id, uploadDate: new Date("2024-12-15"), expiryDate: new Date("2025-02-15"), status: "Vencido", fileSize: "1.1 MB", category: "Sanitario", issuingAuthority: "INSAI" } }),
      db.document.create({ data: { name: "Registro FDA - Equipos Electrónicos", type: "Registro FDA", shipmentId: shipments[2].id, uploadDate: new Date("2025-01-05"), expiryDate: new Date("2025-12-31"), status: "Vigente", fileSize: "1.5 MB", category: "Regulatorio", documentSubtype: "FDA Registration", isVerified: true } }),
      // Shipment 4 - Café
      db.document.create({ data: { name: "Factura Comercial - Exportadora Zuliana", type: "Factura Comercial", shipmentId: shipments[3].id, uploadDate: new Date("2025-02-28"), status: "Pendiente", fileSize: "0.9 MB", category: "Comercial" } }),
      db.document.create({ data: { name: "Lista de Empaque ENV-2025-004", type: "Lista de Empaque", shipmentId: shipments[3].id, uploadDate: new Date("2025-02-28"), status: "Pendiente", fileSize: "0.7 MB", category: "Aduana" } }),
      db.document.create({ data: { name: "Certificado Fitosanitario - Café Verde", type: "Certificado Fitosanitario", shipmentId: shipments[3].id, uploadDate: new Date("2025-02-20"), expiryDate: new Date("2025-05-20"), status: "Vigente", fileSize: "1.3 MB", category: "Sanitario", documentSubtype: "Phytosanitary Certificate", issuingAuthority: "INSAI" } }),
      db.document.create({ data: { name: "Certificado de Libre Venta - Café", type: "Certificado Libre Venta", shipmentId: shipments[3].id, uploadDate: new Date("2025-02-18"), expiryDate: new Date("2025-08-18"), status: "Vigente", fileSize: "0.8 MB", category: "Regulatorio", documentSubtype: "Certificate of Free Sale" } }),
      db.document.create({ data: { name: "Certificado Orgánico - Café Excelso", type: "Certificado Orgánico", shipmentId: shipments[3].id, uploadDate: new Date("2025-02-15"), expiryDate: new Date("2025-12-31"), status: "Vigente", fileSize: "1.1 MB", category: "Regulatorio", documentSubtype: "USDA Organic", isVerified: true } }),
      db.document.create({ data: { name: "EUDR Due Diligence Statement", type: "EUDR", shipmentId: shipments[3].id, uploadDate: new Date("2025-02-22"), status: "En trámite", fileSize: "2.0 MB", category: "Regulatorio", documentSubtype: "EUDR Due Diligence Statement" } }),
      db.document.create({ data: { name: "Análisis de Residuos de Pesticidas", type: "Certificado de Análisis", shipmentId: shipments[3].id, uploadDate: new Date("2025-02-10"), expiryDate: new Date("2025-08-10"), status: "Vigente", fileSize: "1.4 MB", category: "Sanitario", documentSubtype: "Lab Analysis - Pesticide Residues" } }),
      // Shipment 5
      db.document.create({ data: { name: "Conocimiento de Embarque ENV-2025-005", type: "BL", shipmentId: shipments[4].id, uploadDate: new Date("2025-01-04"), status: "Vigente", fileSize: "2.2 MB", category: "Transporte" } }),
      db.document.create({ data: { name: "Factura Comercial - Inversiones Petroleras", type: "Factura Comercial", shipmentId: shipments[4].id, uploadDate: new Date("2025-01-02"), status: "Vigente", fileSize: "3.4 MB", category: "Comercial" } }),
      db.document.create({ data: { name: "Seguro de Carga ENV-2025-005", type: "Seguro", shipmentId: shipments[4].id, uploadDate: new Date("2025-01-03"), expiryDate: new Date("2025-07-03"), status: "Vigente", fileSize: "2.8 MB", category: "Seguro" } }),
      db.document.create({ data: { name: "Declaración Aduanera ENV-2025-005", type: "Declaración Aduanera", shipmentId: shipments[4].id, uploadDate: new Date("2025-01-19"), status: "Vigente", fileSize: "5.1 MB", category: "Aduana" } }),
      db.document.create({ data: { name: "Carta de Crédito L/C-2025-4455", type: "Carta de Crédito", shipmentId: shipments[4].id, uploadDate: new Date("2024-12-28"), status: "Vigente", fileSize: "1.8 MB", category: "Comercial", documentSubtype: "Letter of Credit" } }),
      // Shipment 6
      db.document.create({ data: { name: "Conocimiento de Embarque ENV-2025-006", type: "BL", shipmentId: shipments[5].id, uploadDate: new Date("2025-02-14"), status: "Vigente", fileSize: "1.9 MB", category: "Transporte" } }),
      db.document.create({ data: { name: "Certificado Fitosanitario ENV-2025-006", type: "Certificado Fitosanitario", shipmentId: shipments[5].id, uploadDate: new Date("2025-02-08"), expiryDate: new Date("2025-03-08"), status: "Vigente", fileSize: "1.0 MB", category: "Sanitario", issuingAuthority: "INSAI" } }),
      db.document.create({ data: { name: "Factura Comercial - Alimentos del Trópico", type: "Factura Comercial", shipmentId: shipments[5].id, uploadDate: new Date("2025-02-10"), status: "Vigente", fileSize: "1.3 MB", category: "Comercial" } }),
      db.document.create({ data: { name: "Certificado Zoosanitario - Pescado", type: "Certificado Zoosanitario", shipmentId: shipments[5].id, uploadDate: new Date("2025-02-09"), expiryDate: new Date("2025-04-09"), status: "Vigente", fileSize: "1.2 MB", category: "Sanitario", documentSubtype: "Zoosanitary Certificate", issuingAuthority: "INSAI" } }),
      db.document.create({ data: { name: "Prior Notice FDA", type: "Prior Notice FDA", shipmentId: shipments[5].id, uploadDate: new Date("2025-02-13"), status: "Vigente", fileSize: "0.6 MB", category: "Regulatorio", documentSubtype: "FDA Prior Notice", isVerified: true } }),
      // Shipment 7
      db.document.create({ data: { name: "Factura Comercial - Petroquímica Venezolana", type: "Factura Comercial", shipmentId: shipments[6].id, uploadDate: new Date("2025-01-20"), status: "Vigente", fileSize: "1.7 MB", category: "Comercial" } }),
      db.document.create({ data: { name: "Certificado de Origen ENV-2025-007", type: "Certificado de Origen", shipmentId: shipments[6].id, uploadDate: new Date("2025-01-22"), expiryDate: new Date("2025-02-01"), status: "Vencido", fileSize: "0.6 MB", category: "Aduana" } }),
      db.document.create({ data: { name: "Póliza de Seguro ENV-2025-007", type: "Póliza de Seguro", shipmentId: shipments[6].id, uploadDate: new Date("2025-01-18"), expiryDate: new Date("2025-04-18"), status: "Vigente", fileSize: "2.5 MB", category: "Seguro" } }),
      db.document.create({ data: { name: "REACH Registration - Aceites", type: "REACH", shipmentId: shipments[6].id, uploadDate: new Date("2025-01-15"), status: "En trámite", fileSize: "3.2 MB", category: "Regulatorio", documentSubtype: "REACH Registration", issuingAuthority: "ECHA" } }),
      // Shipment 8
      db.document.create({ data: { name: "Conocimiento de Embarque ENV-2025-008", type: "BL", shipmentId: shipments[7].id, uploadDate: new Date("2025-02-24"), status: "Vigente", fileSize: "2.0 MB", category: "Transporte" } }),
      db.document.create({ data: { name: "Factura Comercial - Comercializadora Pan-Am", type: "Factura Comercial", shipmentId: shipments[7].id, uploadDate: new Date("2025-02-22"), status: "Vigente", fileSize: "2.1 MB", category: "Comercial" } }),
      db.document.create({ data: { name: "Declaración Aduanera ENV-2025-008", type: "Declaración Aduanera", shipmentId: shipments[7].id, uploadDate: new Date("2025-02-25"), status: "En trámite", fileSize: "3.8 MB", category: "Aduana" } }),
      db.document.create({ data: { name: "Lista de Empaque ENV-2025-008", type: "Lista de Empaque", shipmentId: shipments[7].id, uploadDate: new Date("2025-02-23"), status: "Vigente", fileSize: "1.0 MB", category: "Aduana" } }),
      db.document.create({ data: { name: "Lacey Act Declaration", type: "Lacey Act", shipmentId: shipments[7].id, uploadDate: new Date("2025-02-21"), status: "Vigente", fileSize: "0.7 MB", category: "Regulatorio", documentSubtype: "Lacey Act Declaration" } }),
      // Shipment 9
      db.document.create({ data: { name: "Factura Proforma - Euro Import", type: "Factura Proforma", shipmentId: shipments[8].id, uploadDate: new Date("2025-02-15"), status: "Vigente", fileSize: "1.1 MB", category: "Comercial", documentSubtype: "Proforma Invoice" } }),
      db.document.create({ data: { name: "Garantía Bancaria BG-2025-789", type: "Garantía Bancaria", shipmentId: shipments[8].id, uploadDate: new Date("2025-02-10"), expiryDate: new Date("2025-08-10"), status: "Vigente", fileSize: "1.5 MB", category: "Comercial", documentSubtype: "Standby L/C" } }),
      // Shipment 10
      db.document.create({ data: { name: "Conocimiento de Embarque ENV-2025-010", type: "BL", shipmentId: shipments[9].id, uploadDate: new Date("2025-03-01"), status: "En trámite", fileSize: "2.3 MB", category: "Transporte" } }),
      db.document.create({ data: { name: "Certificado de BPM - Minería", type: "Certificado BPM", shipmentId: shipments[9].id, uploadDate: new Date("2025-02-20"), expiryDate: new Date("2025-08-20"), status: "Vigente", fileSize: "1.0 MB", category: "Regulatorio", documentSubtype: "Good Manufacturing Practice", issuingAuthority: "MINMINAS Colombia" } }),
      db.document.create({ data: { name: "CBAM Report - Carbón Térmico", type: "CBAM", shipmentId: shipments[9].id, uploadDate: new Date("2025-02-18"), status: "En trámite", fileSize: "2.8 MB", category: "Regulatorio", documentSubtype: "Carbon Border Adjustment Mechanism Report", issuingAuthority: "EU Commission" } }),
    ]);

    // ==================== CREATE CARGO DETAILS ====================
    await Promise.all([
      db.cargoDetail.create({
        data: {
          shipmentId: shipments[3].id,
          description: "Café arábica verde, tipo Excelso",
          hsCode: "0901.11.00", hsDescription: "Café, sin tostar, sin descafeinar",
          category: "Alimento agrícola", subcategory: "Café verde",
          grossWeight: 3200.0, netWeight: 3000.0, weightUnit: "kg",
          volume: 45.5, packageCount: 150, packagingType: "Sacos de yute (60kg)",
          storageTemp: "15-25°C", storageHumidity: "< 60%",
          originCountry: "Venezuela", originRegion: "Zulia",
          originMunicipality: "Municipio Perijá",
          originGpsLat: 10.3667, originGpsLng: -72.5667,
          productionDate: new Date("2025-01-15"), batchNumber: "LOT-CAFE-2025-001",
          destinationCountry: "Panamá", incoterm: "FOB", incotermPoint: "Maracaibo",
        },
      }),
      db.cargoDetail.create({
        data: {
          shipmentId: shipments[5].id,
          description: "Pescado congelado diverso para consumo humano",
          hsCode: "0304.89", hsDescription: "Pescado congelado, excepto filetes",
          category: "Alimento perecedero", subcategory: "Productos del mar",
          grossWeight: 850.0, netWeight: 780.0, weightUnit: "kg",
          volume: 12.3, packageCount: 3, packagingType: "Contenedor refrigerado",
          storageTemp: "-18°C", storageHumidity: "< 80%",
          originCountry: "Brasil", originRegion: "São Paulo",
          destinationCountry: "Venezuela", incoterm: "CIF", incotermPoint: "La Guaira",
        },
      }),
      db.cargoDetail.create({
        data: {
          shipmentId: shipments[6].id,
          description: "Aceites industriales lubricantes a granel",
          hsCode: "2710.19", hsDescription: "Aceites de petróleo, otros",
          category: "Químico", subcategory: "Aceites industriales",
          grossWeight: 25000.0, netWeight: 24500.0, weightUnit: "kg",
          volume: 28.5, packagingType: "Tanque ISO",
          hazardClass: "3", unNumber: "UN1268", packagingGroup: "III",
          storageTemp: "Ambiente",
          originCountry: "Chile", originRegion: "Valparaíso",
          destinationCountry: "Venezuela", incoterm: "FOB", incotermPoint: "Valparaíso",
        },
      }),
      db.cargoDetail.create({
        data: {
          shipmentId: shipments[9].id,
          description: "Carbón térmico bituminoso para generación eléctrica",
          hsCode: "2701.12", hsDescription: "Carbón bituminoso",
          category: "Mineral", subcategory: "Carbón térmico",
          grossWeight: 22000.0, netWeight: 21800.0, weightUnit: "ton",
          volume: 32.0, packagingType: "Granel suelto",
          hazardClass: "4.2", unNumber: "UN2714", packagingGroup: "III",
          originCountry: "Colombia", originRegion: "Cesar",
          originMunicipality: "La Jagua de Ibirico",
          originGpsLat: 7.5167, originGpsLng: -73.3333,
          productionDate: new Date("2025-02-01"), batchNumber: "LOT-CARBON-2025-010",
          destinationCountry: "Brasil", incoterm: "FOB", incotermPoint: "Cartagena",
        },
      }),
    ]);

    // ==================== CREATE CHAIN OF CUSTODY ====================
    await Promise.all([
      // Shipment 4 (Café) chain
      db.chainOfCustody.create({ data: { shipmentId: shipments[3].id, stage: "Productor", fromParty: "Finca El Paraíso", toParty: "Cooperativa Cafetalera del Zulia", transferDate: new Date("2025-01-20"), responsiblePerson: "Sr. Juan Pérez", conditionsVerified: JSON.stringify([{ condition: "Temperatura", verified: true }, { condition: "Sellos intactos", verified: true }]), temperature: 22.5, sealsIntact: true, status: "Completado" } }),
      db.chainOfCustody.create({ data: { shipmentId: shipments[3].id, stage: "Acopio", fromParty: "Cooperativa Cafetalera del Zulia", toParty: "Exportadora Zuliana S.A.", transferDate: new Date("2025-01-25"), responsiblePerson: "Sra. Ana Gómez", conditionsVerified: JSON.stringify([{ condition: "Temperatura", verified: true }, { condition: "Humedad", verified: true }]), temperature: 20.0, sealsIntact: true, status: "Completado" } }),
      db.chainOfCustody.create({ data: { shipmentId: shipments[3].id, stage: "Exportador", fromParty: "Exportadora Zuliana S.A.", toParty: "Agente de carga Maracaibo", transferDate: new Date("2025-02-01"), responsiblePerson: "Sr. Carlos Mendoza", conditionsVerified: JSON.stringify([{ condition: "Certificaciones vigentes", verified: true }, { condition: "Empaque intacto", verified: true }]), temperature: 18.0, sealsIntact: true, status: "Completado" } }),
      db.chainOfCustody.create({ data: { shipmentId: shipments[3].id, stage: "Agente de carga", fromParty: "Agente de carga Maracaibo", toParty: "Naviera (pendiente)", transferDate: new Date("2025-02-10"), responsiblePerson: "Sr. Luis Torres", conditionsVerified: JSON.stringify([{ condition: "Documentación completa", verified: false }, { condition: "Sellos intactos", verified: true }]), sealsIntact: true, notes: "Documentación de exportación pendiente", status: "En proceso" } }),
      // Shipment 6 (Pescado) chain
      db.chainOfCustody.create({ data: { shipmentId: shipments[5].id, stage: "Productor", fromParty: "Pesquera Atlántica Ltd.", toParty: "Agente de carga Santos", transferDate: new Date("2025-02-10"), responsiblePerson: "Sr. Roberto Silva", conditionsVerified: JSON.stringify([{ condition: "Cadena de frío", verified: true }, { condition: "Sellos intactos", verified: true }]), temperature: -18.0, sealsIntact: true, status: "Completado" } }),
      db.chainOfCustody.create({ data: { shipmentId: shipments[5].id, stage: "Agente de carga", fromParty: "Agente de carga Santos", toParty: "Naviera Caribe S.A.", transferDate: new Date("2025-02-12"), responsiblePerson: "Sra. Fernanda Lima", conditionsVerified: JSON.stringify([{ condition: "Cadena de frío", verified: true }, { condition: "Certificado sanitario", verified: true }]), temperature: -18.0, sealsIntact: true, status: "Completado" } }),
      db.chainOfCustody.create({ data: { shipmentId: shipments[5].id, stage: "Naviera", fromParty: "Naviera Caribe S.A.", toParty: "Agente en destino", transferDate: new Date("2025-02-24"), responsiblePerson: "Cap. Carlos Mendoza", conditionsVerified: JSON.stringify([{ condition: "Cadena de frío", verified: true }, { condition: "Sellos intactos", verified: true }]), temperature: -17.5, sealsIntact: true, status: "Completado" } }),
      db.chainOfCustody.create({ data: { shipmentId: shipments[5].id, stage: "Agente destino", fromParty: "Agente en destino La Guaira", toParty: "Alimentos del Trópico S.A.", transferDate: new Date("2025-02-25"), responsiblePerson: "Sr. Miguel Andrade", conditionsVerified: JSON.stringify([{ condition: "Cadena de frío", verified: false }, { condition: "Sellos intactos", verified: true }]), temperature: -15.0, sealsIntact: true, notes: "Temperatura ligeramente elevada, en inspección aduanera", status: "En proceso" } }),
      // Shipment 1 chain
      db.chainOfCustody.create({ data: { shipmentId: shipments[0].id, stage: "Exportador", fromParty: "Importadora del Caribe C.A.", toParty: "Naviera Caribe S.A.", transferDate: new Date("2025-02-18"), responsiblePerson: "Sra. Carmen Ruiz", conditionsVerified: JSON.stringify([{ condition: "Documentación completa", verified: true }, { condition: "Empaque intacto", verified: true }]), sealsIntact: true, status: "Completado" } }),
      db.chainOfCustody.create({ data: { shipmentId: shipments[0].id, stage: "Naviera", fromParty: "Naviera Caribe S.A.", toParty: "Agente en destino Rotterdam", transferDate: new Date("2025-02-20"), responsiblePerson: "Cap. Carlos Mendoza", conditionsVerified: JSON.stringify([{ condition: "Contenedores sellados", verified: true }, { condition: "Documentación embarque", verified: true }]), sealsIntact: true, status: "Completado" } }),
    ]);

    // ==================== CREATE CLAIMS ====================
    await Promise.all([
      db.claim.create({
        data: {
          shipmentId: shipments[6].id,
          type: "Retraso",
          reason: "Falta de buque disponible para carga de aceites industriales. Demora de más de 30 días sobre ETA original.",
          customsRejection: false, incidentCost: 45000,
          lessonsLearned: "Mantener opciones de naviera alternativas para cargas IMDG. Programar con mayor anticipación.",
          status: "Abierto", reportedDate: new Date("2025-02-15"),
          reportedBy: "Pedroquímica Venezolana S.A.",
          destinationCountry: "Venezuela",
          notes: "Se han contactado 3 navieras alternativas sin disponibilidad en el plazo requerido.",
        },
      }),
      db.claim.create({
        data: {
          shipmentId: shipments[2].id,
          type: "Documentación incompleta",
          reason: "Certificado fitosanitario vencido al momento de llegada. Aduana retuvo mercancía por 5 días.",
          customsRejection: false, incidentCost: 12500,
          lessonsLearned: "Implementar alerta automática 30 días antes del vencimiento de certificados fitosanitarios.",
          status: "Resuelto", reportedDate: new Date("2025-02-28"),
          resolvedDate: new Date("2025-03-05"),
          resolution: "Certificado renovado vía urgente. Mercancía liberada tras pagar multa de almacenaje.",
          reportedBy: "Tecnología Oriental C.A.",
          destinationCountry: "Venezuela",
          regulatoryChange: false,
        },
      }),
      db.claim.create({
        data: {
          shipmentId: shipments[5].id,
          type: "Contaminación",
          reason: "Posible ruptura de cadena de frío detectada en inspección aduanera. Temperatura registrada de -15°C vs -18°C requerido.",
          customsRejection: true, incidentCost: 85000,
          lessonsLearned: "Requerir monitoreo de temperatura en tiempo real con dataloggers en contenedores refrigerados.",
          status: "En investigación", reportedDate: new Date("2025-02-25"),
          reportedBy: "SENIAT - Aduana de La Guaira",
          destinationCountry: "Venezuela",
        },
      }),
      db.claim.create({
        data: {
          shipmentId: shipments[6].id,
          type: "Rechazo en aduana",
          reason: "Permiso sanitario pendiente de emisión. Aduana no permite importación de aceites sin certificación sanitaria vigente.",
          customsRejection: true, incidentCost: 32000,
          lessonsLearned: "No iniciar trámites de embarque sin todos los permisos sanitarios aprobados.",
          status: "Abierto", reportedDate: new Date("2025-02-20"),
          reportedBy: "Petroquímica Venezolana S.A.",
          destinationCountry: "Venezuela",
          regulatoryChange: true,
          notes: "Normativa sanitaria para importación de aceites industriales cambió en enero 2025.",
        },
      }),
    ]);

    // ==================== CREATE COUNTRY REQUIREMENTS ====================
    await Promise.all([
      // Coffee (Alimento agrícola) requirements
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "EE.UU.", requirementName: "Certificado fitosanitario", isMandatory: true, maxResidueLevel: "10 ppm", localLanguageLabel: "Phytosanitary Certificate", regulation: "7 CFR 319" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "EE.UU.", requirementName: "FDA Prior Notice", isMandatory: true, localLanguageLabel: "Prior Notice", regulation: "Bioterrorism Act" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "EE.UU.", requirementName: "Etiquetado en inglés", isMandatory: false, maxResidueLevel: null, localLanguageLabel: "English Labeling", regulation: "FD&C Act" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "Unión Europea", requirementName: "Certificado fitosanitario", isMandatory: true, maxResidueLevel: "5 ppm", localLanguageLabel: "Certificat Phytosanitaire", regulation: "Reg. 2019/2072" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "Unión Europea", requirementName: "EUDR Due Diligence", isMandatory: true, localLanguageLabel: "EUDR Erklärung", regulation: "Reg. 2023/1115" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "Unión Europea", requirementName: "Etiquetado en idioma local", isMandatory: true, localLanguageLabel: "24 idiomas oficiales", regulation: "Reg. 1169/2011" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "China", requirementName: "Certificado fitosanitario", isMandatory: true, maxResidueLevel: "8 ppm", localLanguageLabel: "植物检疫证书", regulation: "AQSIQ Order 177" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "China", requirementName: "Registro GACC", isMandatory: true, localLanguageLabel: "GACC注册", regulation: "GACC Decree 248" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "Japón", requirementName: "Certificado fitosanitario", isMandatory: true, maxResidueLevel: "3 ppm", localLanguageLabel: "植物検疫証明書", regulation: "Plant Protection Act" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "Japón", requirementName: "Etiquetado en japonés", isMandatory: true, localLanguageLabel: "日本語表示", regulation: "Food Labeling Act" } }),
      // Chemical requirements
      db.countryRequirement.create({ data: { productCategory: "Químico", country: "EE.UU.", requirementName: "TSCA Compliance", isMandatory: true, localLanguageLabel: "TSCA", regulation: "Toxic Substances Control Act" } }),
      db.countryRequirement.create({ data: { productCategory: "Químico", country: "Unión Europea", requirementName: "REACH Registration", isMandatory: true, localLanguageLabel: "REACH Registrierung", regulation: "Reg. 1907/2006" } }),
      db.countryRequirement.create({ data: { productCategory: "Químico", country: "Unión Europea", requirementName: "Ficha de Seguridad (SDS)", isMandatory: true, localLanguageLabel: "Sicherheitsdatenblatt", regulation: "Reg. 2020/878" } }),
      db.countryRequirement.create({ data: { productCategory: "Químico", country: "China", requirementName: "REACH China", isMandatory: true, localLanguageLabel: "中国REACH", regulation: "MEP Order 12" } }),
      // Mineral requirements
      db.countryRequirement.create({ data: { productCategory: "Mineral", country: "Unión Europea", requirementName: "CBAM Report", isMandatory: true, localLanguageLabel: "CBAM Bericht", regulation: "Reg. 2023/956" } }),
      db.countryRequirement.create({ data: { productCategory: "Mineral", country: "Unión Europea", requirementName: "Certificado de Origen", isMandatory: true, localLanguageLabel: "Ursprungszeugnis", regulation: "Customs Code" } }),
      db.countryRequirement.create({ data: { productCategory: "Mineral", country: "China", requirementName: "Cuarentena de importación", isMandatory: true, localLanguageLabel: "进口检疫", regulation: "AQSIQ Order 118" } }),
      // Textil requirements
      db.countryRequirement.create({ data: { productCategory: "Textil", country: "EE.UU.", requirementName: "Declaración de origen", isMandatory: true, localLanguageLabel: "Country of Origin Declaration", regulation: "19 CFR 134" } }),
      db.countryRequirement.create({ data: { productCategory: "Textil", country: "Unión Europea", requirementName: "Etiquetado en idioma local", isMandatory: true, localLanguageLabel: "Textilkennzeichnung", regulation: "Reg. 1007/2011" } }),
      db.countryRequirement.create({ data: { productCategory: "Textil", country: "Unión Europea", requirementName: "REACH Sustancias restringidas", isMandatory: true, localLanguageLabel: "REACH Anhang XVII", regulation: "Reg. 1907/2006" } }),
      // Maquinaria
      db.countryRequirement.create({ data: { productCategory: "Maquinaria", country: "Unión Europea", requirementName: "Marcado CE", isMandatory: true, localLanguageLabel: "CE-Kennzeichnung", regulation: "Dir. 2006/42/EC" } }),
      db.countryRequirement.create({ data: { productCategory: "Maquinaria", country: "EE.UU.", requirementName: "Certificación OSHA", isMandatory: true, localLanguageLabel: "OSHA Compliance", regulation: "29 CFR 1910" } }),
      db.countryRequirement.create({ data: { productCategory: "Maquinaria", country: "China", requirementName: "Certificación CCC", isMandatory: true, localLanguageLabel: "CCC认证", regulation: "CCC Certification System" } }),
      db.countryRequirement.create({ data: { productCategory: "Maquinaria", country: "Japón", requirementName: "Marcado PSE", isMandatory: true, localLanguageLabel: "PSEマーク", regulation: "Electrical Appliances Safety Act" } }),
      // Producto forestal requirements
      db.countryRequirement.create({ data: { productCategory: "Producto forestal", country: "EE.UU.", requirementName: "Lacey Act Declaration", isMandatory: true, localLanguageLabel: "Lacey Act Declaration", regulation: "Lacey Act 2008" } }),
      db.countryRequirement.create({ data: { productCategory: "Producto forestal", country: "Unión Europea", requirementName: "EUDR Due Diligence", isMandatory: true, localLanguageLabel: "EUDR Erklärung", regulation: "Reg. 2023/1115" } }),
      db.countryRequirement.create({ data: { productCategory: "Producto forestal", country: "Unión Europea", requirementName: "Certificado FLEGT", isMandatory: false, localLanguageLabel: "FLEGT-Lizenz", regulation: "Reg. 2173/2005" } }),
      db.countryRequirement.create({ data: { productCategory: "Producto forestal", country: "China", requirementName: "Certificado de tratamiento fitosanitario", isMandatory: true, localLanguageLabel: "植物处理证书", regulation: "AQSIQ Order 84" } }),
      db.countryRequirement.create({ data: { productCategory: "Producto forestal", country: "Japón", requirementName: "Inspección de plagas", isMandatory: true, localLanguageLabel: "害虫検査", regulation: "Plant Protection Act" } }),
      // Electrónica requirements
      db.countryRequirement.create({ data: { productCategory: "Electrónica", country: "EE.UU.", requirementName: "Certificación FCC", isMandatory: true, localLanguageLabel: "FCC Certification", regulation: "47 CFR Part 15" } }),
      db.countryRequirement.create({ data: { productCategory: "Electrónica", country: "Unión Europea", requirementName: "Marcado CE", isMandatory: true, localLanguageLabel: "CE-Kennzeichnung", regulation: "Dir. 2014/53/EU" } }),
      db.countryRequirement.create({ data: { productCategory: "Electrónica", country: "Unión Europea", requirementName: "RoHS Compliance", isMandatory: true, localLanguageLabel: "RoHS Konformität", regulation: "Dir. 2011/65/EU" } }),
      db.countryRequirement.create({ data: { productCategory: "Electrónica", country: "China", requirementName: "Certificación CCC", isMandatory: true, localLanguageLabel: "CCC认证", regulation: "CCC Certification System" } }),
      db.countryRequirement.create({ data: { productCategory: "Electrónica", country: "Japón", requirementName: "Marcado PSE", isMandatory: true, localLanguageLabel: "PSEマーク", regulation: "DENAN Act" } }),
      db.countryRequirement.create({ data: { productCategory: "Electrónica", country: "Japón", requirementName: "Etiquetado JIS", isMandatory: false, localLanguageLabel: "JIS表示", regulation: "JIS Mark System" } }),
      // Additional countries for existing categories
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "Brasil", requirementName: "Certificado fitosanitario", isMandatory: true, maxResidueLevel: "7 ppm", localLanguageLabel: "Certificado Fitosanitário", regulation: "Instrução Normativa 36" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "Brasil", requirementName: "Registro ANVISA", isMandatory: true, localLanguageLabel: "Registro ANVISA", regulation: "RDC 27/2010" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "Colombia", requirementName: "Certificado fitosanitario", isMandatory: true, maxResidueLevel: "6 ppm", localLanguageLabel: "Certificado Fitosanitario", regulation: "Resolución ICA 3169" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "Canadá", requirementName: "Certificado fitosanitario", isMandatory: true, maxResidueLevel: "10 ppm", localLanguageLabel: "Phytosanitary Certificate", regulation: "Plant Protection Act" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "Canadá", requirementName: "Etiquetado CFIA", isMandatory: true, localLanguageLabel: "CFIA Labelling", regulation: "Safe Food for Canadians Act" } }),
      db.countryRequirement.create({ data: { productCategory: "Alimento agrícola", country: "Australia", requirementName: "Certificado fitosanitario", isMandatory: true, maxResidueLevel: "4 ppm", localLanguageLabel: "Phytosanitary Certificate", regulation: "Biosecurity Act 2015" } }),
      db.countryRequirement.create({ data: { productCategory: "Químico", country: "Japón", requirementName: "CSCL Compliance", isMandatory: true, localLanguageLabel: "化審法", regulation: "Chemical Substances Control Law" } }),
      db.countryRequirement.create({ data: { productCategory: "Químico", country: "Brasil", requirementName: "Registro ANVISA - Químico", isMandatory: true, localLanguageLabel: "Registro ANVISA", regulation: "RDC 420/2020" } }),
      db.countryRequirement.create({ data: { productCategory: "Mineral", country: "EE.UU.", requirementName: "Declaración de origen minerales", isMandatory: true, localLanguageLabel: "Mineral Origin Declaration", regulation: "Dodd-Frank Act Sec. 1502" } }),
      db.countryRequirement.create({ data: { productCategory: "Mineral", country: "Japón", requirementName: "Certificado de origen", isMandatory: true, localLanguageLabel: "原産地証明書", regulation: "Customs Act" } }),
      db.countryRequirement.create({ data: { productCategory: "Textil", country: "China", requirementName: "Inspección de calidad textil", isMandatory: true, localLanguageLabel: "纺织品质量检验", regulation: "GB 18401" } }),
      db.countryRequirement.create({ data: { productCategory: "Textil", country: "Japón", requirementName: "Etiquetado JIS textil", isMandatory: true, localLanguageLabel: "JIS繊維表示", regulation: "Household Products Labeling Act" } }),
    ]);

    // ==================== CREATE COMPLIANCE COST ITEMS ====================
    await Promise.all([
      db.complianceCostItem.create({ data: { category: "Certificación", name: "Certificado Fitosanitario", description: "Emisión de certificado fitosanitario por autoridad competente", estimatedCost: 250, currency: "USD", appliesToProduct: "Alimento agrícola", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Certificación", name: "Certificado Orgánico USDA", description: "Certificación orgánica para mercado estadounidense", estimatedCost: 3500, currency: "USD", appliesToProduct: "Alimento agrícola", appliesToCountry: "EE.UU.", isRequired: false, savingsIfCompliant: 8500 } }),
      db.complianceCostItem.create({ data: { category: "Certificación", name: "EUDR Due Diligence Statement", description: "Declaración de debida diligencia contra deforestación para UE", estimatedCost: 1200, currency: "USD", appliesToProduct: "Alimento agrícola", appliesToCountry: "Unión Europea", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Certificación", name: "REACH Registration", description: "Registro de sustancias químicas en ECHA", estimatedCost: 8500, currency: "USD", appliesToProduct: "Químico", appliesToCountry: "Unión Europea", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Inspección", name: "Inspección Fitosanitaria en Origen", description: "Inspección de productos agrícolas antes del embarque", estimatedCost: 400, currency: "USD", appliesToProduct: "Alimento agrícola", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Inspección", name: "Inspección Aduanera de Destino", description: "Inspección en aduana de destino", estimatedCost: 600, currency: "USD", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Inspección", name: "Inspección FDA en Puerto", description: "Inspección de alimentos por FDA en puerto de entrada", estimatedCost: 1200, currency: "USD", appliesToCountry: "EE.UU.", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Demora", name: "Demora por documentación incompleta", description: "Costo promedio de demora por falta de documentos en aduana (por día)", estimatedCost: 2500, currency: "USD", isRequired: false } }),
      db.complianceCostItem.create({ data: { category: "Demora", name: "Almacenaje en puerto por retención", description: "Costo de almacenaje cuando la carga es retenida", estimatedCost: 350, currency: "USD", isRequired: false } }),
      db.complianceCostItem.create({ data: { category: "Arancel", name: "Arancel estándar sin preferencia", description: "Arancel NMF aplicable sin certificado de origen", estimatedCost: 12000, currency: "USD", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Arancel", name: "Preferencia arancelaria con EUR.1", description: "Arancel reducido con certificado de origen EUR.1", estimatedCost: 2400, currency: "USD", appliesToCountry: "Unión Europea", isRequired: false, savingsIfCompliant: 9600 } }),
      db.complianceCostItem.create({ data: { category: "Certificación", name: "Marcado CE", description: "Certificación de conformidad para maquinaria en UE", estimatedCost: 5500, currency: "USD", appliesToProduct: "Maquinaria", appliesToCountry: "Unión Europea", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Certificación", name: "CBAM Report", description: "Reporte de contenido de carbono para importación de minerales a UE", estimatedCost: 3000, currency: "USD", appliesToProduct: "Mineral", appliesToCountry: "Unión Europea", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Certificación", name: "Lacey Act Declaration", description: "Declaración para productos maderables y vegetales a EE.UU.", estimatedCost: 150, currency: "USD", appliesToProduct: "Producto forestal", appliesToCountry: "EE.UU.", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Certificación", name: "FDA Registration + Prior Notice", description: "Registro y notificación previa para alimentos a EE.UU.", estimatedCost: 800, currency: "USD", appliesToProduct: "Alimento agrícola", appliesToCountry: "EE.UU.", isRequired: true } }),
      // Additional compliance cost items for richer simulator experience
      db.complianceCostItem.create({ data: { category: "Certificación", name: "FCC Certification", description: "Certificación de equipos electrónicos para mercado estadounidense", estimatedCost: 4500, currency: "USD", appliesToProduct: "Electrónica", appliesToCountry: "EE.UU.", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Certificación", name: "Certificación CCC China", description: "Certificación obligatoria para productos en China", estimatedCost: 6000, currency: "USD", appliesToProduct: "Electrónica", appliesToCountry: "China", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Certificación", name: "Certificado de Origen GSP", description: "Certificado de origen para sistema generalizado de preferencias", estimatedCost: 200, currency: "USD", isRequired: false, savingsIfCompliant: 4800 } }),
      db.complianceCostItem.create({ data: { category: "Inspección", name: "Inspección de productos forestales", description: "Inspección de productos maderables antes del embarque", estimatedCost: 500, currency: "USD", appliesToProduct: "Producto forestal", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Inspección", name: "Inspección textil de calidad", description: "Verificación de calidad y composición textil", estimatedCost: 350, currency: "USD", appliesToProduct: "Textil", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Inspección", name: "Inspección de maquinaria en origen", description: "Verificación técnica de equipos antes del embarque", estimatedCost: 1800, currency: "USD", appliesToProduct: "Maquinaria", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Demora", name: "Demora promedio por inspección adicional", description: "Costo promedio cuando aduana requiere inspección física (3 días)", estimatedCost: 7500, currency: "USD", isRequired: false } }),
      db.complianceCostItem.create({ data: { category: "Arancel", name: "Arancel electrónico a EE.UU.", description: "Arancel promedio para equipos electrónicos a EE.UU.", estimatedCost: 8000, currency: "USD", appliesToProduct: "Electrónica", appliesToCountry: "EE.UU.", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Arancel", name: "Arancel maquinaria a UE", description: "Arancel NMF para importación de maquinaria a la UE", estimatedCost: 15000, currency: "USD", appliesToProduct: "Maquinaria", appliesToCountry: "Unión Europea", isRequired: true } }),
      db.complianceCostItem.create({ data: { category: "Arancel", name: "Preferencia arancelaria con GSP", description: "Arancel reducido con certificado GSP para países en desarrollo", estimatedCost: 4500, currency: "USD", isRequired: false, savingsIfCompliant: 10500 } }),
    ]);

    return NextResponse.json({ success: true, message: "Database seeded with expanded data including Crew, CargoDetails, ChainOfCustody, Claims, CountryRequirements, and ComplianceCostItems" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
