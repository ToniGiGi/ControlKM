// Geocodificación (Nominatim) y ruteo (OSRM) compartidos por el formulario de combustible
// y los scripts de mantenimiento. Funciona en el navegador y en Node.

export type GeoPoint = { lat: number; lon: number }

const ABBREVIATIONS: [RegExp, string][] = [
  [/\bcd\.?\s*/gi, 'Ciudad '],
  [/\bslp\b/gi, 'San Luis Potosí'],
  [/\bags\b/gi, 'Aguascalientes'],
  [/\bqro\b\.?/gi, 'Querétaro'],
  [/\bgto\b\.?/gi, 'Guanajuato'],
  [/\bver\b\.?/gi, 'Veracruz'],
  [/\bedo\.?\s*mex\b\.?/gi, 'Estado de México'],
  [/\bcdmx\b/gi, 'Ciudad de México'],
  [/\bmich\b\.?/gi, 'Michoacán'],
  [/\bjal\b\.?/gi, 'Jalisco'],
  [/\bhgo\b\.?/gi, 'Hidalgo'],
  [/\bav\.?\s+/gi, 'Avenida '],
]

function expand(address: string) {
  let s = address
  for (const [re, rep] of ABBREVIATIONS) s = s.replace(re, rep)
  return s.replace(/\s+/g, ' ').trim()
}

// Los conductores escriben desde ciudades ("celaya") hasta direcciones completas con número,
// colonia y código postal, que Nominatim muchas veces no encuentra. Se intenta de lo más
// específico a lo más general hasta dar con algo.
export function addressCandidates(address: string): string[] {
  const clean = expand(address)
  const noNumbers = clean
    .replace(/\b\d{5}\b/g, ' ')
    .replace(/\b(no\.?|num\.?|#)\s*\d+[a-z]?\b/gi, ' ')
    .replace(/\b\d+[a-z]?\b(-?\s*(loc|local|int|interior)\.?\s*\d*[a-z]?)?/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/^[,\s-]+|[,\s-]+$/g, '')
  const parts = noNumbers.split(',').map(p => p.trim()).filter(Boolean)
  const words = noNumbers.replace(/,/g, ' ').split(/\s+/).filter(Boolean)
  const candidates = [clean, noNumbers]
  // "CALLE, COLONIA, CIUDAD" -> "COLONIA, CIUDAD" -> "CIUDAD"
  for (let i = 1; i < parts.length; i++) candidates.push(parts.slice(i).join(', '))
  // "Tamasopo y cd valles" -> "Tamasopo"
  candidates.push(...noNumbers.split(/\s+y\s+|\s+-\s+|\//i).map(s => s.trim()))
  // Sin comas: "CALLE ... COLONIA CIUDAD" -> últimas palabras
  for (const n of [3, 2, 1]) if (words.length > n) candidates.push(words.slice(-n).join(' '))
  return [...new Set(candidates.filter(c => c.length >= 3))]
}

type GeocodeOpts = {
  headers?: Record<string, string>
  delayMs?: number
  // Punto cercano conocido (p. ej. el destino del tramo anterior): primero se busca en ~200 km a la redonda.
  near?: GeoPoint | null
}

async function nominatim(query: string, opts: GeocodeOpts, bounded: boolean): Promise<GeoPoint | null> {
  let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=mx`
  if (bounded && opts.near) {
    const d = 2
    url += `&viewbox=${opts.near.lon - d},${opts.near.lat + d},${opts.near.lon + d},${opts.near.lat - d}&bounded=1`
  }
  const res = await fetch(url, { headers: opts.headers })
  if (opts.delayMs) await new Promise(r => setTimeout(r, opts.delayMs))
  if (!res.ok) return null
  const data = await res.json()
  return data?.length ? { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) } : null
}

export async function geocode(address: string, opts: GeocodeOpts = {}): Promise<GeoPoint | null> {
  const candidates = addressCandidates(address)
  if (opts.near) {
    for (const c of candidates) {
      const p = await nominatim(c, opts, true)
      if (p) return p
    }
  }
  for (const c of candidates) {
    const p = await nominatim(c, opts, false)
    if (p) return p
  }
  return null
}

export async function getRouteInfo(a: GeoPoint, b: GeoPoint): Promise<{ distanceKm: number; coordinates: [number, number][] } | null> {
  const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=full&geometries=geojson`)
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.length) return null
  const route = data.routes[0]
  return {
    distanceKm: route.distance / 1000,
    coordinates: route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]),
  }
}

// Una ruta calculada automáticamente solo se acepta si se parece a los km que capturó el conductor;
// así un punto mal ubicado (otra ciudad con el mismo nombre) no dibuja una ruta falsa.
export function distanceMatches(routeKm: number, expectedKm: number | '' | null | undefined) {
  if (typeof expectedKm !== 'number' || expectedKm <= 0) return true
  return Math.abs(routeKm - expectedKm) <= Math.max(15, expectedKm * 0.35)
}
