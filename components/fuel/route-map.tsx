'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-xl border z-0" />
});

// El origen siempre es azul; cada destino toma el siguiente color.
// `name` corresponde a los íconos de leaflet-color-markers; `hex` al trazo de la ruta.
export const LEG_COLORS = [
  { name: 'red', hex: '#CB2B3E' },
  { name: 'green', hex: '#2AAD27' },
  { name: 'orange', hex: '#CB8427' },
  { name: 'violet', hex: '#9C2BCB' },
  { name: 'gold', hex: '#C9A400' },
  { name: 'black', hex: '#3D3D3D' },
];

export function legColor(index: number) {
  return LEG_COLORS[index % LEG_COLORS.length];
}

export type MapMarker = {
  lat: number;
  lng: number;
  title: string;
  color: string;
  legIndex: number;
  role: 'origen' | 'destino';
};

export type MapRoute = { coordinates: [number, number][]; color: string };

export type Coord = { lat: number; lon: number };
export type LegGeo = { orig: Coord; dest: Coord; coords: [number, number][]; chained: boolean };
export type RouteLegLike = { origen: string; destino: string; geo?: LegGeo };

// Un tramo encadenado comparte su origen con el destino del anterior, así que no se repite ese pin.
export function buildRouteLayers(legs: RouteLegLike[]): { routes: MapRoute[]; markers: MapMarker[] } {
  const multi = legs.length > 1;
  const routes = legs.flatMap((leg, i) => (leg.geo ? [{ coordinates: leg.geo.coords, color: legColor(i).hex }] : []));
  const markers = legs.flatMap((leg, i) => {
    if (!leg.geo) return [];
    const out: MapMarker[] = [];
    if (!(leg.geo.chained && legs[i - 1]?.geo)) {
      out.push({
        lat: leg.geo.orig.lat, lng: leg.geo.orig.lon, color: 'blue', legIndex: i, role: 'origen',
        title: `${multi && i > 0 ? `Origen tramo ${i + 1}` : 'Salida'}: ${leg.origen}`,
      });
    }
    out.push({
      lat: leg.geo.dest.lat, lng: leg.geo.dest.lon, color: legColor(i).name, legIndex: i, role: 'destino',
      title: `${multi ? `Destino ${i + 1}` : 'Destino'}: ${leg.destino}`,
    });
    return out;
  });
  return { routes, markers };
}

// OSRM devuelve miles de puntos por tramo; para guardarlos basta con ~300 a 5 decimales (~1 m de precisión).
export function simplifyLine(coords: [number, number][], maxPoints = 300): [number, number][] {
  const step = Math.max(1, Math.ceil(coords.length / maxPoints));
  const round = (n: number) => Math.round(n * 1e5) / 1e5;
  const kept = coords.filter((_, i) => i % step === 0);
  const last = coords[coords.length - 1];
  if (last && kept[kept.length - 1] !== last) kept.push(last);
  return kept.map(([a, b]) => [round(a), round(b)]);
}

// Tramos guardados en FuelRequest.rutasDetalle (JSON). Las solicitudes viejas no traen `geo`.
export function parseSavedLegs(rutasDetalle: string | null | undefined): (RouteLegLike & { tipo?: string; km?: number | '' })[] {
  if (!rutasDetalle) return [];
  try {
    const legs = JSON.parse(rutasDetalle);
    return Array.isArray(legs) ? legs : [];
  } catch {
    return [];
  }
}

export function hasSavedRoute(rutasDetalle: string | null | undefined) {
  return parseSavedLegs(rutasDetalle).some(l => l.geo && Array.isArray(l.geo.coords) && l.geo.coords.length > 0);
}

export function RouteMap({
  routes,
  markers,
  onMarkerDragEnd,
  fitKey,
}: {
  routes: MapRoute[];
  markers: MapMarker[];
  onMarkerDragEnd?: (legIndex: number, role: 'origen' | 'destino', lat: number, lng: number) => void;
  fitKey?: number;
}) {
  return <MapComponent routes={routes} markers={markers} onMarkerDragEnd={onMarkerDragEnd} fitKey={fitKey} />;
}
