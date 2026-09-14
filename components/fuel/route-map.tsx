'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-xl border z-0" />
});

type Marker = { lat: number; lng: number; title: string; role?: 'origen' | 'destino' };

export function RouteMap({
  routeCoordinates,
  markers,
  onMarkerDragEnd,
  fitKey,
}: {
  routeCoordinates: [number, number][];
  markers: Marker[];
  onMarkerDragEnd?: (role: 'origen' | 'destino', lat: number, lng: number) => void;
  fitKey?: number;
}) {
  return <MapComponent routeCoordinates={routeCoordinates} markers={markers} onMarkerDragEnd={onMarkerDragEnd} fitKey={fitKey} />;
}
