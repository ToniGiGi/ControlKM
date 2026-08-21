'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Gauge,
  DollarSign,
  ShieldCheck,
  Wrench,
  Fuel,
  MapPin,
  FileText,
  TriangleAlert,
  Route,
  Lock,
  User,
  Download,
  Upload,
  Check,
  Trash,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { VehicleMonthlyChart } from '@/components/vehicles/vehicle-charts'
import { VehicleStatusBadge, TelemetryBadge, InsuranceBadge } from '@/components/status-badge'
import { useRole } from '@/components/role-provider'
import { updateVehicle } from '@/app/actions/db'
import {
  employees as allEmployees,
  currency,
  numberFmt,
  expenseLabel,
  type ExpenseCategory,
  type Vehicle,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const gastoMensual = [
  { mes: 'Ene', gasto: 9800 },
  { mes: 'Feb', gasto: 12400 },
  { mes: 'Mar', gasto: 8600 },
  { mes: 'Abr', gasto: 11200 },
  { mes: 'May', gasto: 14100 },
  { mes: 'Jun', gasto: 10500 },
]

const categoryColors: Record<ExpenseCategory, string> = {
  gasolina: 'bg-orange-500',
  mantenimiento: 'bg-blue-500',
  reparacion: 'bg-red-500',
  aceite: 'bg-teal-500',
  neumaticos: 'bg-slate-700 dark:bg-slate-300',
  aditamentos: 'bg-indigo-500',
  casetas: 'bg-amber-500',
  multas: 'bg-rose-600',
  otros: 'bg-gray-400'
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
}

function formatDate(date: any) {
  if (!date) return '—'
  if (date instanceof Date) return date.toLocaleDateString('es-MX')
  if (typeof date === 'string') return new Date(date).toLocaleDateString('es-MX')
  return String(date)
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

export function VehicleDetail({ id, initialVehicle, employees = [] }: { id: string, initialVehicle?: any, employees?: any[] }) {
  const { role, config, can } = useRole()
  const isConductor = role === 'conductor'
  const [vehicle, setVehicle] = useState<any | undefined>(initialVehicle)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>, tipo: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const newDoc = {
      nombre: file.name,
      tipo: tipo,
      fecha: new Date().toLocaleDateString('es-MX'),
      url: URL.createObjectURL(file)
    }
    
    setVehicle({
      ...vehicle,
      documentos: [...(vehicle.documentos || []), newDoc]
    })
    
    // Reset input
    e.target.value = ''
  }

  const handleDeleteDocument = (docToDelete: any) => {
    setVehicle({
      ...vehicle,
      documentos: (vehicle.documentos || []).filter((d: any) => d !== docToDelete)
    })
    setSelectedDocument(null)
  }

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Vehículo no encontrado.</p>
            <Link href="/vehiculos" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
              Volver a vehículos
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Control de acceso: un conductor solo puede ver su vehículo asignado
  const puedeVer =
    role !== 'conductor' || vehicle.empleadoId === config.empleadoId

  if (!puedeVer) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Lock className="size-6" />
            </div>
            <p className="mt-4 font-medium">Acceso restringido</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Como conductor solo puedes consultar la información del vehículo que tienes asignado.
            </p>
            <Link href="/vehiculos" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
              Volver a mi vehículo
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const emp = vehicle.empleado
  
  // Total histórico de gastos
  const gastoTotal = Object.values(vehicle.gastos as Record<string, number>).reduce((sum, cost) => sum + cost, 0)
  const tanquePct = Math.min(100, Math.round((vehicle.kmActual / (vehicle.proximoMantenimientoKm || 1)) * 100))

  const desglose = (Object.keys(vehicle.gastos) as ExpenseCategory[])
    .map((c) => ({ categoria: c, monto: vehicle.gastos[c] }))
    .filter((d) => d.monto > 0)
    .sort((a, b) => b.monto - a.monto)

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <Link href="/vehiculos" className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1.5 -ml-2" })}>
        <ArrowLeft className="size-4" /> Volver
      </Link>

      <PageHeader
        title={vehicle.nombreInterno}
        description={`${vehicle.marca} ${vehicle.modelo} ${vehicle.anio} · ${vehicle.tipoUnidad} · ${vehicle.numeroEconomico}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <VehicleStatusBadge status={vehicle.estado} />
          <TelemetryBadge status={vehicle.telemetria.estado} />
        </div>
      </PageHeader>

      {/* KPIs del vehículo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Kilometraje actual" value={`${numberFmt(vehicle.kmActual)} km`} icon={Gauge} tone="primary" />
        <KpiCard label="Gasto acumulado" value={currency(gastoTotal)} icon={DollarSign} />
        <KpiCard label="Gasto gasolina" value={currency(vehicle.gastos.gasolina)} icon={Fuel} />
        <KpiCard label="Gasto mantenimiento" value={currency(vehicle.gastos.mantenimiento)} icon={Wrench} tone="warning" />
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <div className="overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="gastos">Gastos</TabsTrigger>
            <TabsTrigger value="mantenimientos">Mantenimientos</TabsTrigger>
            <TabsTrigger value="combustible">Combustible</TabsTrigger>
            <TabsTrigger value="viajes">Viajes</TabsTrigger>
            <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>
        </div>

        {/* GENERAL */}
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Información general</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Field label="Marca / Modelo" value={`${vehicle.marca} ${vehicle.modelo}`} />
                <Field label="Año" value={vehicle.anio} />
                <Field label="Tipo de unidad" value={vehicle.tipoUnidad} />
                <Field label="Placas" value={vehicle.placas} />
                <Field label="VIN / Serie" value={vehicle.vin} />
                <Field label="Color" value={vehicle.color} />
                <Field label="Combustible" value={vehicle.combustible} />
                <Field label="Capacidad tanque" value={`${vehicle.capacidadTanque} L`} />
                <Field label="Sucursal" value={vehicle.sucursal} />
              </CardContent>
            </Card>

            <div className="space-y-4 lg:col-span-2">
              {/* Conductor */}
              <Card>
                <CardContent className="pt-6">
                  {emp ? (
                    <div className="flex flex-col gap-6">
                      {/* Top Info */}
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="text-base font-semibold">{emp.nombre}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {emp.puesto} · {emp.area}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">{emp.email}</p>
                        </div>
                        <Avatar className="size-14 border border-border">
                          <AvatarImage src={emp.fotoUrl || ''} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {initials(emp.nombre)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Bottom Info & Action */}
                      <div className="flex items-end justify-between">
                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-base font-medium">
                            <User className="size-4" /> Empleado asignado
                          </p>
                          {can('crear_editar') && !isConductor && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployeeId(vehicle.empleadoId || 'unassigned')
                                setIsAssignModalOpen(true)
                              }}
                            >
                              Reasignar
                            </Button>
                          )}
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground mb-1">Asignado desde</p>
                          <p className="font-medium">{formatDate(vehicle.fechaAsignacion)}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div className="py-2">
                        <p className="text-sm text-muted-foreground">
                          Este vehículo no tiene un conductor asignado.
                        </p>
                      </div>
                      <div className="flex items-end justify-between">
                        <div className="space-y-2">
                          <p className="flex items-center gap-2 text-base font-medium">
                            <User className="size-4" /> Empleado asignado
                          </p>
                          {can('crear_editar') && !isConductor && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEmployeeId(vehicle.empleadoId || 'unassigned')
                                setIsAssignModalOpen(true)
                              }}
                            >
                              Asignar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Seguro */}
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="size-4" /> Seguro
                  </CardTitle>
                  <InsuranceBadge status={vehicle.seguro.estado} />
                </CardHeader>
                <CardContent className="grid gap-x-6 sm:grid-cols-2">
                  <Field label="Aseguradora" value={vehicle.seguro.aseguradora} />
                  <Field label="No. de póliza" value={vehicle.seguro.poliza} />
                  <Field label="Cobertura" value={vehicle.seguro.cobertura} />
                  <Field label="Costo anual" value={currency(vehicle.seguro.costo)} />
                  <Field label="Vigencia inicio" value={formatDate(vehicle.seguro.inicio)} />
                  <Field label="Vigencia fin" value={formatDate(vehicle.seguro.vencimiento)} />
                  <div className="col-span-full pt-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <FileText className="size-4" /> Ver póliza (PDF)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Mantenimiento próximo */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wrench className="size-4" /> Próximo mantenimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Programado</span>
                    <span className="font-medium">
                      {formatDate(vehicle.proximoMantenimientoFecha)} · {numberFmt(vehicle.proximoMantenimientoKm)} km
                    </span>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Avance hacia próximo servicio</span>
                      <span>{tanquePct}%</span>
                    </div>
                    <Progress value={tanquePct} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gasto por mes</CardTitle>
            </CardHeader>
            <CardContent>
              <VehicleMonthlyChart data={gastoMensual} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* GASTOS */}
        <TabsContent value="gastos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Desglose histórico de gastos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {desglose.length > 0 ? desglose.map((d) => {
                const pct = Math.round((d.monto / gastoTotal) * 100)
                const barColor = categoryColors[d.categoria as ExpenseCategory] || 'bg-primary'
                return (
                  <div key={d.categoria}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">{expenseLabel[d.categoria as ExpenseCategory]}</span>
                      <span className="font-mono font-medium">{currency(d.monto)}</span>
                    </div>
                    <Progress value={pct} className="h-2" indicatorClassName={barColor} />
                  </div>
                )
              }) : (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No hay gastos registrados para este vehículo.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MANTENIMIENTOS */}
        <TabsContent value="mantenimientos">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de mantenimientos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Taller</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Km</TableHead>
                      <TableHead className="text-right">Costo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicle.mantenimientos?.map((m: any, idx: number) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-sm">{formatDate(m.fecha)}</TableCell>
                        <TableCell className="capitalize">{m.tipo}</TableCell>
                        <TableCell>{m.taller}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.descripcion}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{numberFmt(m.km)}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {currency(m.costo)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {vehicle.mantenimientos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          Sin mantenimientos registrados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMBUSTIBLE */}
        <TabsContent value="combustible">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cargas de combustible</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Gasolinera</TableHead>
                      <TableHead className="text-right">Litros</TableHead>
                      <TableHead className="text-right">$/Litro</TableHead>
                      <TableHead className="text-right">Km</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicle.cargas.map((f: any) => (
                      <TableRow key={f.id}>
                        <TableCell className="text-sm">{formatDate(f.fecha)}</TableCell>
                        <TableCell>{f.gasolinera}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{f.litros} L</TableCell>
                        <TableCell className="text-right font-mono text-sm">{currency(f.costoLitro)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{numberFmt(f.km)}</TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
                          {currency(f.litros * f.costoLitro)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {vehicle.cargas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                          Sin cargas registradas.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VIAJES */}
        <TabsContent value="viajes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Route className="size-4" /> Historial de viajes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-right">Km</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicle.viajes.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{formatDate(t.fecha)}</TableCell>
                        <TableCell>{t.origen}</TableCell>
                        <TableCell>{t.destino}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{t.motivo}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{numberFmt(t.km)}</TableCell>
                      </TableRow>
                    ))}
                    {vehicle.viajes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                          Sin viajes registrados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INCIDENCIAS */}
        <TabsContent value="incidencias" className="space-y-3">
          {vehicle.incidencias.map((inc) => (
            <Card key={inc.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <TriangleAlert className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium">{inc.tipo}</p>
                    <p className="text-sm text-muted-foreground">{inc.descripcion}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(inc.fecha)} · Gravedad {inc.gravedad} · Estado {inc.estado.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-sm font-medium">{currency(inc.costo)}</span>
              </CardContent>
            </Card>
          ))}
          {vehicle.incidencias.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Sin incidencias registradas.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* DOCUMENTOS */}
        <TabsContent value="documentos">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { tipo: 'Circulación', titulo: 'Tarjeta de circulación', desc: 'Documento oficial vigente', icon: FileText },
              { tipo: 'Factura', titulo: 'Factura o Carta factura', desc: 'Comprobante de propiedad', icon: FileText },
              { tipo: 'Verificación', titulo: 'Verificación vehicular', desc: 'Certificado y holograma', icon: FileText },
              { tipo: 'Seguro', titulo: 'Póliza de seguro', desc: 'Cobertura vigente', icon: ShieldCheck },
            ].map((slot) => {
              const doc = (vehicle.documentos || []).find((d: any) => d.tipo === slot.tipo)
              const Icon = slot.icon
              return (
                <Card key={slot.tipo} className={cn("overflow-hidden transition-all", !doc ? "border-dashed bg-muted/30" : "")}>
                  <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", doc ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-base">{slot.titulo}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{slot.desc}</p>
                        {doc && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium">
                            <Check className="size-3.5" /> Subido el {formatDate(doc.fecha)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      {doc ? (
                        <>
                          <Button variant="secondary" size="sm" className="flex-1 gap-2" onClick={() => setSelectedDocument(doc)}>
                            <FileText className="size-4" /> Ver documento
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="px-3 shrink-0" 
                            aria-label="Descargar"
                            onClick={() => {
                              if (doc.url) {
                                const a = document.createElement('a')
                                a.href = doc.url
                                a.download = doc.nombre
                                a.click()
                              }
                            }}
                          >
                            <Download className="size-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="relative w-full">
                          <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            accept=".pdf,.jpg,.jpeg,.png" 
                            title="Subir archivo"
                            onChange={(e) => handleUpload(e, slot.tipo)}
                          />
                          <Button variant="outline" size="sm" className="w-full gap-2 border-dashed">
                            <Upload className="size-4" /> Subir archivo
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          {/* Documentos adicionales */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Otros documentos</h3>
              {can('crear_editar') && (
                <div className="relative">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    title="Agregar otro documento"
                    onChange={(e) => handleUpload(e, 'Otro')}
                  />
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Upload className="size-4" /> Agregar otro
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {(vehicle.documentos || []).filter((d: any) => !['Circulación', 'Factura', 'Verificación', 'Seguro'].includes(d.tipo)).map((doc: any, i: number) => (
                <Card key={i}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.tipo} · {doc.fecha}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => setSelectedDocument(doc)}>
                      Ver
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Descargar documento">
                      <Download className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {(vehicle.documentos || []).filter((d: any) => !['Circulación', 'Factura', 'Verificación', 'Seguro'].includes(d.tipo)).length === 0 && (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">No hay documentos adicionales adjuntos.</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{emp ? 'Reasignar vehículo' : 'Asignar vehículo'}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm font-medium mb-3 px-1">Selecciona un empleado</p>
            <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-2">
              <button
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  selectedEmployeeId === 'unassigned'
                    ? 'border-primary ring-1 ring-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50'
                }`}
                onClick={() => setSelectedEmployeeId('unassigned')}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="size-5 text-muted-foreground" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium text-sm">Sin asignar</p>
                  <p className="text-xs text-muted-foreground">Dejar el vehículo sin conductor</p>
                </div>
                {selectedEmployeeId === 'unassigned' && <Check className="size-5 text-primary shrink-0" />}
              </button>

              {employees.map((e) => (
                <button
                  key={e.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedEmployeeId === e.id
                      ? 'border-primary ring-1 ring-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedEmployeeId(e.id)}
                >
                  <Avatar className="size-10 border border-border shrink-0">
                    <AvatarImage src={e.fotoUrl || ''} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials(e.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-sm truncate">{e.nombre}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {e.puesto} · {e.area}
                    </p>
                  </div>
                  {selectedEmployeeId === e.id && <Check className="size-5 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={isAssigning}
              onClick={async () => {
                const willAssign = selectedEmployeeId !== 'unassigned'
                const empleadoId = willAssign ? selectedEmployeeId : null
                const fechaAsignacion = willAssign ? new Date().toISOString().split('T')[0] : null

                setIsAssigning(true)
                try {
                  await updateVehicle(vehicle.id, { empleadoId, fechaAsignacion })
                  const nuevoEmpleado = employees.find((e) => e.id === empleadoId)
                  setVehicle({
                    ...vehicle,
                    empleadoId,
                    fechaAsignacion,
                    empleado: nuevoEmpleado || null,
                  })
                  setIsAssignModalOpen(false)
                } catch (err) {
                  console.error(err)
                  alert('Error al guardar la asignación')
                } finally {
                  setIsAssigning(false)
                }
              }}
            >
              {isAssigning ? 'Guardando...' : 'Guardar asignación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <Dialog open={!!selectedDocument} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.nombre || 'Visor de documento'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto rounded-xl border bg-muted/20 flex items-center justify-center p-2 relative">
            {selectedDocument?.url ? (
              selectedDocument.nombre.toLowerCase().endsWith('.pdf') ? (
                <iframe src={selectedDocument.url} className="w-full h-full rounded-lg" title="Document PDF" />
              ) : (
                <img src={selectedDocument.url} alt="Documento" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
              )
            ) : (
              <div className="text-center text-muted-foreground flex flex-col items-center justify-center p-12">
                <div className="flex size-20 items-center justify-center rounded-full bg-muted mb-4">
                  <FileText className="size-10 opacity-50" />
                </div>
                <p className="font-medium text-lg text-foreground mb-1">Vista previa no disponible</p>
                <p className="max-w-xs text-sm">Este es un documento pre-cargado de demostración. Al subir un documento nuevo podrás previsualizarlo aquí.</p>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            {can('crear_editar') && selectedDocument ? (
              <Button 
                variant="ghost" 
                className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2 mr-auto" 
                onClick={() => handleDeleteDocument(selectedDocument)}
              >
                <Trash className="size-4" /> Eliminar archivo
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedDocument(null)}>Cerrar visor</Button>
              {selectedDocument?.url && (
                <Button className="gap-2" onClick={() => {
                  const a = document.createElement('a');
                  a.href = selectedDocument.url;
                  a.download = selectedDocument.nombre;
                  a.click();
                }}>
                  <Download className="size-4" /> Descargar archivo
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
