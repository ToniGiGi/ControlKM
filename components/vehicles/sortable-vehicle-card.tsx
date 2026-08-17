'use client'

import React from 'react'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Car, GripVertical } from 'lucide-react'
import { VehicleStatusBadge, TelemetryBadge, InsuranceBadge } from '@/components/status-badge'
import { numberFmt, currency } from '@/lib/mock-data'

export function SortableVehicleCard({ 
  v, 
  emp, 
  isConductor, 
  canEdit, 
  onEdit,
  isDragEnabled
}: {
  v: any
  emp: any
  isConductor: boolean
  canEdit: boolean
  onEdit: (v: any) => void
  isDragEnabled: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: v.id, disabled: !isDragEnabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={`block h-full ${isDragging ? 'opacity-50 scale-[1.02]' : ''}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-md relative flex flex-col sm:flex-row p-0 gap-0">
        
        {/* Botón de arrastre */}
        {isDragEnabled && (
          <div 
            {...attributes} 
            {...listeners}
            className="absolute top-2 left-2 z-20 p-1 bg-background/80 backdrop-blur rounded shadow-sm cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            title="Arrastrar para reordenar"
          >
            <GripVertical className="size-5" />
          </div>
        )}

        {!isConductor && canEdit && (
          <Button 
            variant="secondary" 
            size="icon" 
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
            onClick={(ev) => {
              ev.preventDefault() 
              ev.stopPropagation()
              onEdit(v)
            }}
            title="Editar vehículo"
          >
            <Pencil className="size-4" />
          </Button>
        )}
        
        {/* Lado izquierdo: Foto */}
        <Link href={`/vehiculos/${v.id}`} className="sm:w-2/5 shrink-0 relative bg-muted/30 flex items-center justify-center min-h-[200px] sm:min-h-full border-b sm:border-b-0 sm:border-r border-border block">
          {v.fotoUrl ? (
            <img src={v.fotoUrl} alt={v.nombreInterno} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <Car className="size-16 text-muted-foreground/50" />
          )}
        </Link>

        {/* Lado derecho: Información */}
        <Link href={`/vehiculos/${v.id}`} className="flex-1 flex flex-col p-5 space-y-4 block">
          {/* Header: Titulo, Info básica y Placas */}
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-lg" style={{ paddingLeft: isDragEnabled ? '2rem' : '0' }}>{v.nombreInterno}</h3>
              <p className="font-mono text-sm text-muted-foreground truncate">{v.numeroEconomico} • {v.sucursal}</p>
            </div>
            <span className="rounded bg-muted px-2 py-1 font-mono text-xs whitespace-nowrap border border-border">
              {v.placas}
            </span>
          </div>

          {/* Estado Principal */}
          <div>
            <VehicleStatusBadge status={v.estado} />
          </div>

          {/* Marca y Modelo */}
          <div>
            <p className="text-sm font-medium text-foreground">
              {v.marca} {v.modelo} <span className="text-muted-foreground font-normal">• {v.anio}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <TelemetryBadge status={v.telemetria?.estado || 'detenido'} />
              <InsuranceBadge status={v.seguro?.estado || 'vencido'} />
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-4 text-sm mt-auto">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Kilometraje</p>
              <p className="font-mono font-medium">{numberFmt(v.kmActual)} km</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Gasto total</p>
              <p className="font-mono font-medium">
                {currency(Object.values(v.gastos || {}).reduce((a: any, b: any) => a + b, 0) as number)}
              </p>
            </div>
          </div>

          {/* Footer: Empleado asignado */}
          <div className="pt-4 mt-4 border-t border-border flex items-center gap-2">
            <p className="text-sm text-muted-foreground truncate">
              Conductor: <span className="text-foreground font-medium">{emp?.nombre ?? 'Sin asignar'}</span>
            </p>
          </div>
        </Link>
      </Card>
    </div>
  )
}
