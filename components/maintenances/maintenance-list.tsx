'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Calendar, Gauge, Wrench, Pencil, FileText, LayoutGrid, List, DollarSign, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MaintenanceFormModal } from './maintenance-form-modal'
import { createMaintenance, updateMaintenance, deleteMaintenance, approveMaintenance, rejectMaintenance } from '@/app/actions/db'
import { useRole } from '@/components/role-provider'

type MaintenanceListProps = {
  initialMaintenances: any[]
  vehicles: any[]
}

export function MaintenanceList({ initialMaintenances, vehicles }: MaintenanceListProps) {
  const { role, config, can } = useRole()
  const isConductor = role === 'conductor'
  
  const [maintenances, setMaintenances] = useState(initialMaintenances)
  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState('todos')
  const [estado, setEstado] = useState('todas')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMaintenance, setEditingMaintenance] = useState<any | null>(null)

  const handleSave = async (data: any) => {
    try {
      if (editingMaintenance) {
        const updated = await updateMaintenance(editingMaintenance.id, data)
        setMaintenances(prev => prev.map(m => m.id === updated.id ? { ...updated, vehiculo: vehicles.find(v => v.id === updated.vehiculoId) } : m))
      } else {
        const created = await createMaintenance(data)
        setMaintenances(prev => [{ ...created, vehiculo: vehicles.find(v => v.id === created.vehiculoId) }, ...prev])
      }
      setIsFormOpen(false)
      setEditingMaintenance(null)
    } catch (err) {
      console.error(err)
      alert('Error al guardar el mantenimiento')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro de mantenimiento?')) {
      try {
        await deleteMaintenance(id)
        setMaintenances(prev => prev.filter(m => m.id !== id))
      } catch (err) {
        console.error(err)
        alert('Error al eliminar')
      }
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const updated = await approveMaintenance(id)
      setMaintenances(prev => prev.map(m => m.id === id ? { ...m, estado: 'APROBADA' } : m))
    } catch (err) {
      console.error(err)
      alert('Error al aprobar el mantenimiento')
    }
  }

  const handleReject = async (id: string) => {
    try {
      const updated = await rejectMaintenance(id)
      setMaintenances(prev => prev.map(m => m.id === id ? { ...m, estado: 'RECHAZADA' } : m))
    } catch (err) {
      console.error(err)
      alert('Error al rechazar el mantenimiento')
    }
  }

  const filtered = useMemo(() => {
    return maintenances.filter((m) => {
      const v = m.vehiculo || vehicles.find(v => v.id === m.vehiculoId)
      if (isConductor && v?.empleadoId !== config.empleadoId) {
        return false
      }
      const q = query.toLowerCase()
      const matchQ =
        !q ||
        [v?.nombreInterno, v?.placas, m.taller, m.descripcion]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchTipo = tipo === 'todos' || m.tipo === tipo.toUpperCase()
      const matchEstado = estado === 'todas' || m.estado === estado.toUpperCase()
      return matchQ && matchTipo && matchEstado
    })
  }, [maintenances, query, tipo, estado, vehicles])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(val || 0)
  }

  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'Sin fecha'
    const date = new Date(dateInput)
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(date)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-2xl mx-auto w-full">
      <PageHeader
        title={isConductor ? "Mis mantenimientos" : "Mantenimientos"}
        description={isConductor ? "Registra y consulta los mantenimientos de tu unidad" : `${filtered.length} mantenimientos registrados`}
      >
        <Button className="gap-2" onClick={() => { setEditingMaintenance(null); setIsFormOpen(true) }}>
          <Plus className="size-4" />
          Nuevo Mantenimiento
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por vehículo, placas, taller o descripción..."
            className="pl-9"
          />
        </div>
        <Select value={tipo} onValueChange={(v) => setTipo(v || "")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="preventivo">Preventivos</SelectItem>
            <SelectItem value="correctivo">Correctivos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={estado} onValueChange={(v) => setEstado(v || "")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos los estados</SelectItem>
            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
            <SelectItem value="APROBADA">Aprobada</SelectItem>
            <SelectItem value="RECHAZADA">Rechazada</SelectItem>
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

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron mantenimientos con los filtros actuales.
          </CardContent>
        </Card>
      )}

      {view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((m) => {
            const estadoActual = m.estado || 'PENDIENTE'
            const isPending = estadoActual === 'PENDIENTE'
            const isApproved = estadoActual === 'APROBADA'
            const isPreventivo = m.tipo === 'PREVENTIVO'
            const badgeClass = isApproved 
              ? 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10' 
              : isPending 
                ? 'border-amber-500/50 text-amber-600 bg-amber-500/10'
                : 'border-red-500/50 text-red-600 bg-red-500/10'

            return (
              <Card key={m.id} className="flex flex-col relative overflow-hidden transition-all hover:shadow-md border-t-4 border-t-primary/10">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8 rounded-md bg-muted p-1">
                        <AvatarFallback className="rounded-md bg-transparent text-primary">
                          <Wrench className="size-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {m.vehiculo?.nombreInterno || 'Vehículo Desconocido'}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{m.vehiculo?.placas}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={badgeClass}>
                      {estadoActual}
                    </Badge>
                    <Badge variant="outline" className={isPreventivo ? 'border-primary/50 text-primary bg-primary/10' : 'border-destructive/50 text-destructive bg-destructive/10'}>
                      {m.tipo}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm mt-2">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs uppercase font-medium">Fecha</p>
                      <p className="flex items-center gap-1.5 font-medium">
                        <Calendar className="size-4 text-muted-foreground" />
                        {formatDate(m.fecha)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-xs uppercase font-medium">Kilometraje</p>
                      <p className="flex items-center gap-1.5 font-medium">
                        <Gauge className="size-4 text-muted-foreground" />
                        {new Intl.NumberFormat().format(m.km || 0)} km
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-0.5">Costo Total</p>
                      <p className="flex items-center justify-end gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(m.costo)}
                      </p>
                    </div>
                  </div>
                  
                  {m.descripcion && (
                    <div className="mt-4 pt-3 border-t border-border/50 text-sm">
                      <div className="flex gap-2">
                        <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-muted-foreground line-clamp-2">{m.descripcion}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center min-h-[48px]">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => { setEditingMaintenance(m); setIsFormOpen(true); }}>
                        <Pencil className="size-3.5" />
                        Editar Mantenimiento
                      </Button>
                    </div>

                    {estadoActual === 'PENDIENTE' && !isConductor && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(m.id)}
                          className="flex-1 sm:flex-none text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full border-red-200"
                        >
                          <XCircle className="size-4 mr-1" />
                          Rechazar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(m.id)}
                          className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
                        >
                          <CheckCircle className="size-4 mr-1" />
                          Aprobar
                        </Button>
                      </div>
                    )}

                    {(!isConductor || estadoActual === 'PENDIENTE') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500/70 hover:text-red-600 hover:bg-red-50 -mr-2"
                        onClick={() => handleDelete(m.id)}
                        title="Eliminar mantenimiento"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {view === 'table' && filtered.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Taller</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">{m.vehiculo?.nombreInterno}</div>
                      <div className="text-xs text-muted-foreground">{m.vehiculo?.placas}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={m.tipo === 'PREVENTIVO' ? 'border-primary/50 text-primary bg-primary/10' : 'border-destructive/50 text-destructive bg-destructive/10'}>
                        {m.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={m.estado === 'APROBADA' ? 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10' : (!m.estado || m.estado === 'PENDIENTE') ? 'border-amber-500/50 text-amber-600 bg-amber-500/10' : 'border-red-500/50 text-red-600 bg-red-500/10'}>
                        {m.estado || 'PENDIENTE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(m.fecha)}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={m.taller}>{m.taller || '-'}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(m.costo)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8"
                          onClick={() => {
                            setEditingMaintenance(m)
                            setIsFormOpen(true)
                          }}
                        >
                          <Pencil className="size-4 text-muted-foreground" />
                        </Button>
                        {(!isConductor || (m.estado || 'PENDIENTE') === 'PENDIENTE') && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 text-red-500/70 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(m.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                        {(m.estado || 'PENDIENTE') === 'PENDIENTE' && !isConductor && (
                          <div className="flex gap-1 ml-1 border-l pl-1 border-border/50">
                            <Button size="icon" variant="ghost" className="size-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => handleApprove(m.id)}>
                              <CheckCircle className="size-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="size-8 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleReject(m.id)}>
                              <XCircle className="size-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {isFormOpen && (
        <MaintenanceFormModal
          maintenance={editingMaintenance}
          vehicles={vehicles}
          onClose={() => {
            setIsFormOpen(false)
            setEditingMaintenance(null)
          }}
          onSave={handleSave}
          onDelete={editingMaintenance ? handleDelete : undefined}
        />
      )}
    </div>
  )
}
