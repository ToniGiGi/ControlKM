'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, Wallet, Utensils, BedDouble, Car, CheckCircle, XCircle, FileDown, Trash2, FileText, Fuel, LayoutGrid, List, Banknote, FileSpreadsheet } from 'lucide-react'
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
import { approveTravelRequest, rejectTravelRequest, payTravelRequest, deleteTravelRequest } from '@/app/actions/db'
import { useRole } from '@/components/role-provider'
import { ListPagination } from '@/components/ui/list-pagination'
import { exportRowsToExcel } from '@/lib/excel-export'

const PAGE_SIZE = 12

type TravelRequestListProps = {
  initialRequests: any[]
}

export function TravelRequestList({ initialRequests }: TravelRequestListProps) {
  const { role, config, can } = useRole()
  const isConductor = role === 'conductor'

  const [requests, setRequests] = useState(initialRequests)
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)

  const [pdfData, setPdfData] = useState<any | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)

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

  const handlePay = (id: string) => {
    setPayingId(id)
  }

  const handleConfirmPaySignature = async (firmaPagoUrl: string) => {
    if (!payingId) return
    try {
      await payTravelRequest(payingId, firmaPagoUrl)
      setRequests(prev => prev.map(r => r.id === payingId ? { ...r, estado: 'PAGADA', firmaPagoUrl } : r))
    } catch (err) {
      console.error(err)
    } finally {
      setPayingId(null)
    }
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

      const fecha = r.fecha ? new Date(r.fecha) : null
      const matchDesde = !fechaDesde || (fecha && fecha >= new Date(`${fechaDesde}T00:00:00`))
      const matchHasta = !fechaHasta || (fecha && fecha <= new Date(`${fechaHasta}T23:59:59`))

      return matchQ && matchEstado && matchDesde && matchHasta
    })
  }, [requests, query, estado, fechaDesde, fechaHasta, isConductor, config.empleadoId])

  const handleExportExcel = () => {
    exportRowsToExcel(
      filtered,
      [
        { header: 'Folio', value: (r) => r.folio || '', width: 14 },
        { header: 'Fecha', value: (r) => r.fecha ? new Date(r.fecha) : '', width: 12, format: 'dd/mm/yyyy' },
        { header: 'Solicitante', value: (r) => r.solicitanteNombre || '', width: 22 },
        { header: 'Puesto / Área', value: (r) => r.puesto || '', width: 18 },
        { header: 'Folio de Pedido', value: (r) => r.asociadoPedido ? (r.folioPedido || '') : '', width: 14 },
        { header: 'Vinculado a Combustible', value: (r) => r.fuelRequestFolio || '', width: 18 },
        { header: 'Desayunos', value: (r) => r.incluyeComida ? r.numDesayunos : '', width: 10 },
        { header: 'Comidas', value: (r) => r.incluyeComida ? r.numComidas : '', width: 10 },
        { header: 'Cenas', value: (r) => r.incluyeComida ? r.numCenas : '', width: 10 },
        { header: 'Subtotal Comida', value: (r) => r.costoComida || 0, width: 14, format: '$#,##0.00' },
        { header: 'Noches Hospedaje', value: (r) => r.incluyeHospedaje ? r.numNoches : '', width: 12 },
        { header: 'Subtotal Hospedaje', value: (r) => r.costoHospedaje || 0, width: 16, format: '$#,##0.00' },
        { header: 'Uber / Didi', value: (r) => r.transporteUberDidi || 0, width: 12, format: '$#,##0.00' },
        { header: 'Autobús', value: (r) => r.transporteAutobus || 0, width: 12, format: '$#,##0.00' },
        { header: 'Subtotal Transporte', value: (r) => r.costoTransporte || 0, width: 16, format: '$#,##0.00' },
        { header: 'Costo Total', value: (r) => r.costoTotal ?? 0, width: 14, format: '$#,##0.00' },
        { header: 'Estado', value: (r) => r.estado || '', width: 12 },
        { header: 'Fecha de Pago', value: (r) => r.fechaPago ? new Date(r.fechaPago) : '', width: 12, format: 'dd/mm/yyyy' },
        { header: 'Observaciones de Rechazo', value: (r) => r.observacionesRechazo || '', width: 30 },
      ],
      'Viáticos',
      `Solicitudes_Viaticos_${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

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

      <SignatureModal
        open={!!payingId}
        onOpenChange={(open) => { if (!open) setPayingId(null) }}
        title="Firma de Cuentas por Pagar"
        description="Firma para confirmar que el dinero de esta solicitud ya fue entregado."
        confirmLabel="Confirmar Pago y Firmar"
        onConfirm={handleConfirmPaySignature}
      />

      <PageHeader
        title="Viáticos"
        description={`${filtered.length} solicitudes gestionadas`}
      >
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExportExcel} disabled={filtered.length === 0}>
            <FileSpreadsheet className="size-4" />
            Exportar Excel
          </Button>
          <Link href="/viaticos/nueva">
            <Button className="gap-2">
              <Plus className="size-4" />
              Nueva Solicitud
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por solicitante, puesto o folio..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-full sm:w-[150px]"
            aria-label="Fecha desde"
          />
          <span className="text-sm text-muted-foreground shrink-0">a</span>
          <Input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-full sm:w-[150px]"
            aria-label="Fecha hasta"
          />
        </div>
        <Select value={estado} onValueChange={(v) => setEstado(v || "")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="aprobada">Con visto bueno</SelectItem>
            <SelectItem value="pagada">Pagadas</SelectItem>
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
            const isPaid = r.estado === 'PAGADA'
            const badgeClass = isPaid
              ? 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10'
              : isApproved
                ? 'border-blue-500/50 text-blue-600 bg-blue-500/10'
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

                    {r.estado === 'PENDIENTE' && can('aprobar_solicitudes') && (
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
                          Dar Visto Bueno
                        </Button>
                      </div>
                    )}
                    {r.estado === 'APROBADA' && can('pagar_solicitudes') && (
                      <Button
                        size="sm"
                        onClick={() => handlePay(r.id)}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Banknote className="size-4 mr-1" />
                        Pagar y Firmar
                      </Button>
                    )}
                    {(can('eliminar') || (isConductor && r.estado === 'PENDIENTE')) && (
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
                  const isPaid = r.estado === 'PAGADA'
                  const badgeClass = isPaid
                    ? 'border-emerald-500/50 text-emerald-600 bg-emerald-500/10'
                    : isApproved
                      ? 'border-blue-500/50 text-blue-600 bg-blue-500/10'
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
                          {r.estado === 'PENDIENTE' && can('aprobar_solicitudes') && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleReject(r.id)} title="Rechazar">
                                <XCircle className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700" onClick={() => handleApprove(r.id)} title="Dar Visto Bueno">
                                <CheckCircle className="size-4" />
                              </Button>
                            </>
                          )}
                          {r.estado === 'APROBADA' && can('pagar_solicitudes') && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700" onClick={() => handlePay(r.id)} title="Pagar y Firmar">
                              <Banknote className="size-4" />
                            </Button>
                          )}
                          {(can('eliminar') || (isConductor && r.estado === 'PENDIENTE')) && (
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
