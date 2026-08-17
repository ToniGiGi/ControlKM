import { cn } from '@/lib/utils'
import {
  insuranceLabel,
  telemetryLabel,
  vehicleStatusLabel,
  type InsuranceStatus,
  type TelemetryStatus,
  type VehicleStatus,
} from '@/lib/mock-data'

const base =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border'

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const styles: Record<VehicleStatus, string> = {
    activo: 'bg-success/10 text-success border-success/20',
    inactivo: 'bg-muted text-muted-foreground border-border',
    mantenimiento: 'bg-warning/15 text-warning-foreground border-warning/30',
    fuera_servicio: 'bg-destructive/10 text-destructive border-destructive/20',
    vendido: 'bg-muted text-muted-foreground border-border',
    baja: 'bg-muted text-muted-foreground border-border',
  }
  return <span className={cn(base, styles[status])}>{vehicleStatusLabel[status]}</span>
}

export function TelemetryBadge({ status }: { status: TelemetryStatus }) {
  const styles: Record<TelemetryStatus, string> = {
    en_movimiento: 'bg-success/10 text-success border-success/20',
    detenido: 'bg-primary/10 text-primary border-primary/20',
    apagado: 'bg-muted text-muted-foreground border-border',
    sin_senal: 'bg-destructive/10 text-destructive border-destructive/20',
  }
  const dot: Record<TelemetryStatus, string> = {
    en_movimiento: 'bg-success animate-pulse',
    detenido: 'bg-primary',
    apagado: 'bg-muted-foreground',
    sin_senal: 'bg-destructive',
  }
  return (
    <span className={cn(base, styles[status])}>
      <span className={cn('size-1.5 rounded-full', dot[status])} />
      {telemetryLabel[status]}
    </span>
  )
}

export function InsuranceBadge({ status }: { status: InsuranceStatus }) {
  const styles: Record<InsuranceStatus, string> = {
    vigente: 'bg-success/10 text-success border-success/20',
    por_vencer: 'bg-warning/15 text-warning-foreground border-warning/30',
    vencido: 'bg-destructive/10 text-destructive border-destructive/20',
  }
  return <span className={cn(base, styles[status])}>{insuranceLabel[status]}</span>
}
