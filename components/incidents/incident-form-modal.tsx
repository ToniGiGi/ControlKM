'use client'

import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type IncidentFormModalProps = {
  incident?: any | null
  vehicles: any[]
  onClose: () => void
  onSave: (data: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function IncidentFormModal({ incident, vehicles, onClose, onSave, onDelete }: IncidentFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!incident

  const [vehiculoId, setVehiculoId] = useState(incident?.vehiculoId || '')
  const [tipo, setTipo] = useState(incident?.tipo || '')
  const [fecha, setFecha] = useState(incident?.fecha ? new Date(incident.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  const [gravedad, setGravedad] = useState(incident?.gravedad || 'MEDIA')
  const [estado, setEstado] = useState(incident?.estado || 'ABIERTA')
  const [costo, setCosto] = useState(incident?.costo?.toString() || '')
  const [descripcion, setDescripcion] = useState(incident?.descripcion || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehiculoId || !tipo || !fecha || !gravedad || !estado || !descripcion) {
      alert('Por favor completa todos los campos obligatorios.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave({
        vehiculoId,
        tipo,
        fecha: new Date(fecha).toISOString(),
        gravedad,
        estado,
        costo: costo ? parseFloat(costo) : null,
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
          <h2 className="text-lg font-semibold">{isEditing ? 'Editar Incidencia' : 'Nueva Incidencia'}</h2>
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
                  {vehiculoId && vehicles.find((v: any) => v.id === vehiculoId)
                    ? `${vehicles.find((v: any) => v.id === vehiculoId)?.nombreInterno} (${vehicles.find((v: any) => v.id === vehiculoId)?.placas})`
                    : ''}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {`${v.nombreInterno} (${v.placas})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Incidencia <span className="text-destructive">*</span></Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v || "")} required disabled={isSubmitting}>
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CHOQUE">Choque</SelectItem>
                <SelectItem value="FALLO MECANICO">Fallo Mecánico</SelectItem>
                <SelectItem value="PONCHADURA">Ponchadura</SelectItem>
                <SelectItem value="ROBO">Robo</SelectItem>
                <SelectItem value="MULTA">Multa</SelectItem>
                <SelectItem value="DOCUMENTACION">Problema de Documentación</SelectItem>
                <SelectItem value="EXCESO DE VELOCIDAD">Exceso de Velocidad</SelectItem>
                <SelectItem value="OTRO">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="costo">Costo (Opcional)</Label>
              <Input
                id="costo"
                type="number"
                step="0.01"
                min="0"
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                disabled={isSubmitting}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gravedad">Gravedad <span className="text-destructive">*</span></Label>
              <Select value={gravedad} onValueChange={(v) => setGravedad(v || "")} required disabled={isSubmitting}>
                <SelectTrigger id="gravedad">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado <span className="text-destructive">*</span></Label>
              <Select value={estado} onValueChange={(v) => setEstado(v || "")} required disabled={isSubmitting}>
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABIERTA">Abierta</SelectItem>
                  <SelectItem value="EN_REVISION">En Revisión</SelectItem>
                  <SelectItem value="RESUELTA">Resuelta</SelectItem>
                  <SelectItem value="CERRADA">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción Detallada <span className="text-destructive">*</span></Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Explica qué sucedió, en dónde, daños aparentes..."
              required
              disabled={isSubmitting}
              className="resize-none"
              rows={4}
            />
          </div>
        </form>

        <div className="flex items-center justify-between border-t p-4 shrink-0 bg-muted/50 rounded-b-lg">
          {isEditing && onDelete ? (
            <Button 
              type="button" 
              variant="destructive" 
              size="icon" 
              onClick={() => onDelete(incident.id)}
              disabled={isSubmitting}
              title="Eliminar incidencia"
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
              {isSubmitting ? 'Guardando...' : 'Guardar Incidencia'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
