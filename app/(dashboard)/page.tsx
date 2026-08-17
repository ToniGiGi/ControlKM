'use client'

import React from 'react'

import Link from 'next/link'
import {
  Truck,
  CircleCheck,
  Wrench,
  ShieldAlert,
  Fuel,
  Gauge,
  DollarSign,
  TriangleAlert,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { ExpenseTrendChart, CategoryDonut } from '@/components/dashboard/charts'
import { VehicleStatusBadge, TelemetryBadge } from '@/components/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRole } from '@/components/role-provider'
import { getVehicles, getAlerts, getMonthlyExpenses } from '@/app/actions/db'
import {
  alerts,
  currency,
  numberFmt,
  totalGastos,
  getEmployee,
  type ExpenseCategory,
} from '@/lib/mock-data'

const severidadStyles: Record<string, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-warning/15 text-warning-foreground border-warning/30',
  baja: 'bg-muted text-muted-foreground border-border',
}

export default function DashboardPage() {
  const { role, config } = useRole()
  const isConductor = role === 'conductor'

  const [vehicles, setVehicles] = React.useState<any[]>([])
  const [dynamicAlerts, setDynamicAlerts] = React.useState<any[]>([])
  const [monthlyExpensesData, setMonthlyExpensesData] = React.useState<any[]>([])

  React.useEffect(() => {
    getVehicles().then(setVehicles)
    getAlerts().then(setDynamicAlerts)
    
    // Only pass empleadoId if role is conductor to filter expenses
    getMonthlyExpenses(role === 'conductor' ? config.empleadoId : undefined).then(setMonthlyExpensesData)
  }, [role, config.empleadoId])

  const visibles = isConductor
    ? vehicles.filter((v) => v.empleadoId === config.empleadoId)
    : vehicles

  const visibleIds = new Set(visibles.map((v) => v.id))
  const visibleAlerts = isConductor
    ? dynamicAlerts.filter((a) => visibleIds.has(a.vehiculoId))
    : dynamicAlerts

  const activos = visibles.filter((v) => v.estado === 'activo').length
  const enMantenimiento = visibles.filter((v) => v.estado === 'mantenimiento').length
  const segurosProblema = visibles.filter(
    (v) => v.seguro.estado === 'vencido' || v.seguro.estado === 'por_vencer',
  ).length
  const gastoTotal = visibles.reduce((a, v) => a + totalGastos(v), 0)
  const gastoGasolina = visibles.reduce((a, v) => a + v.gastos.gasolina, 0)
  const gastoSeguros = visibles.reduce((a, v) => a + (v.seguros?.reduce((s: number, seg: any) => s + (seg.costo || 0), 0) || 0), 0)
  const kmTotal = visibles.reduce((a, v) => a + (v.kmActual - v.kmInicial), 0)

  const categorias: ExpenseCategory[] = [
    'gasolina',
    'mantenimiento',
    'reparacion',
    'aceite',
    'neumaticos',
    'aditamentos',
    'casetas',
    'multas',
    'otros',
  ]
  const desglose = categorias.map((c) => ({
    categoria: c,
    monto: visibles.reduce((a, v) => a + v.gastos[c], 0),
  }))

  const topVehiculos = [...visibles]
    .sort((a, b) => totalGastos(b) - totalGastos(a))
    .slice(0, 5)

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-2xl mx-auto w-full">
      <PageHeader
        title={isConductor ? `Hola, ${config.nombre}` : 'Dashboard general'}
        description={
          isConductor
            ? 'Resumen de tu vehículo asignado y tus movimientos recientes.'
            : 'Resumen visual del estado, gastos y alertas de toda la flotilla.'
        }
      >
        <Badge variant="secondary" className="gap-1.5">
          <span className="size-2 rounded-full bg-primary" />
          {config.label}
        </Badge>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label={isConductor ? 'Mi vehículo' : 'Total de vehículos'}
          value={numberFmt(visibles.length)}
          icon={Truck}
          tone="primary"
        />
        <KpiCard label="Activos" value={numberFmt(activos)} icon={CircleCheck} tone="success" />
        <KpiCard
          label="En mantenimiento"
          value={numberFmt(enMantenimiento)}
          icon={Wrench}
          tone="warning"
        />
        <KpiCard
          label="Seguros con alerta"
          value={numberFmt(segurosProblema)}
          icon={ShieldAlert}
          tone="destructive"
        />
        <KpiCard label="Gasto total" value={currency(gastoTotal)} icon={DollarSign} />
        <KpiCard label="Gasto gasolina" value={currency(gastoGasolina)} icon={Fuel} />
        <KpiCard label="Gasto seguros" value={currency(gastoSeguros)} icon={ShieldCheck} />
        <KpiCard label="Km recorridos" value={`${numberFmt(kmTotal)} km`} icon={Gauge} />
      </div>

      {/* Gráficas */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">
              {isConductor ? 'Gasto de mi vehículo por mes' : 'Gasto de la flotilla por mes'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseTrendChart data={monthlyExpensesData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Gasto por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonut data={desglose} />
          </CardContent>
        </Card>
      </div>

      {/* Alertas + Top vehículos */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <TriangleAlert className="size-4 text-destructive" />
              Alertas importantes
            </CardTitle>
            <Badge variant="outline">{visibleAlerts.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {visibleAlerts.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sin alertas por el momento.
              </p>
            )}
            {visibleAlerts.map((a) => {
              return (
                <Link
                  key={a.id}
                  href={a.href || '#'}
                  className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${severidadStyles[a.severidad]}`}
                  >
                    {a.severidad}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.tipo}</p>
                    <p className="text-xs text-muted-foreground">{a.mensaje}</p>
                  </div>
                  {a.fecha && <span className="shrink-0 text-xs text-muted-foreground">{new Date(a.fecha).toLocaleDateString('es-MX')}</span>}
                </Link>
              )
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {isConductor ? 'Mi vehículo' : 'Vehículos con mayor gasto'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topVehiculos.map((v, i) => {
              const emp = getEmployee(v.empleadoId)
              return (
                <Link
                  key={v.id}
                  href={`/vehiculos/${v.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  {!isConductor && (
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-semibold">
                      {i + 1}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{v.nombreInterno}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <VehicleStatusBadge status={v.estado} />
                      <TelemetryBadge status={v.telemetria.estado} />
                    </div>
                    {emp && <p className="mt-1 text-xs text-muted-foreground">{emp.nombre}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold">{currency(totalGastos(v))}</p>
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                      Ver <ArrowUpRight className="size-3" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
