'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Search, ShieldAlert, Calendar, Banknote, Car, Pencil, FileText, LayoutGrid, List, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
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
import { InsuranceFormModal } from './insurance-form-modal'
import { createInsurance, updateInsurance, deleteInsurance } from '@/app/actions/db'
import { useRole } from '@/components/role-provider'
import { ListPagination } from '@/components/ui/list-pagination'

const PAGE_SIZE = 12

type InsuranceListProps = {
  initialInsurances: any[]
  vehicles: any[]
  insuranceCompanies: any[]
}

function getInsuranceLogo(name: string) {
  const normalized = name.toLowerCase()
  
  // Logos que no existen en repositorios públicos los cargaremos localmente
  if (normalized.includes('qualitas') || normalized.includes('quálitas')) {
    return '/logos/qualitas.png'
  }
  if (normalized.includes('inbursa')) {
    return '/logos/inbursa.png'
  }
  if (normalized.includes('potosi') || normalized.includes('potosí')) {
    return '/logos/elpotosi.png'
  }

  let domain = ''
  
  if (normalized.includes('hdi')) domain = 'hdi.com.mx'
  else if (normalized.includes('gnp')) domain = 'gnp.com.mx'
  else if (normalized.includes('bbva')) domain = 'bbva.mx'
  else if (normalized.includes('mapfre')) domain = 'mapfre.com.mx'
  else if (normalized.includes('axa')) domain = 'axa.mx'
  else if (normalized.includes('zurich')) domain = 'zurich.com.mx'
  else if (normalized.includes('banorte')) domain = 'banorte.com'
  else if (normalized.includes('chubb')) domain = 'chubb.com'
  else if (normalized.includes('atlas')) domain = 'segurosatlas.com.mx'
  else if (normalized.includes('afirme')) domain = 'afirme.com'
  
  if (domain) {
    // Usar Google Favicon API (sz=128 para alta resolución)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  }
  
  return null
}

export function InsuranceList({ initialInsurances, vehicles, insuranceCompanies }: InsuranceListProps) {
  const { role, config, can } = useRole()
  const isConductor = role === 'conductor'
  
  const [insurances, setInsurances] = useState(initialInsurances)
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState('todos')
  const [view, setView] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingInsurance, setEditingInsurance] = useState<any | null>(null)

  const handleSave = async (data: any) => {
    try {
      if (editingInsurance) {
        const updated = await updateInsurance(editingInsurance.id, data)
        setInsurances(prev => prev.map(i => i.id === updated.id ? { ...updated, vehiculo: vehicles.find(v => v.id === updated.vehiculoId) } : i))
      } else {
        const created = await createInsurance(data)
        setInsurances(prev => [...prev, { ...created, vehiculo: vehicles.find(v => v.id === created.vehiculoId) }])
      }
      setIsFormOpen(false)
      setEditingInsurance(null)
    } catch (err) {
      console.error(err)
      alert('Error al guardar la póliza')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta póliza?')) {
      try {
        await deleteInsurance(id)
        setInsurances(prev => prev.filter(i => i.id !== id))
      } catch (err) {
        console.error(err)
        alert('Error al eliminar')
      }
    }
  }

  // Calculate days remaining and progress percentage
  const getExpirationData = (vencimiento: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expDate = new Date(vencimiento)
    expDate.setHours(0, 0, 0, 0)
    
    const diffTime = expDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Asumimos un año (365 días) como el total para el progreso
    const totalDays = 365
    let percentage = Math.max(0, Math.min(100, (diffDays / totalDays) * 100))
    
    let status = 'VIGENTE'
    let progressColor = 'bg-green-500'
    let badgeColor = 'bg-green-500/10 text-green-600 border-green-500/20'

    if (diffDays <= 0) {
      status = 'VENCIDO'
      percentage = 0
      progressColor = 'bg-red-500'
      badgeColor = 'bg-red-500/10 text-red-600 border-red-500/20'
    } else if (diffDays <= 30) {
      status = 'POR VENCER'
      progressColor = 'bg-amber-500'
      badgeColor = 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    }

    return { diffDays, percentage, status, progressColor, badgeColor }
  }

  const visible = useMemo(() => {
    let filtered = insurances.filter((i) => {
      const v = i.vehiculo || vehicles.find(v => v.id === i.vehiculoId)
      if (isConductor && v?.empleadoId !== config.empleadoId) {
        return false
      }
      return true
    })
    if (estado !== 'todos') {
      filtered = filtered.filter(i => {
        const { status } = getExpirationData(i.vencimiento)
        if (estado === 'vigente') return status === 'VIGENTE'
        if (estado === 'por_vencer') return status === 'POR VENCER'
        if (estado === 'vencido') return status === 'VENCIDO'
        return true
      })
    }
    if (query.trim() !== '') {
      const q = query.toLowerCase()
      filtered = filtered.filter(i =>
        i.aseguradora.toLowerCase().includes(q) ||
        i.poliza.toLowerCase().includes(q) ||
        i.vehiculo?.nombreInterno.toLowerCase().includes(q) ||
        i.vehiculo?.placas.toLowerCase().includes(q)
      )
    }
    // Las que están más cerca de vencer (o ya vencidas) primero, las que tienen
    // más tiempo por delante al final.
    return [...filtered].sort(
      (a, b) => new Date(a.vencimiento).getTime() - new Date(b.vencimiento).getTime()
    )
  }, [insurances, query, estado, isConductor, config.empleadoId, vehicles])

  useEffect(() => { setPage(1) }, [query, estado])

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const paginated = useMemo(
    () => visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visible, page]
  )

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-2xl mx-auto w-full">
      <PageHeader
        title={isConductor ? "Mi seguro" : "Seguros"}
        description={isConductor ? "Información de la póliza de tu unidad asignada" : `${visible.length} pólizas registradas`}
      >
        {can('crear_editar') && !isConductor && (
          <Button className="gap-2" onClick={() => { setEditingInsurance(null); setIsFormOpen(true) }}>
            <Plus className="size-4" /> Nueva Póliza
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por aseguradora, póliza, vehículo o placa..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={estado} onValueChange={(v) => setEstado(v || "")}>
            <SelectTrigger className="md:w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="vigente">Vigentes</SelectItem>
              <SelectItem value="por_vencer">Por vencer (30 días)</SelectItem>
              <SelectItem value="vencido">Vencidos</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden items-center gap-1 rounded-md border border-border p-0.5 sm:flex md:ml-auto">
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
        </CardContent>
      </Card>

      {/* Grid de Pólizas */}
      {view === 'grid' && visible.length > 0 && (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 p-1">
        {paginated.map((ins) => {
          const { diffDays, percentage, status, progressColor, badgeColor } = getExpirationData(ins.vencimiento)
          
          return (
            <Card key={ins.id} className="group relative transition-all hover:border-primary/50 hover:shadow-lg">
              {can('crear_editar') && !isConductor && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/80 backdrop-blur border shadow-sm"
                  onClick={() => {
                    setEditingInsurance(ins)
                    setIsFormOpen(true)
                  }}
                >
                  <Pencil className="size-4 text-muted-foreground" />
                </Button>
              )}

              <CardContent className="p-6 flex flex-col gap-6">
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between pr-14">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-12 rounded-xl border border-border/50 bg-white shadow-sm shrink-0">
                      <AvatarImage src={getInsuranceLogo(ins.aseguradora) || undefined} className="object-contain p-1.5" />
                      <AvatarFallback className="bg-primary/10 text-primary rounded-xl">
                        <ShieldAlert className="size-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{ins.aseguradora}</h3>
                      <p className="text-sm text-muted-foreground font-mono mt-0.5">Póliza: {ins.poliza}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`mt-1 font-semibold tracking-wide ${badgeColor}`}>
                    {status}
                  </Badge>
                </div>

                {/* Detalles y Vehículo */}
                <div className="grid grid-cols-2 gap-4 bg-muted/40 rounded-lg p-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs font-semibold uppercase">Vehículo Asignado</span>
                    <div className="flex items-center gap-2 font-medium">
                      <Car className="size-4 text-primary" />
                      <span className="truncate">{ins.vehiculo?.nombreInterno || 'Sin asignar'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-6 block">{ins.vehiculo?.placas}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-xs font-semibold uppercase">Cobertura y Costo</span>
                    <p className="font-medium truncate">{ins.cobertura || 'No especificada'}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Banknote className="size-3.5" />
                      {ins.costo ? `$${ins.costo.toLocaleString()} MXN` : 'Sin costo registrado'}
                    </div>
                  </div>
                </div>

                {/* Fechas y Progreso */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end text-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">Fecha de inicio</span>
                      <span className="font-medium flex items-center gap-1.5">
                        <Calendar className="size-3.5" /> 
                        {new Date(ins.inicio).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 items-end">
                      <span className="text-xs text-muted-foreground">
                        {diffDays > 0 ? `Vence en ${diffDays} días` : diffDays === 0 ? 'Vence hoy' : `Vencido hace ${Math.abs(diffDays)} días`}
                      </span>
                      <span className={`font-medium flex items-center gap-1.5 ${diffDays <= 30 ? 'text-amber-600' : ''} ${diffDays <= 0 ? 'text-red-600' : ''}`}>
                        <Calendar className="size-3.5" /> 
                        {new Date(ins.vencimiento).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Custom Progress Bar para coloreado dinámico */}
                  <div className="h-2.5 w-full bg-secondary overflow-hidden rounded-full">
                    <div 
                      className={`h-full transition-all duration-500 ease-in-out ${progressColor}`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                {ins.archivoPdf && (
                  <div className="pt-2 border-t border-border flex justify-end">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => window.open(ins.archivoPdf, '_blank')}>
                      <FileText className="size-3.5 mr-1.5" /> Ver Documento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      )}

      {/* Vista de Tabla */}
      {view === 'table' && visible.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aseguradora</TableHead>
                  <TableHead>Vehículo Asignado</TableHead>
                  <TableHead>Cobertura y Costo</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((ins) => {
                  const { diffDays, status, badgeColor } = getExpirationData(ins.vencimiento)
                  return (
                    <TableRow key={ins.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 rounded-lg border border-border/50 bg-white shadow-sm shrink-0">
                            <AvatarImage src={getInsuranceLogo(ins.aseguradora) || undefined} className="object-contain p-1" />
                            <AvatarFallback className="bg-primary/10 text-primary rounded-lg">
                              <ShieldAlert className="size-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{ins.aseguradora}</span>
                            <span className="text-xs text-muted-foreground">Póliza: {ins.poliza}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ins.vehiculo ? (
                          <div className="flex flex-col text-sm">
                            <span className="font-medium truncate max-w-[200px]">{ins.vehiculo.nombreInterno}</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{ins.vehiculo.placas}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Sin asignar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="truncate max-w-[150px]">{ins.cobertura || 'Sin especificar'}</span>
                          <span className="text-xs text-muted-foreground">
                            {ins.costo ? `$${ins.costo.toLocaleString()} MXN` : 'Sin costo registrado'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{new Date(ins.vencimiento).toLocaleDateString()}</span>
                          <span className="text-xs text-muted-foreground">
                            {diffDays > 0 ? `Vence en ${diffDays} días` : diffDays === 0 ? 'Vence hoy' : `Vencido hace ${Math.abs(diffDays)} días`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${badgeColor}`}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {ins.archivoPdf && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => window.open(ins.archivoPdf, '_blank')}
                              title="Ver documento"
                            >
                              <FileText className="size-4 text-muted-foreground" />
                            </Button>
                          )}
                          {can('crear_editar') && !isConductor && (
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditingInsurance(ins)
                                  setIsFormOpen(true)
                                }}
                              >
                                <Pencil className="size-4 text-muted-foreground" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDelete(ins.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
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

      {visible.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
          <ShieldAlert className="size-12 mx-auto mb-3 opacity-20" />
          <p>No se encontraron pólizas de seguro.</p>
        </div>
      )}

      <ListPagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={visible.length} pageSize={PAGE_SIZE} />

      {isFormOpen && (
        <InsuranceFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSave}
          insurance={editingInsurance}
          vehicles={vehicles}
          insuranceCompanies={insuranceCompanies}
        />
      )}
    </div>
  )
}
