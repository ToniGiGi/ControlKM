'use client'

import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRole } from '@/components/role-provider'

type ExpenseFormModalProps = {
  expense?: any | null
  vehicles: any[]
  onClose: () => void
  onSave: (data: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function ExpenseFormModal({ expense, vehicles, onClose, onSave, onDelete }: ExpenseFormModalProps) {
  const { role, config } = useRole()
  const selectableVehicles = role === 'conductor'
    ? vehicles.filter(v => v.empleadoId === config.empleadoId)
    : vehicles

  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!expense

  const [vehiculoId, setVehiculoId] = useState(expense?.vehiculoId || (selectableVehicles.length === 1 ? selectableVehicles[0].id : ''))
  const [categoria, setCategoria] = useState(expense?.categoria || '')
  const [monto, setMonto] = useState(expense?.monto?.toString() || '')
  const [fecha, setFecha] = useState(expense?.fecha ? new Date(expense.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [proveedor, setProveedor] = useState(expense?.proveedor || '')
  const [descripcion, setDescripcion] = useState(expense?.descripcion || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehiculoId || !categoria || !monto || !fecha) {
      alert('Por favor completa los campos obligatorios.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave({
        vehiculoId,
        categoria,
        monto: parseFloat(monto),
        fecha: new Date(fecha).toISOString(),
        proveedor,
        descripcion,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border bg-card shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b p-4 shrink-0">
          <h2 className="text-lg font-semibold">{isEditing ? 'Editar Gasto' : 'Nuevo Gasto'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting}>
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div className="space-y-2">
            <Label htmlFor="vehiculo">Vehículo <span className="text-destructive">*</span></Label>
            <Select value={vehiculoId} onValueChange={(v) => setVehiculoId(v || "")} required disabled={isSubmitting}>
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

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría <span className="text-destructive">*</span></Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v || "")} required disabled={isSubmitting}>
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Selecciona la categoría">
                  {categoria ? categoria.charAt(0).toUpperCase() + categoria.slice(1).toLowerCase() : 'Selecciona la categoría'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REPARACION">Reparación</SelectItem>
                <SelectItem value="ACEITE">Aceite</SelectItem>
                <SelectItem value="NEUMATICOS">Neumáticos</SelectItem>
                <SelectItem value="MULTAS">Multas</SelectItem>
                <SelectItem value="ADITAMENTOS">Aditamentos</SelectItem>
                <SelectItem value="OTROS">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto ($) <span className="text-destructive">*</span></Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha <span className="text-destructive">*</span></Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proveedor">Proveedor / Lugar</Label>
            <Input
              id="proveedor"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              placeholder="Ej. Gasolinera PEMEX, Taller XYZ"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles adicionales del gasto..."
              disabled={isSubmitting}
              className="resize-none"
              rows={3}
            />
          </div>
        </form>

        <div className="flex items-center justify-between border-t p-4 shrink-0 bg-muted/50 rounded-b-lg">
          {isEditing && onDelete ? (
            <Button 
              type="button" 
              variant="destructive" 
              size="icon" 
              onClick={() => onDelete(expense.id)}
              disabled={isSubmitting}
              title="Eliminar gasto"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
