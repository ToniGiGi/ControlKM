'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Wallet, Utensils, BedDouble, Car, CheckCircle, XCircle, FileDown, Trash2, FileText, Fuel, LayoutGrid, List } from 'lucide-react'
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
import { TravelPdfDocument } from './travel-pdf-document'
import { SignatureModal } from '@/components/shared/signature-modal'
import { RejectModal } from '@/components/shared/reject-modal'
import { approveTravelRequest, rejectTravelRequest, deleteTravelRequest } from '@/app/actions/db'
import { useRole } from '@/components/role-provider'
import { ListPagination } from '@/components/ui/list-pagination'

const PAGE_SIZE = 12

type TravelRequestListProps = {
  initialRequests: any[]
}

export function TravelRequestList({ initialRequests }: TravelRequestListProps) {
  const { role, config } = useRole()
  const isConductor = role === 'conductor'

  const [requests, setRequests] = useState(initialRequests)
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('todos')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)

  const [pdfData, setPdfData] = useState<any | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const handleApprove = (id: string) => {
    setApprovingId(id)
  }

  const handleConfirmApproveSignature = async (firmaAprobadorUrl: string) => {
    if (!approvingId) return
    try {
      await approveTravelRequest(approvingId, firmaAprobadorUrl)
      setRequests(prev => prev.map(r => r.id === approvingId ? { ...r, estado: 'APROBADA', firmaAprobadorUrl } : r))
    } catch (err) {
      console.error(err)
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = (id: string) => {
    setRejectingId(id)
  }

  const handleConfirmReject = async (observaciones: string) => {
    if (!rejectingId) return
    await rejectTravelRequest(rejectingId, observaciones)
    setRequests(prev => prev.map(r => r.id === rejectingId ? { ...r, estado: 'RECHAZADA', observacionesRechazo: observaciones } : r))
    setRejectingId(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar permanentemente este registro?')) {
      try {
        await deleteTravelRequest(id)
        setRequests(prev => prev.filter(r => r.id !== id))
      } catch (err) {
        console.error(err)
      }
    }
  }

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (isConductor && r.empleadoId !== config.empleadoId) {
        return false
      }

      const q = query.toLowerCase()
      const matchQ =
        !q ||
        [r.solicitanteNombre, r.puesto, r.folioPedido]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      const matchEstado = estado === 'todos' || r.estado === estado.toUpperCase()
      return matchQ && matchEstado
    })
  }, [requests, query, estado, isConductor, config.empleadoId])

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
        <TravelPdfDocument
          data={pdfData}
          onClose={() => setPdfData(null)}
        />
      )}

      <SignatureModal
        open={!!approvingId}
        onOpenChange={(open) => { if (!open) setApprovingId(null) }}
        title="Firma de Autorización"
        description="Dibuja tu firma para aprobar esta solicitud de viáticos."
        confirmLabel="Aprobar y Firmar"
        onConfirm={handleConfirmApproveSignature}
      />

      <RejectModal
        open={!!rejectingId}
        onOpenChange={(open) => { if (!open) setRejectingId(null) }}
        description="Indica por qué se rechaza esta solicitud de viáticos."
        onConfirm={handleConfirmReject}
      />

      <PageHeader
        title="Viáticos"
        description={`${filtered.length} solicitudes gestionadas`}
      >
        <Link href="/viaticos/nueva">
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
            placeholder="Buscar por solicitante, puesto o folio..."
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
            No se encontraron solicitudes con los filtros actuales.
          </CardContent>
        </Card>
      )}

      {view === 'grid' && filtered.length > 0 && (
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
                          <Wallet className="size-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {r.solicitanteNombre || 'Sin nombre'}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{r.puesto || 'Sin puesto'} • {formatDate(r.fecha)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={badgeClass}>
                      {r.estado}
                    </Badge>
                    {r.folio && (
                      <span className="text-[10px] font-mono text-muted-foreground">{r.folio}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  {r.fuelRequestFolio && (
                    <div className="mb-4 text-sm bg-primary/5 p-3 rounded-md border border-primary/20 flex items-center gap-1.5">
                      <Fuel className="size-4 shrink-0 text-primary/70" />
                      <span className="text-xs text-muted-foreground">Vinculado a Combustible:</span>
                      <span className="text-xs font-semibold font-mono">{r.fuelRequestFolio}</span>
                    </div>
                  )}

                  {r.estado === 'RECHAZADA' && r.observacionesRechazo && (
                    <div className="mb-4 text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-900/40">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-red-600 mb-1">Motivo del rechazo</p>
                      <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">{r.observacionesRechazo}</p>
                    </div>
                  )}

                  {r.asociadoPedido && r.folioPedido && (
                    <div className="mb-4 text-sm bg-muted/40 p-3 rounded-md border border-border/50 flex items-center gap-1.5">
                      <FileText className="size-4 shrink-0 text-primary/70" />
                      <span className="text-xs text-muted-foreground">Folio de pedido:</span>
                      <span className="text-xs font-semibold">{r.folioPedido}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {r.incluyeComida && (
                      <Badge variant="outline" className="gap-1.5 font-normal">
                        <Utensils className="size-3" /> Comida
                      </Badge>
                    )}
                    {r.incluyeHospedaje && (
                      <Badge variant="outline" className="gap-1.5 font-normal">
                        <BedDouble className="size-3" /> Hospedaje ({r.numNoches} noches)
                      </Badge>
                    )}
                    {r.incluyeTransporte && (
                      <Badge variant="outline" className="gap-1.5 font-normal">
                        <Car className="size-3" /> Transporte
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2">
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Costo Total</p>
                    <p className="flex items-center gap-1.5 font-bold text-lg text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(r.costoTotal)}
                    </p>
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

      {view === 'table' && filtered.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Rubros</TableHead>
                  <TableHead>Costo Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((r) => {
                  const isApproved = r.estado === 'APROBADA'
                  const isPending = r.estado === 'PENDIENTE'
                  const badgeClass = isApproved
                    ? 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10'
                    : isPending
                      ? 'border-amber-500/50 text-amber-600 bg-amber-500/10'
                      : 'border-red-500/50 text-red-600 bg-red-500/10'

                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-md bg-muted p-1 shrink-0">
                            <AvatarFallback className="rounded-md bg-transparent text-primary">
                              <Wallet className="size-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm truncate max-w-[160px]">{r.solicitanteNombre || 'Sin nombre'}</span>
                            {r.folio && <span className="text-[10px] font-mono text-muted-foreground">{r.folio}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{r.puesto || 'Sin puesto'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(r.fecha)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                          {r.incluyeComida && (
                            <Badge variant="outline" className="gap-1 font-normal text-[10px]">
                              <Utensils className="size-2.5" /> Comida
                            </Badge>
                          )}
                          {r.incluyeHospedaje && (
                            <Badge variant="outline" className="gap-1 font-normal text-[10px]">
                              <BedDouble className="size-2.5" /> Hospedaje
                            </Badge>
                          )}
                          {r.incluyeTransporte && (
                            <Badge variant="outline" className="gap-1 font-normal text-[10px]">
                              <Car className="size-2.5" /> Transporte
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(r.costoTotal)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${badgeClass}`}>
                          {r.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPdfData(r)} title="Generar PDF">
                            <FileDown className="size-4 text-muted-foreground" />
                          </Button>
                          {r.estado === 'PENDIENTE' && !isConductor && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleReject(r.id)} title="Rechazar">
                                <XCircle className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700" onClick={() => handleApprove(r.id)} title="Aprobar">
                                <CheckCircle className="size-4" />
                              </Button>
                            </>
                          )}
                          {(!isConductor || r.estado === 'PENDIENTE') && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500/70 hover:text-red-600" onClick={() => handleDelete(r.id)} title="Eliminar">
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
    </div>
  )
}
