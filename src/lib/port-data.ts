export const PORT_COORDS_GEO: Record<string, { lat: number; lon: number }> = {
  GUAYAQUIL: { lat: -2.170998, lon: -79.922359 },
  VALENCIA: { lat: 39.4699, lon: -0.3763 },
  CALLAO: { lat: -12.056, lon: -77.118 },
  CARTAGENA: { lat: 10.391, lon: -75.4794 },
  MANZANILLO: { lat: 19.1411, lon: -104.315 },
  ROTTERDAM: { lat: 51.947, lon: 4.142 },
}

export const PORT_META: Record<string, { code?: string; country?: string; timezone?: string; maxDraft?: string; berths?: number; facilities?: string[]; website?: string }> = {
  GUAYAQUIL: { code: 'ECGYE', country: 'Ecuador', timezone: 'America/Guayaquil', maxDraft: '12.5m', berths: 9, facilities: ['Containers', 'RoRo', 'Bulk'], website: 'https://www.portofguayaquil.com' },
  VALENCIA: { code: 'ESVLC', country: 'Spain', timezone: 'Europe/Madrid', maxDraft: '16m', berths: 20, facilities: ['Containers', 'Cruise', 'Bulk'], website: 'https://www.valenciaport.com' },
  CALLAO: { code: 'PECLL', country: 'Peru', timezone: 'America/Lima', maxDraft: '14m', berths: 15, facilities: ['Containers', 'Bulk', 'Liquid'], website: 'https://www.consorciocallao.com' },
  CARTAGENA: { code: 'COCTG', country: 'Colombia', timezone: 'America/Bogota', maxDraft: '13m', berths: 12, facilities: ['Containers', 'RoRo'], website: 'https://www.cartagena-port.com' },
  MANZANILLO: { code: 'MXMAN', country: 'Mexico', timezone: 'America/Mexico_City', maxDraft: '15m', berths: 18, facilities: ['Containers', 'Bulk', 'Liquid'], website: 'https://www.manzanillomexico.com' },
  ROTTERDAM: { code: 'NLRTM', country: 'Netherlands', timezone: 'Europe/Amsterdam', maxDraft: '23m', berths: 120, facilities: ['Containers', 'Petrochemical', 'RoRo'], website: 'https://www.portofrotterdam.com' },
}

export function getPortKey(codeOrName: string) {
  const key = String(codeOrName || '').toUpperCase().replace(/\s+/g, '')
  if (PORT_COORDS_GEO[key]) return key
  // allow matching by name
  const byName = Object.keys(PORT_COORDS_GEO).find(k => k.toUpperCase() === codeOrName.toUpperCase())
  return byName || key
}
