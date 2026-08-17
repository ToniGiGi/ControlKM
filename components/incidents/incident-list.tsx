'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Calendar, DollarSign, LayoutGrid, List, FileText, Pencil, TriangleAlert, ShieldAlert, CarFront, Settings2, ShieldCheck, Siren } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IncidentFormModal } from './incident-form-modal'
import { createIncident, updateIncident, deleteIncident } from '@/app/actions/db'

type IncidentListProps = {
  initialIncidents: any[]
  vehicles: any[]
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'ALTA': return 'border-destructive text-destructive bg-destructive/10'
    case 'MEDIA': return 'border-amber-500 text-amber-600 bg-amber-500/10'
    case 'BAJA': return 'border-emerald-500 text-emerald-600 bg-emerald-500/10'
    default: return 'border-primary text-primary bg-primary/10'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ABIERTA': return 'bg-destructive/90 text-destructive-foreground'
    case 'EN_REVISION': return 'bg-amber-500/90 text-white'
    case 'RESUELTA': return 'bg-emerald-500/90 text-white'
    case 'CERRADA': return 'bg-muted-foreground text-white'
    default: return 'bg-primary text-primary-foreground'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'CHOQUE': return <CarFront className="size-4" />
    case 'FALLO MECANICO': return <Settings2 className="size-4" />
    case 'MULTA': return <ShieldAlert className="size-4" />
    case 'EXCESO DE VELOCIDAD': return <Siren className="size-4" />
    default: return <TriangleAlert className="size-4" />
  }
}

export function IncidentList({ initialIncidents, vehicles }: IncidentListProps) {
  const [incidents, setIncidents] = useState(initialIncidents)
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('todos')
  const [gravedad, setGravedad] = useState('todas')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingIncident, setEditingIncident] = useState<any | null>(null)

  const handleSave = async (data: any) => {
    try {
      if (editingIncident) {
        const updated = await updateIncident(editingIncident.id, data)
        setIncidents(prev => prev.map(m => m.id === updated.id ? { ...updated, vehiculo: vehicles.find(v => v.id === updated.vehiculoId) } : m))
      } else {
        const created = await createIncident(data)
        setIncidents(prev => [{ ...created, vehiculo: vehicles.find(v => v.id === created.vehiculoId) }, ...prev])
      }
      setIsFormOpen(false)
      setEditingIncident(null)
    } catch (err) {
      console.error(err)
      alert('Error al guardar la incidencia')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta incidencia?')) {
      try {
        await deleteIncident(id)
        setIncidents(prev => prev.filter(m => m.id !== id))
      } catch (err) {
        console.error(err)
        alert('Error al eliminar')
      }
    }
  }

  const filtered = useMemo(() => {
    return incidents.filter((m) => {
      const v = m.vehiculo || vehicles.find(v => v.id === m.vehiculoId)
      const q = query.toLowerCase()
      const matchQ =
        !q ||
        [v?.nombreInterno, v?.placas, m.tipo, m.descripcion]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchStatus = estado === 'todos' || m.estado === estado.toUpperCase()
      const matchSeverity = gravedad === 'todas' || m.gravedad === gravedad.toUpperCase()
      return matchQ && matchStatus && matchSeverity
    })
  }, [incidents, query, estado, gravedad, vehicles])

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '-'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(val)
  }

  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'Sin fecha'
    const date = new Date(dateInput)
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(date)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-2xl mx-auto w-full">
      <PageHeader
        title="Incidencias"
        description={`${filtered.length} incidencias registradas`}
      >
        <Button className="gap-2" onClick={() => { setEditingIncident(null); setIsFormOpen(true) }}>
          <Plus className="size-4" />
          Nueva Incidencia
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por vehículo, placas o descripción..."
            className="pl-9"
          />
        </div>
        <Select value={estado} onValueChange={(v) => setEstado(v || "")}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="ABIERTA">Abierta</SelectItem>
            <SelectItem value="EN_REVISION">En Revisión</SelectItem>
            <SelectItem value="RESUELTA">Resuelta</SelectItem>
            <SelectItem value="CERRADA">Cerrada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={gravedad} onValueChange={(v) => setGravedad(v || "")}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Gravedad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Cualquier gravedad</SelectItem>
            <SelectItem value="ALTA">Alta</SelectItem>
            <SelectItem value="MEDIA">Media</SelectItem>
            <SelectItem value="BAJA">Baja</SelectItem>
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
            No se encontraron incidencias con los filtros actuales.
          </CardContent>
        </Card>
      )}

      {view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((m) => (
            <Card key={m.id} className="flex flex-col relative overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8 rounded-md bg-muted p-1">
                      <AvatarFallback className="rounded-md bg-transparent text-primary">
                        {getTypeIcon(m.tipo)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {m.vehiculo?.nombreInterno || 'Vehículo Desconocido'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        {m.vehiculo?.placas}
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        {m.tipo}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(m.estado)}>
                    {m.estado.replace('_', ' ')}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 -mt-1.5 -mr-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => {
                      setEditingIncident(m)
                      setIsFormOpen(true)
                    }}
                    title="Editar incidencia"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-sm mt-2">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase font-medium">Fecha</p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <Calendar className="size-4 text-muted-foreground" />
                      {formatDate(m.fecha)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase font-medium">Gravedad</p>
                    <Badge variant="outline" className={getSeverityColor(m.gravedad)}>
                      {m.gravedad}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-xs uppercase font-medium">Costo (Aprox)</p>
                    <p className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                      <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
                      {formatCurrency(m.costo)}
                    </p>
                  </div>
                </div>
                
                {m.descripcion && (
                  <div className="mt-4 p-3 bg-muted/40 rounded-md border border-border/50 text-sm">
                    <p className="flex items-start gap-1.5 text-muted-foreground">
                      <FileText className="size-4 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{m.descripcion}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Gravedad</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">{m.vehiculo?.nombreInterno}</div>
                      <div className="text-xs text-muted-foreground">{m.vehiculo?.placas}</div>
                    </TableCell>
                    <TableCell className="font-medium">{m.tipo}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(m.fecha)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(m.estado)}>
                        {m.estado.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getSeverityColor(m.gravedad)}>
                        {m.gravedad}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground" title={m.descripcion}>{m.descripcion || '-'}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(m.costo)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8"
                        onClick={() => {
                          setEditingIncident(m)
                          setIsFormOpen(true)
                        }}
                      >
                        <Pencil className="size-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {isFormOpen && (
        <IncidentFormModal
          incident={editingIncident}
          vehicles={vehicles}
          onClose={() => {
            setIsFormOpen(false)
            setEditingIncident(null)
          }}
          onSave={handleSave}
          onDelete={editingIncident ? handleDelete : undefined}
        />
      )}
    </div>
  )
}
