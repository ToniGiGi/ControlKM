'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Corrección para los iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Íconos explícitos para origen (azul) y destino (rojo).
// IMPORTANTE: nunca pasar `icon={undefined}` a un <Marker> - Leaflet mezcla las opciones
// con Object.assign, así que un valor undefined explícito borra su ícono por defecto
// interno y provoca "Cannot read properties of undefined (reading 'createIcon')".
const origenIcon = new L.Icon.Default();
const destinoIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapComponentProps {
  routeCoordinates: [number, number][]; // Array of [lat, lng]
  markers: { lat: number; lng: number; title: string; role?: 'origen' | 'destino' }[];
  onMarkerDragEnd?: (role: 'origen' | 'destino', lat: number, lng: number) => void;
}

// Componente para ajustar el zoom y centro automáticamente
function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [bounds, map]);
  return null;
}

export default function MapComponent({ routeCoordinates, markers, onMarkerDragEnd }: MapComponentProps) {
  // Centro por defecto: México
  const defaultCenter: [number, number] = [23.6345, -102.5528];

  let bounds: L.LatLngBoundsExpression | null = null;
  if (routeCoordinates.length > 0) {
    bounds = L.latLngBounds(routeCoordinates);
  } else if (markers.length > 0) {
    bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
  }

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border shadow-inner z-0">
      <MapContainer center={defaultCenter} zoom={5} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {bounds && <ChangeView bounds={bounds} />}
        
        {routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="#3b82f6" weight={6} opacity={0.8} />
        )}

        {markers.map((marker, idx) => (
          <Marker
            key={idx}
            position={[marker.lat, marker.lng]}
            icon={marker.role === 'destino' ? destinoIcon : origenIcon}
            draggable={!!onMarkerDragEnd && !!marker.role}
            eventHandlers={
              onMarkerDragEnd && marker.role
                ? {
                    dragend: (e) => {
                      const pos = (e.target as L.Marker).getLatLng();
                      onMarkerDragEnd(marker.role as 'origen' | 'destino', pos.lat, pos.lng);
                    },
                  }
                : undefined
            }
          >
            <Popup>{marker.title}{marker.role ? ' (arrástrame para ajustar)' : ''}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
