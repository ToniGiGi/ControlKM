'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  telemetryLabel,
  type Vehicle,
  type TelemetryStatus,
} from '@/lib/mock-data'

const statusColor: Record<TelemetryStatus, string> = {
  en_movimiento: '#16a34a',
  detenido: '#d97706',
  apagado: '#64748b',
  sin_senal: '#dc2626',
}

function markerIcon(status: TelemetryStatus) {
  const color = statusColor[status]
  return L.divIcon({
    className: 'fleet-marker',
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:9999px;
      background:${color};color:#fff;font-size:14px;
      box-shadow:0 0 0 4px ${color}33;border:2px solid #fff;">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
    </span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function FitBounds({ vehicles }: { vehicles: Vehicle[] }) {
  const map = useMap()
  useEffect(() => {
    if (vehicles.length === 0) return
    const bounds = L.latLngBounds(
      vehicles.map((v) => [v.telemetria.lat, v.telemetria.lng]),
    )
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
  }, [vehicles, map])
  return null
}

export default function FleetMap({
  vehicles,
  onSelect,
}: {
  vehicles: Vehicle[]
  onSelect?: (id: string) => void
}) {
  return (
    <MapContainer
      center={[19.43, -99.13]}
      zoom={11}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: '#e5e7eb' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds vehicles={vehicles} />
      {vehicles.map((v) => (
        <Marker
          key={v.id}
          position={[v.telemetria.lat, v.telemetria.lng]}
          icon={markerIcon(v.telemetria.estado)}
          eventHandlers={{ click: () => onSelect?.(v.id) }}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              <strong>{v.nombre}</strong>
              <span className="font-semibold text-sm">{v.nombreInterno}</span>
              <br />
              <span>{v.placas}</span>
              <br />
              <span>Estado: {telemetryLabel[v.telemetria.estado]}</span>
              <br />
              <span>Velocidad: {v.telemetria.velocidad} km/h</span>
              <br />
              <span>Reporte: {v.telemetria.ultimoReporte}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
