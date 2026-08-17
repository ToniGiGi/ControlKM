'use client'

import { useState } from 'react'
import { X, Calendar, Wrench, Gauge, DollarSign, AlignLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRole } from '@/components/role-provider'

type MaintenanceFormModalProps = {
  maintenance?: any
  vehicles: any[]
  onClose: () => void
  onSave: (data: any) => void
  onDelete?: (id: string) => void
}

export function MaintenanceFormModal({ maintenance, vehicles, onClose, onSave, onDelete }: MaintenanceFormModalProps) {
  const { role, config } = useRole()
  
  const selectableVehicles = role === 'conductor' 
    ? vehicles.filter(v => v.empleadoId === config.empleadoId)
    : vehicles

  const [vehiculoId, setVehiculoId] = useState(maintenance?.vehiculoId || (selectableVehicles.length === 1 ? selectableVehicles[0].id : ''))
  const [tipo, setTipo] = useState(maintenance?.tipo || 'PREVENTIVO')
  const [fecha, setFecha] = useState(
    maintenance?.fecha 
      ? new Date(maintenance.fecha).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  )
  const [km, setKm] = useState(maintenance?.km?.toString() || '')
  const [taller, setTaller] = useState(maintenance?.taller || '')
  const [costo, setCosto] = useState(maintenance?.costo?.toString() || '')
  const [descripcion, setDescripcion] = useState(maintenance?.descripcion || '')
  const [registradoPor, setRegistradoPor] = useState(maintenance?.registradoPor || config.nombre)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await onSave({
      vehiculoId,
      tipo,
      fecha,
      km,
      taller,
      costo,
      descripcion,
      registradoPor,
    })
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-xl border bg-card p-6 shadow-xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>

        <div className="mb-6">
          <h2 className="text-xl font-bold">
            {maintenance ? 'Editar Mantenimiento' : 'Registrar Mantenimiento'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {maintenance ? 'Modifica los detalles del servicio.' : 'Ingresa los datos del nuevo servicio mecánico.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-2 pb-2 -mr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vehículo */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="vehiculo" className="flex items-center gap-2">Vehículo Asignado <span className="text-destructive">*</span></Label>
              <Select value={vehiculoId} onValueChange={(v) => setVehiculoId(v || "")} required>
                <SelectTrigger id="vehiculo" className="w-full">
                  <SelectValue placeholder="Selecciona un vehículo">
                    {vehiculoId && selectableVehicles.find(v => v.id === vehiculoId)
                      ? selectableVehicles.find(v => v.id === vehiculoId)?.nombreInterno
                      : 'Selecciona un vehículo'}
                  </SelectValue>
                </SelectTrigger>
                  <SelectContent>
                      {selectableVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {`${v.nombreInterno} ${v.placas ? `(${v.placas})` : ''}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo" className="flex items-center gap-2">Tipo de Mantenimiento <span className="text-destructive">*</span></Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v || "")} required>
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecciona el tipo">
                    {tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase() : 'Selecciona el tipo'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PREVENTIVO">Preventivo</SelectItem>
                  <SelectItem value="CORRECTIVO">Correctivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha" className="flex items-center gap-2"><Calendar className="size-3.5 text-muted-foreground"/> Fecha <span className="text-destructive">*</span></Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                required
              />
            </div>

            {/* Kilometraje */}
            <div className="space-y-2">
              <Label htmlFor="km" className="flex items-center gap-2"><Gauge className="size-3.5 text-muted-foreground"/> Kilometraje <span className="text-destructive">*</span></Label>
              <Input
                id="km"
                type="number"
                placeholder="Ej. 45000"
                value={km}
                onChange={e => setKm(e.target.value)}
                required
                min="0"
              />
            </div>

            {/* Costo */}
            <div className="space-y-2">
              <Label htmlFor="costo" className="flex items-center gap-2"><DollarSign className="size-3.5 text-muted-foreground"/> Costo (MXN) <span className="text-destructive">*</span></Label>
              <Input
                id="costo"
                type="number"
                step="0.01"
                placeholder="Ej. 1500.50"
                value={costo}
                onChange={e => setCosto(e.target.value)}
                required
                min="0"
              />
            </div>

            {/* Taller */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="taller" className="flex items-center gap-2"><Wrench className="size-3.5 text-muted-foreground"/> Taller Mecánico</Label>
              <Input
                id="taller"
                placeholder="Nombre del taller o mecánico"
                value={taller}
                onChange={e => setTaller(e.target.value)}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion" className="flex items-center gap-2"><AlignLeft className="size-3.5 text-muted-foreground"/> Descripción del servicio</Label>
              <textarea
                id="descripcion"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Detalla las reparaciones realizadas, refacciones cambiadas, etc."
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
              />
            </div>
            
            {/* Registrado Por */}
            <div className="space-y-2 md:col-span-2 mt-2">
              <Label htmlFor="registradoPor" className="flex items-center gap-2 text-xs text-muted-foreground">Registrado por (Auditoría)</Label>
              <Input
                id="registradoPor"
                placeholder="Nombre del usuario"
                value={registradoPor}
                disabled
                className="bg-muted/50 cursor-not-allowed font-medium text-muted-foreground"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center border-t mt-6">
            {onDelete ? (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => onDelete(maintenance.id)}
                disabled={isSubmitting}
              >
                Eliminar
              </Button>
            ) : (
              <div></div> // spacer
            )}
            
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : maintenance ? 'Guardar Cambios' : 'Registrar Mantenimiento'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
