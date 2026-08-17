'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  Mail,
  Phone,
  IdCard,
  TriangleAlert,
  Car,
  Lock,
  Plus,
  Pencil,
  LayoutGrid,
  List,
  MapPin,
  Calendar
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRole } from '@/components/role-provider'
import { type Employee } from '@/lib/mock-data'
import { EmployeeFormModal } from './employee-form-modal'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function licenseStatus(dateStr: string) {
  const now = new Date('2026-07-03')
  const date = new Date(dateStr)
  const days = Math.round((date.getTime() - now.getTime()) / 86400000)
  if (days < 0) return { label: 'Licencia vencida', tone: 'danger' as const, days }
  if (days <= 60) return { label: 'Licencia por vencer', tone: 'warning' as const, days }
  return { label: 'Licencia vigente', tone: 'ok' as const, days }
}

const toneClasses: Record<string, string> = {
  ok: 'bg-[var(--success-muted)] text-[var(--success)] border-transparent',
  warning: 'bg-[var(--warning-muted)] text-[var(--warning)] border-transparent',
  danger: 'bg-[var(--danger-muted)] text-[var(--danger)] border-transparent',
}

export type EmployeeListProps = {
  initialEmployees: Employee[]
  initialVehicles: any[]
  branches?: any[]
  departments?: any[]
}

export function EmployeeList({ initialEmployees, initialVehicles, branches = [], departments = [] }: EmployeeListProps) {
  const { role, currentEmployeeId } = useRole()
  const [employeesList, setEmployeesList] = useState<any[]>(initialEmployees)
  const [vehiclesList, setVehiclesList] = useState<any[]>(initialVehicles)

  useEffect(() => {
    setEmployeesList(initialEmployees)
  }, [initialEmployees])

  useEffect(() => {
    setVehiclesList(initialVehicles)
  }, [initialVehicles])

  const [query, setQuery] = useState('')
  const [sucursal, setSucursal] = useState('todas')
  const [estado, setEstado] = useState('todos')
  const [selected, setSelected] = useState<Employee | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const sucursales = useMemo(
    () => branches.map(b => b.name),
    [branches]
  )

  const visible = useMemo(() => {
    let list = employeesList
    // Un conductor solo puede verse a si mismo
    if (role === 'conductor') {
      list = list.filter((e) => e.id === currentEmployeeId)
    }
    if (sucursal !== 'todas') list = list.filter((e) => e.sucursal === sucursal)
    if (estado !== 'todos') list = list.filter((e) => e.estado === estado)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (e) =>
          e.nombre.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.puesto.toLowerCase().includes(q) ||
          e.licencia?.toLowerCase().includes(q),
      )
    }
    return list
  }, [query, sucursales, estado, role, currentEmployeeId, employeesList, sucursal])

  const handleSaveEmployee = async (empData: Partial<Employee>) => {
    try {
      if (editingEmployee) {
        setEmployeesList((prev) =>
          prev.map((e) => (e.id === editingEmployee.id ? { ...e, ...empData } : e))
        )
        const { updateEmployee } = await import('@/app/actions/db')
        await updateEmployee(editingEmployee.id, empData)
      } else {
        const newTempId = `temp-${Date.now()}`
        setEmployeesList((prev) => [...prev, { id: newTempId, ...empData } as any])
        const { createEmployee } = await import('@/app/actions/db')
        await createEmployee(empData)
      }
      setIsFormOpen(false)
      setEditingEmployee(null)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-2xl mx-auto w-full">
      <PageHeader
        title="Empleados / Conductores"
        description="Personal asignado a las unidades de la flotilla."
      >
        {role !== 'conductor' && (
          <Button className="gap-2" onClick={() => { setEditingEmployee(null); setIsFormOpen(true) }}>
            <Plus className="size-4" /> Nuevo Empleado
          </Button>
        )}
      </PageHeader>

      {role === 'conductor' && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          <span>
            Como conductor solo puedes ver tu propio perfil y los vehículos que
            tienes asignados.
          </span>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, correo, puesto o licencia..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sucursal} onValueChange={(v) => setSucursal(v || "")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sucursal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las sucursales</SelectItem>
            {sucursales.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={(v) => setEstado(v || "")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="hidden items-center gap-1 rounded-md border border-border p-0.5 sm:flex">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8"
            onClick={() => setView('grid')}
            aria-label="Vista de tarjetas"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={view === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8"
            onClick={() => setView('table')}
            aria-label="Vista de tabla"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>


      {view === 'grid' && visible.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((e) => {
          const lic = licenseStatus(e.vencimientoLicencia)
          return (
            <Card
              key={e.id}
              className="group relative cursor-pointer transition-colors hover:border-primary/40"
              onClick={() => setSelected(e)}
            >
              {role !== 'conductor' && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/50 backdrop-blur"
                  onClick={(ev) => {
                    ev.stopPropagation()
                    setEditingEmployee(e)
                    setIsFormOpen(true)
                  }}
                  title="Editar empleado"
                >
                  <Pencil className="size-4 text-muted-foreground" />
                </Button>
              )}
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <Avatar className={`size-28 ring-4 ring-offset-4 shadow-sm transition-all duration-300 ${
                    e.vehiculosAsignados && e.vehiculosAsignados.length > 0 
                      ? (e.vehiculosAsignados[0] as any).telemetryStatus === 'en_movimiento'
                        ? 'ring-green-500 shadow-green-500/20' 
                        : (e.vehiculosAsignados[0] as any).telemetryStatus === 'detenido'
                          ? 'ring-blue-400 shadow-blue-400/20' 
                          : 'ring-gray-300 grayscale-[20%]'
                      : 'ring-transparent'
                  }`}>
                  <AvatarImage src={e.fotoUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {initials(e.nombre)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex flex-col items-center gap-0.5">
                  <h3 className="font-semibold text-lg">{e.nombre}</h3>
                  <p className="text-sm text-muted-foreground">{e.puesto}</p>
                  <Badge
                    variant="outline"
                    className={
                      e.estado === 'activo'
                        ? 'mt-1.5 ' + toneClasses.ok
                        : 'mt-1.5 bg-muted text-muted-foreground border-transparent'
                    }
                  >
                    {e.estado}
                  </Badge>
                </div>

                <div className="flex flex-col gap-2 text-sm text-muted-foreground items-center w-full mt-1">
                  <span className="flex items-center gap-2">
                    <Mail className="size-3.5" /> {e.email}
                  </span>
                  <span className="flex items-center gap-2">
                    <Phone className="size-3.5" /> {e.telefono}
                  </span>
                  <span className="flex items-center gap-2">
                    <Car className="size-3.5" /> {e.vehiculosAsignados?.length || 0} unidad(es) asignada(s)
                  </span>
                </div>

                <div className="w-full mt-2 border-t border-border" />
                <div className="flex items-center justify-between w-full pt-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <IdCard className="size-3.5" /> {e.licencia || 'Sin registro'}
                  </span>
                  {e.licencia && (
                    <Badge variant="outline" className={toneClasses[lic.tone]}>
                      {lic.tone !== 'ok' && (
                        <TriangleAlert className="mr-1 size-3" />
                      )}
                      {lic.label}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      )}

      {/* Vista tabla */}
      {view === 'table' && visible.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Vehículos</TableHead>
                  <TableHead>Licencia</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((e) => {
                  const lic = licenseStatus(e.vencimientoLicencia)
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 border border-border">
                            <AvatarImage src={e.fotoUrl || undefined} className="object-cover" />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {initials(e.nombre)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium truncate max-w-[150px]">{e.nombre}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">{e.puesto}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="truncate max-w-[150px]">{e.email}</span>
                          <span className="text-muted-foreground">{e.telefono}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{e.vehiculosAsignados?.length || 0} asignados</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{e.licencia || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${toneClasses[lic.tone]}`}>
                          {lic.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={e.estado === 'ACTIVO' ? toneClasses.ok : 'bg-muted text-muted-foreground border-transparent'}>
                          {e.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {role !== 'conductor' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingEmployee(e)
                              setIsFormOpen(true)
                            }}
                          >
                            <Pencil className="size-4 text-muted-foreground" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {visible.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          No se encontraron empleados con los filtros seleccionados.
        </div>
      )}

      <EmployeeDialog employee={selected} vehiclesList={vehiclesList} onClose={() => setSelected(null)} />
      <EmployeeFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveEmployee} 
        employee={editingEmployee}
        sucursales={branches}
        areas={departments}
      />
    </div>
  )
}

function EmployeeDialog({
  employee,
  vehiclesList,
  onClose,
}: {
  employee: Employee | null
  vehiclesList: any[]
  onClose: () => void
}) {
  return (
    <Dialog open={!!employee} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md overflow-hidden p-0 border-none bg-background shadow-2xl">
        {employee && (
          <>
            <div className="relative h-24 w-full bg-gradient-to-r from-primary/80 to-primary/40" />
            <DialogHeader className="px-6 pt-0 pb-4 relative -mt-12 text-center items-center">
              <Avatar className="size-20 border-4 border-background shadow-sm mb-2">
                <AvatarImage src={employee.fotoUrl || ''} className="object-cover bg-white" />
                <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                  {initials(employee.nombre)}
                </AvatarFallback>
              </Avatar>
              <DialogTitle className="text-xl font-bold">
                {employee.nombre}
              </DialogTitle>
              <p className="text-sm text-muted-foreground font-medium">
                {employee.puesto} • {employee.area}
              </p>
              <Badge variant="outline" className={`mt-2 ${toneClasses[employee.estado === 'ACTIVO' ? 'ok' : 'danger']}`}>
                {employee.estado}
              </Badge>
            </DialogHeader>

            <div className="px-6 pb-6 space-y-6">
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 rounded-lg bg-muted/30 p-4 border border-border/50 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Mail className="size-3.5" /> Correo</p>
                  <p className="font-medium truncate" title={employee.email || '—'}>{employee.email || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Phone className="size-3.5" /> Teléfono</p>
                  <p className="font-medium">{employee.telefono || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><MapPin className="size-3.5" /> Sucursal</p>
                  <p className="font-medium">{employee.sucursal || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><IdCard className="size-3.5" /> Licencia</p>
                  <p className="font-medium">{employee.licencia || '—'}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Calendar className="size-3.5" /> Vencimiento Licencia</p>
                  <p className="font-medium">{employee.vencimientoLicencia ? new Date(employee.vencimientoLicencia).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Car className="size-4 text-primary" /> Vehículos Asignados
                </p>
                <div className="flex flex-col gap-2">
                  {employee.vehiculosAsignados.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                      Sin vehículos asignados en este momento.
                    </div>
                  )}
                  {employee.vehiculosAsignados.map((vAsig: any) => {
                    const vId = typeof vAsig === 'string' ? vAsig : vAsig.id
                    const v = vehiclesList.find((vec) => vec.id === vId)
                    if (!v) return null
                    return (
                      <Link
                        key={v.id}
                        href={`/vehiculos/${v.id}`}
                        className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm transition-all hover:border-primary/40 hover:shadow-sm group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:scale-110 transition-transform">
                            <Car className="size-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{v.nombreInterno || v.marca}</p>
                            <p className="text-xs text-muted-foreground">{v.marca} {v.modelo}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs uppercase tracking-wider">{v.placas}</Badge>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5">{value}</p>
    </div>
  )
}
