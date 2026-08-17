'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Gauge, MapPin, Radio, Search, Clock, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TelemetryBadge } from '@/components/status-badge'
import { useRole } from '@/components/role-provider'
import {
  vehicles as allVehicles,
  telemetryLabel,
  type Vehicle,
  type TelemetryStatus,
} from '@/lib/mock-data'

const FleetMap = dynamic(() => import('@/components/tracking/fleet-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
      Cargando mapa...
    </div>
  ),
})

const dotColor: Record<TelemetryStatus, string> = {
  en_movimiento: 'bg-[var(--success)]',
  detenido: 'bg-[var(--warning)]',
  apagado: 'bg-muted-foreground',
  sin_senal: 'bg-[var(--danger)]',
}

export function TrackingPanel() {
  const { role, currentEmployeeId } = useRole()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  // Simulacion: refresca "ultimo reporte" y velocidad de unidades en movimiento
  const [live, setLive] = useState<Vehicle[]>(allVehicles)
  useEffect(() => {
    const interval = setInterval(() => {
      setLive((prev) =>
        prev.map((v) =>
          v.telemetria.estado === 'en_movimiento'
            ? {
                ...v,
                telemetria: {
                  ...v.telemetria,
                  lat: v.telemetria.lat + (Math.random() - 0.5) * 0.004,
                  lng: v.telemetria.lng + (Math.random() - 0.5) * 0.004,
                  velocidad: Math.max(
                    20,
                    Math.min(
                      110,
                      v.telemetria.velocidad + Math.round((Math.random() - 0.5) * 12),
                    ),
                  ),
                  ultimoReporte: 'Hace instantes',
                },
              }
            : v,
        ),
      )
      setTick((t) => t + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const scoped = useMemo(() => {
    if (role === 'conductor') {
      return live.filter((v) => v.empleadoId === currentEmployeeId)
    }
    return live
  }, [live, role, currentEmployeeId])

  const filtered = useMemo(() => {
    if (!query.trim()) return scoped
    const q = query.toLowerCase()
    return scoped.filter(
      (v) =>
        v.nombreInterno.toLowerCase().includes(q) ||
        v.placas.toLowerCase().includes(q),
    )
  }, [scoped, query])

  const counts = useMemo(() => {
    return {
      en_movimiento: scoped.filter((v) => v.telemetria.estado === 'en_movimiento').length,
      detenido: scoped.filter((v) => v.telemetria.estado === 'detenido').length,
      apagado: scoped.filter((v) => v.telemetria.estado === 'apagado').length,
      sin_senal: scoped.filter((v) => v.telemetria.estado === 'sin_senal').length,
    }
  }, [scoped])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Rastreo y Telemetría"
        description="Ubicación y estado de las unidades en tiempo real (datos simulados)."
      >
        <Badge variant="outline" className="gap-1.5 border-[var(--success)]/40 text-[var(--success)]">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-[var(--success)]" />
          </span>
          En vivo
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ['en_movimiento', counts.en_movimiento],
            ['detenido', counts.detenido],
            ['apagado', counts.apagado],
            ['sin_senal', counts.sin_senal],
          ] as [TelemetryStatus, number][]
        ).map(([status, n]) => (
          <Card key={status}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className={`size-2.5 rounded-full ${dotColor[status]}`} />
              <div>
                <p className="text-2xl font-semibold tabular-nums">{n}</p>
                <p className="text-xs text-muted-foreground">
                  {telemetryLabel[status]}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="order-2 lg:order-1">
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar unidad..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[420px] pr-3">
              <div className="flex flex-col gap-2">
                {filtered.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    className={`flex flex-col gap-2 rounded-lg border p-3 text-left transition-colors ${
                      selectedId === v.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-medium">
                        <span className={`size-2 rounded-full ${dotColor[v.telemetria.estado]}`} />
                        {v.nombre}
                      </span>
                      <TelemetryBadge status={v.telemetria.estado} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" /> {v.placas}
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="size-3" /> {v.telemetria.velocidad} km/h
                      </span>
                      <span className="flex items-center gap-1">
                        <Radio className="size-3" /> {v.telemetria.dispositivo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" /> {v.telemetria.ultimoReporte}
                      </span>
                    </div>
                    <Link
                      href={`/vehiculos/${v.id}`}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver detalle <ExternalLink className="size-3" />
                    </Link>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Sin unidades para mostrar.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="order-1 overflow-hidden lg:order-2">
          <div className="h-[300px] w-full lg:h-[492px]">
            <FleetMap
              key={tick === -1 ? 'x' : 'map'}
              vehicles={filtered}
              onSelect={setSelectedId}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
