'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, LayoutGrid, List, Plus } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { VehicleStatusBadge, TelemetryBadge, InsuranceBadge } from '@/components/status-badge'
import { useRole } from '@/components/role-provider'
import {
  currency,
  numberFmt,
  totalGastos,
  vehicleStatusLabel,
  type VehicleStatus,
  type Vehicle,
} from '@/lib/mock-data'
import { createVehicle, updateVehicle, updateVehicleOrder } from '@/app/actions/db'
import { VehicleFormModal } from './vehicle-form-modal'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { SortableVehicleCard } from './sortable-vehicle-card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Pencil, Car } from 'lucide-react'

export type VehicleListProps = {
  initialVehicles: Vehicle[]
  initialEmployees: any[]
  branches?: any[]
}

export function VehicleList({ 
  initialVehicles, 
  initialEmployees, 
  branches = [] 
}: VehicleListProps) {
  const { role, config, can } = useRole()
  const isConductor = role === 'conductor'

  const [vehiclesList, setVehiclesList] = useState<any[]>(initialVehicles)
  const [employeesList, setEmployeesList] = useState<any[]>(initialEmployees)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = vehiclesList.findIndex((i) => i.id === active.id);
      const newIndex = vehiclesList.findIndex((i) => i.id === over.id);
      
      const newItems = arrayMove(vehiclesList, oldIndex, newIndex);
      
      // Actualizamos el estado visual primero (Optimistic UI)
      setVehiclesList(newItems);
      
      // Disparamos la accion del servidor fuera del setState para evitar efectos secundarios durante el renderizado
      const updates = newItems.map((item, index) => ({ id: item.id, orden: index }));
      updateVehicleOrder(updates).catch(console.error);
    }
  };

  useEffect(() => {
    setVehiclesList(initialVehicles)
  }, [initialVehicles])

  useEffect(() => {
    setEmployeesList(initialEmployees)
  }, [initialEmployees])

  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState<'todos' | VehicleStatus>('todos')
  const [sucursal, setSucursal] = useState<string>('todas')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  const base = isConductor
    ? vehiclesList.filter((v) => v.empleadoId === config.empleadoId)
    : vehiclesList

  const sucursales = useMemo(
    () => branches.map(b => b.name),
    [branches]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return base.filter((v) => {
      const emp = employeesList.find(e => e.id === v.empleadoId)
      const matchQ =
        !q ||
        [v.nombreInterno, v.placas, v.numeroEconomico, v.marca, v.modelo, emp?.nombre ?? '']
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchEstado = estado === 'todos' || v.estado === estado
      const matchSucursal = sucursal === 'todas' || v.sucursal === sucursal
      return matchQ && matchEstado && matchSucursal
    })
  }, [base, query, estado, sucursal, employeesList])

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-2xl mx-auto w-full">
      <PageHeader
        title={isConductor ? 'Mi vehículo' : 'Vehículos'}
        description={
          isConductor
            ? 'Consulta la información de tu unidad asignada.'
            : `${filtered.length} unidades en la flotilla`
        }
      >
        {can('crear_editar') && !isConductor && (
          <Button className="gap-2" onClick={() => { setEditingVehicle(null); setIsFormOpen(true) }}>
            <Plus className="size-4" />
            Nuevo vehículo
          </Button>
        )}
      </PageHeader>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, placas, económico, marca o conductor…"
            className="pl-9"
          />
        </div>
        <Select value={estado} onValueChange={(v) => setEstado(v as typeof estado)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {(Object.keys(vehicleStatusLabel) as VehicleStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {vehicleStatusLabel[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isConductor && (
          <Select value={sucursal} onValueChange={(v) => setSucursal(v || "")}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Sucursal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las sucursales</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron vehículos con los filtros actuales.
          </CardContent>
        </Card>
      )}

      {/* Vista tarjetas */}
      {view === 'grid' && filtered.length > 0 && (
        <DndContext id="vehiculos-dnd-context" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map(v => v.id)} strategy={rectSortingStrategy}>
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
              {filtered.map((v) => {
                const emp = employeesList.find(e => e.id === v.empleadoId)
                const isDragEnabled = query === '' && estado === 'todos' && sucursal === 'todas' && !isConductor
                return (
                  <SortableVehicleCard 
                    key={v.id} 
                    v={v} 
                    emp={emp} 
                    isConductor={isConductor} 
                    canEdit={can('crear_editar')} 
                    onEdit={(vehicle) => { setEditingVehicle(vehicle); setIsFormOpen(true); }}
                    isDragEnabled={isDragEnabled}
                  />
                )
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Vista tabla */}
      {view === 'table' && filtered.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Placas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>GPS</TableHead>
                  <TableHead>Seguro</TableHead>
                  <TableHead>Conductor</TableHead>
                  <TableHead className="text-right">Km</TableHead>
                  <TableHead className="text-right">Gasto total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v) => {
              const emp = employeesList.find(e => e.id === v.empleadoId)
              return (
                    <TableRow key={v.id} className="cursor-pointer">
                      <TableCell>
                        <Link href={`/vehiculos/${v.id}`} className="block">
                          <p className="font-medium">{v.nombreInterno}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {v.numeroEconomico} · {v.marca} {v.modelo}
                          </p>
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{v.placas}</TableCell>
                      <TableCell>
                        <VehicleStatusBadge status={v.estado} />
                      </TableCell>
                      <TableCell>
                        <TelemetryBadge status={v.telemetria.estado} />
                      </TableCell>
                      <TableCell>
                        <InsuranceBadge status={v.seguro.estado} />
                      </TableCell>
                      <TableCell className="text-sm">{emp?.nombre ?? '—'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {numberFmt(v.kmActual)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        {currency(totalGastos(v))}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <VehicleFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={async (vehData) => {
          try {
            if (editingVehicle) {
              await updateVehicle(editingVehicle.id, vehData)
            } else {
              await createVehicle(vehData)
            }
            setIsFormOpen(false)
          } catch (e) {
            console.error(e)
            alert('Error al guardar vehículo')
          }
        }}
        vehicle={editingVehicle}
        sucursales={branches}
      />
    </div>
  )
}
