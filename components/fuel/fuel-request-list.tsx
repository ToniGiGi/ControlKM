'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Fuel, CreditCard, Banknote, Map, CheckCircle, XCircle, FileDown, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FuelPdfDocument } from './fuel-pdf-document'
import { approveFuelRequest, rejectFuelRequest, deleteFuelRequest } from '@/app/actions/db'
import { useRole } from '@/components/role-provider'
import { ListPagination } from '@/components/ui/list-pagination'

const PAGE_SIZE = 12

type FuelRequestListProps = {
  initialRequests: any[]
  vehicles: any[]
}
export function FuelRequestList({ initialRequests, vehicles }: FuelRequestListProps) {
  const { role, config } = useRole()
  const isConductor = role === 'conductor'

  const [requests, setRequests] = useState(initialRequests)
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('todos')
  const [page, setPage] = useState(1)

  const [pdfData, setPdfData] = useState<any | null>(null)

  const handleApprove = async (id: string) => {
    if (confirm('¿Aprobar esta solicitud de viáticos y combustible?')) {
      try {
        await approveFuelRequest(id)
        setRequests(prev => prev.map(r => r.id === id ? { ...r, estado: 'APROBADA' } : r))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleReject = async (id: string) => {
    if (confirm('¿Rechazar esta solicitud?')) {
      try {
        await rejectFuelRequest(id)
        setRequests(prev => prev.map(r => r.id === id ? { ...r, estado: 'RECHAZADA' } : r))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar permanentemente este registro?')) {
      try {
        await deleteFuelRequest(id)
        setRequests(prev => prev.filter(r => r.id !== id))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const v = r.vehiculo || vehicles.find(v => v.id === r.vehiculoId)
      
      // Si es conductor, solo mostrar las de su vehículo
      if (isConductor && v?.empleadoId !== config.empleadoId) {
        return false
      }
      
      const q = query.toLowerCase()
      const matchQ =
        !q ||
        [v?.nombreInterno, v?.placas, r.motivo, r.rutas, r.solicitanteNombre]
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchEstado = estado === 'todos' || r.estado === estado.toUpperCase()
      return matchQ && matchEstado
    })
  }, [requests, query, estado, vehicles])

  useEffect(() => { setPage(1) }, [query, estado])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(val || 0)
  }

  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'Sin fecha'
    const date = new Date(dateInput)
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-2xl mx-auto w-full relative">
      {pdfData && (
        <FuelPdfDocument 
          data={pdfData} 
          onClose={() => setPdfData(null)} 
        />
      )}

      <PageHeader
        title="Solicitudes de Combustible"
        description={`${filtered.length} viáticos gestionados`}
      >
        <Link href="/combustible/nueva">
          <Button className="gap-2">
            <Plus className="size-4" />
            Nueva Solicitud
          </Button>
        </Link>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por vehículo, solicitante, ruta o motivo..."
            className="pl-9"
          />
        </div>
        <Select value={estado} onValueChange={(v) => setEstado(v || "")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="aprobada">Aprobadas</SelectItem>
            <SelectItem value="rechazada">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron solicitudes con los filtros actuales.
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {paginated.map((r) => {
            const isPending = r.estado === 'PENDIENTE'
            const isApproved = r.estado === 'APROBADA'
            const badgeClass = isApproved 
              ? 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10' 
              : isPending 
                ? 'border-amber-500/50 text-amber-600 bg-amber-500/10'
                : 'border-red-500/50 text-red-600 bg-red-500/10'

            return (
              <Card key={r.id} className="flex flex-col relative overflow-hidden transition-all hover:shadow-md border-t-4 border-t-primary/10">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-10 rounded-md bg-muted p-1">
                        <AvatarFallback className="rounded-md bg-transparent text-primary">
                          <Fuel className="size-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {r.vehiculo?.nombreInterno || 'Vehículo Desconocido'}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{r.solicitanteNombre || 'Sin nombre'} • {formatDate(r.fechaSolicitud)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={badgeClass}>
                      {r.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <div className="mb-4 text-sm bg-muted/40 p-3 rounded-md border border-border/50">
                    <p className="font-semibold text-foreground mb-1">{r.motivo}</p>
                    <div className="flex items-start gap-1.5 text-muted-foreground">
                      <Map className="size-4 shrink-0 mt-0.5 text-primary/70" />
                      <span className="line-clamp-2 leading-relaxed text-xs">{r.rutas}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-sm mt-2">
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Gasolina</p>
                      <p className="flex items-center gap-1.5 font-medium">
                        <Fuel className="size-3.5 text-muted-foreground" />
                        {r.tipoGasolina}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.litrosSolicitados.toFixed(1)} L</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Distancia</p>
                      <p className="flex items-center gap-1.5 font-medium">
                        <Map className="size-3.5 text-muted-foreground" />
                        {new Intl.NumberFormat().format(r.kmHolgura)} km
                      </p>
                      <p className="text-xs text-muted-foreground">{r.rendimiento} km/l</p>
                    </div>
                    <div className="space-y-1 border-l pl-3 border-border/50">
                      <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Costo Total</p>
                      <p className="flex items-center gap-1.5 font-bold text-base text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(r.costoTotal)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{r.numCasetas ? `+${r.numCasetas} Casetas` : 'Sin peajes'}</p>
                    </div>
                  </div>

                  {/* Botones de acción inferior */}
                  <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setPdfData(r)}>
                        <FileDown className="size-3.5" />
                        Generar PDF
                      </Button>
                    </div>
                    
                    {r.estado === 'PENDIENTE' && !isConductor && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(r.id)}
                          className="flex-1 sm:flex-none text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="size-4 mr-1" />
                          Rechazar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(r.id)}
                          className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle className="size-4 mr-1" />
                          Aprobar
                        </Button>
                      </div>
                    )}
                    {(!isConductor || r.estado === 'PENDIENTE') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500/70 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(r.id)}
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

      <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
    </div>
  )
}
