'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Calendar, LayoutGrid, List, MapPin, Navigation, CarFront, User, Map, Fuel, DollarSign, Route } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { ListPagination } from '@/components/ui/list-pagination'

const PAGE_SIZE = 12

type TripListProps = {
  initialTrips: any[]
}

export function TripList({ initialTrips }: TripListProps) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return initialTrips.filter((m) => {
      // Búsqueda de texto
      const q = query.toLowerCase()
      const matchQ = !q || [m.vehiculo?.nombreInterno, m.vehiculo?.placas, m.rutas, m.solicitanteNombre].join(' ').toLowerCase().includes(q)

      // Filtro de fechas
      let matchDate = true
      if (startDate || endDate) {
        const tripDate = new Date(m.fechaSolicitud)
        tripDate.setHours(0, 0, 0, 0)
        
        if (startDate) {
          const sDate = new Date(startDate)
          sDate.setHours(0, 0, 0, 0)
          sDate.setDate(sDate.getDate() + 1) // Ajuste por zona horaria local en inputs type date
          if (tripDate < sDate) matchDate = false
        }
        
        if (endDate) {
          const eDate = new Date(endDate)
          eDate.setHours(0, 0, 0, 0)
          eDate.setDate(eDate.getDate() + 1) // Ajuste por zona horaria local en inputs type date
          if (tripDate > eDate) matchDate = false
        }
      }

      return matchQ && matchDate
    })
  }, [initialTrips, query, startDate, endDate])

  useEffect(() => { setPage(1) }, [query, startDate, endDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

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
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-2xl mx-auto w-full">
      <PageHeader
        title="Historial de Viajes"
        description={`${filtered.length} viajes registrados y confirmados`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por vehículo, rutas o empleado..."
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-1 text-sm shadow-sm">
            <span className="text-muted-foreground font-medium">Desde:</span>
            <input 
              type="date" 
              className="bg-transparent outline-none cursor-pointer"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-1 text-sm shadow-sm">
            <span className="text-muted-foreground font-medium">Hasta:</span>
            <input 
              type="date" 
              className="bg-transparent outline-none cursor-pointer"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {(startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate('') }} className="h-9 px-2 text-muted-foreground hover:text-foreground">
              Limpiar
            </Button>
          )}
        </div>
        
        <div className="hidden items-center gap-1 rounded-md border border-border p-0.5 sm:flex ml-auto">
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
          <CardContent className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center">
            <Route className="size-12 text-muted-foreground/50 mb-4" />
            <p>No se encontraron viajes aprobados.</p>
            <p className="text-xs mt-1">Recuerda que los viajes se generan automáticamente al aprobar una solicitud de viáticos o combustible.</p>
          </CardContent>
        </Card>
      )}

      {view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {paginated.map((m) => {
            const isRedondo = m.rutas.toLowerCase().includes('redondo');
            
            return (
              <Card key={m.id} className="flex flex-col relative overflow-hidden transition-all hover:shadow-md border-l-4 border-l-emerald-500">
                <CardHeader className="flex flex-row items-start justify-between pb-2 bg-muted/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-10 rounded-md bg-background border shadow-sm">
                        <AvatarFallback className="rounded-md bg-transparent text-primary">
                          <CarFront className="size-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base font-semibold text-primary">
                          {m.vehiculo?.nombreInterno || 'Vehículo Desconocido'}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium mt-0.5">
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px] h-5 bg-background">
                            {m.vehiculo?.placas}
                          </Badge>
                          <span className="text-muted-foreground/50">•</span>
                          <User className="size-3" />
                          {m.solicitanteNombre || 'Sin empleado asignado'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 flex items-center gap-1">
                    CONFIRMADO
                  </Badge>
                </CardHeader>

                <CardContent className="flex-1 pt-4 pb-5 space-y-5">
                  {/* Ruta Principal */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center mt-1">
                      <MapPin className="size-4 text-emerald-500" />
                      <div className="w-[2px] h-6 bg-gradient-to-b from-emerald-500/50 to-primary/50 my-1 rounded-full"></div>
                      <Navigation className="size-4 text-primary" />
                    </div>
                    <div className="space-y-1 flex-1 pt-0.5">
                      <p className="text-xs text-muted-foreground font-semibold tracking-wider uppercase">Ruta del Viaje</p>
                      <p className="text-base font-medium leading-tight">
                        {m.rutas || 'Sin ruta especificada'}
                      </p>
                      {isRedondo && (
                        <Badge variant="secondary" className="mt-1.5 text-[10px] py-0 h-4">
                          Viaje Redondo
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Estadisticas Grid */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                    <div className="space-y-1 bg-muted/30 p-2.5 rounded-lg border border-border/50">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold flex items-center gap-1">
                        <Map className="size-3" /> Distancia
                      </p>
                      <p className="font-semibold text-foreground">
                        {m.kmAproximado + (m.kmHolgura || 0)} <span className="text-xs text-muted-foreground font-normal">km</span>
                      </p>
                    </div>
                    
                    <div className="space-y-1 bg-muted/30 p-2.5 rounded-lg border border-border/50">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold flex items-center gap-1">
                        <Fuel className="size-3" /> Combustible
                      </p>
                      <p className="font-semibold text-foreground">
                        {m.litrosSolicitados} <span className="text-xs text-muted-foreground font-normal">L</span>
                      </p>
                    </div>
                    
                    <div className="space-y-1 bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                      <p className="text-emerald-700 dark:text-emerald-400 text-[10px] uppercase font-bold flex items-center gap-1">
                        <DollarSign className="size-3" /> Costo Total
                      </p>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(m.costoTotal)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Footer Fecha */}
                  <div className="flex items-center text-xs text-muted-foreground font-medium pt-2">
                    <Calendar className="size-3.5 mr-1.5 text-muted-foreground/70" />
                    Registrado el {formatDate(m.fechaSolicitud)}
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
                  <TableHead>Fecha</TableHead>
                  <TableHead>Vehículo</TableHead>
                  <TableHead>Conductor</TableHead>
                  <TableHead>Rutas</TableHead>
                  <TableHead className="text-right">Distancia</TableHead>
                  <TableHead className="text-right">Costo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(m.fechaSolicitud)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-primary">{m.vehiculo?.nombreInterno}</div>
                      <div className="text-xs text-muted-foreground">{m.vehiculo?.placas}</div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {m.solicitanteNombre || '-'}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate" title={m.rutas}>
                      {m.rutas || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {m.kmAproximado + (m.kmHolgura || 0)} km
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(m.costoTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
    </div>
  )
}
