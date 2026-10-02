'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import type { MapMarker, MapRoute } from './route-map';

// Corrección para los iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// IMPORTANTE: nunca pasar `icon={undefined}` a un <Marker> - Leaflet mezcla las opciones
// con Object.assign, así que un valor undefined explícito borra su ícono por defecto
// interno y provoca "Cannot read properties of undefined (reading 'createIcon')".
const iconCache: Record<string, L.Icon<L.BaseIconOptions>> = {};
function getIcon(color: string): L.Icon<L.BaseIconOptions> {
  if (!iconCache[color]) {
    iconCache[color] = color === 'blue'
      ? new L.Icon.Default()
      : new L.Icon({
          iconUrl: `https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-${color}.png`,
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });
  }
  return iconCache[color];
}

interface MapComponentProps {
  routes: MapRoute[];
  markers: MapMarker[];
  onMarkerDragEnd?: (legIndex: number, role: 'origen' | 'destino', lat: number, lng: number) => void;
  // Se incrementa solo cuando se debe reencuadrar el mapa (ej. al calcular una
  // ruta nueva), NO en cada arrastre de marcador - así el zoom/posición que el
  // usuario ajustó manualmente no se pierde al mover un pin.
  fitKey?: number;
}

function ChangeView({ bounds, fitKey }: { bounds: L.LatLngBoundsExpression; fitKey?: number }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);
  return null;
}

export default function MapComponent({ routes, markers, onMarkerDragEnd, fitKey }: MapComponentProps) {
  // Centro por defecto: México
  const defaultCenter: [number, number] = [23.6345, -102.5528];

  const allPoints: [number, number][] = [
    ...routes.flatMap(r => r.coordinates),
    ...markers.map(m => [m.lat, m.lng] as [number, number]),
  ];
  const bounds = allPoints.length > 0 ? L.latLngBounds(allPoints) : null;

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border shadow-inner z-0">
      <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bounds && <ChangeView bounds={bounds} fitKey={fitKey} />}

        {routes.map((route, idx) => (
          <Polyline key={idx} positions={route.coordinates} color={route.color} weight={6} opacity={0.8} />
        ))}

        {markers.map((marker) => (
          <Marker
            key={`${marker.legIndex}-${marker.role}`}
            position={[marker.lat, marker.lng]}
            icon={getIcon(marker.color)}
            draggable={!!onMarkerDragEnd}
            eventHandlers={
              onMarkerDragEnd
                ? {
                    dragend: (e) => {
                      const pos = (e.target as L.Marker).getLatLng();
                      onMarkerDragEnd(marker.legIndex, marker.role, pos.lat, pos.lng);
                    },
                  }
                : undefined
            }
          >
            <Popup>{marker.title} (arrástrame para ajustar)</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
