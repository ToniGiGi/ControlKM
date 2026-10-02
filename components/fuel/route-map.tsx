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
