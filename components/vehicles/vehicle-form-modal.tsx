'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Car, ImagePlus, Activity, MapPin, Hash, Palette, Fuel, PenTool, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { type Vehicle, type VehicleStatus } from '@/lib/mock-data'
import { uploadImage } from '@/app/actions/upload'

type VehicleFormModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (veh: Partial<Vehicle>) => void
  vehicle?: Vehicle | null
  sucursales: any[]
}

const tiposUnidad = ['Sedán', 'Camioneta', 'Tráiler', 'Moto', 'Caja Seca', 'Refrigerado']
const combustibles = [
  { value: 'VERDE', label: 'Gasolina Verde - Magna' },
  { value: 'ROJA', label: 'Gasolina Roja - Premium' },
  { value: 'DIESEL', label: 'Diésel' },
  { value: 'ELECTRICO', label: 'Eléctrico' }
]

export function VehicleFormModal({ isOpen, onClose, onSave, vehicle, sucursales }: VehicleFormModalProps) {
  const isEditing = !!vehicle
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)

  const [formData, setFormData] = useState<Partial<Vehicle>>({
    nombreInterno: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    color: '',
    placas: '',
    vin: '',
    numeroEconomico: '',
    tipoUnidad: '',
    combustible: '',
    sucursalId: '',
    estado: 'activo',
    fotoUrl: '',
    // Valores por defecto que no se llenan en este form inicial
    capacidadTanque: 50,
    kmInicial: 0,
    kmActual: 0,
    empleadoId: null,
    fechaAsignacion: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (vehicle) {
      setFormData(vehicle)
    } else {
      setFormData({
        nombreInterno: '',
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        color: '',
        placas: '',
        vin: '',
        numeroEconomico: '',
        tipoUnidad: '',
        combustible: '',
        sucursalId: '',
        estado: 'activo',
        fotoUrl: '',
        capacidadTanque: 50,
        kmInicial: 0,
        kmActual: 0,
        empleadoId: null,
        fechaAsignacion: new Date().toISOString().split('T')[0],
      })
    }
  }, [vehicle, isOpen])

  const handleChange = (field: keyof Vehicle, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen pesa demasiado. El tamaño máximo permitido es de 5 MB.')
      e.target.value = ''
      return
    }

    const previewUrl = URL.createObjectURL(file)
    handleChange('fotoUrl', previewUrl)
    setUploadingFoto(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      const url = await uploadImage(fd, 'vehiculos')
      handleChange('fotoUrl', url)
    } catch {
      toast.error('No se pudo subir la fotografía. Intenta de nuevo.')
      handleChange('fotoUrl', vehicle?.fotoUrl || '')
    } finally {
      setUploadingFoto(false)
      URL.revokeObjectURL(previewUrl)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Editar Vehículo' : 'Dar de alta nuevo vehículo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row gap-8 items-start w-full">
            {/* Left Column: Form Fields - 2 Column Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 w-full">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Car className="size-3.5" /> Nombre Interno</label>
              <Input required value={formData.nombreInterno || ''} onChange={(e) => handleChange('nombreInterno', e.target.value)} placeholder="Ej. Reparto 01" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><PenTool className="size-3.5" /> Marca</label>
              <Input required value={formData.marca || ''} onChange={(e) => handleChange('marca', e.target.value)} placeholder="Ej. Nissan" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><PenTool className="size-3.5" /> Modelo</label>
              <Input required value={formData.modelo || ''} onChange={(e) => handleChange('modelo', e.target.value)} placeholder="Ej. NP300" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Hash className="size-3.5" /> Año</label>
              <Input required type="number" min="1990" max="2100" value={formData.anio || ''} onChange={(e) => handleChange('anio', parseInt(e.target.value))} placeholder="Año" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Palette className="size-3.5" /> Color</label>
              <Input required value={formData.color || ''} onChange={(e) => handleChange('color', e.target.value)} placeholder="Color" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Hash className="size-3.5" /> Placas</label>
              <Input required value={formData.placas || ''} onChange={(e) => handleChange('placas', e.target.value)} placeholder="Ej. NRT-45-12" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Hash className="size-3.5" /> Número Económico</label>
              <Input required value={formData.numeroEconomico || ''} onChange={(e) => handleChange('numeroEconomico', e.target.value)} placeholder="Ej. ECO-101" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Hash className="size-3.5" /> Número VIN (Opcional)</label>
              <Input value={formData.vin || ''} onChange={(e) => handleChange('vin', e.target.value)} placeholder="17 caracteres" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Car className="size-3.5" /> Tipo de Unidad</label>
              <Select required value={formData.tipoUnidad || ''} onValueChange={(val) => handleChange('tipoUnidad', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposUnidad.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Fuel className="size-3.5" /> Combustible</label>
              <Select required value={formData.combustible || ''} onValueChange={(val) => handleChange('combustible', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de combustible" />
                </SelectTrigger>
                <SelectContent>
                  {combustibles.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><MapPin className="size-3.5" /> Sucursal Asignada</label>
              <Select value={formData.sucursalId || ''} onValueChange={(val) => handleChange('sucursalId', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione la sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {sucursales.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Activity className="size-3.5" /> Estado</label>
                <Select required value={formData.estado || 'activo'} onValueChange={(val) => handleChange('estado', val as VehicleStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="fuera_servicio">Fuera de servicio</SelectItem>
                    <SelectItem value="vendido">Vendido</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            </div>

            {/* Right Column: Foto section */}
            <div className="w-full md:w-72 shrink-0 flex flex-col items-center gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div 
                onClick={triggerFileInput}
                className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-center bg-muted/20 relative shadow-sm group"
              >
                {formData.fotoUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formData.fotoUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="Vehículo" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-medium flex items-center gap-2">
                        <ImagePlus className="size-4" /> Cambiar
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground gap-2">
                    <ImagePlus className="size-8 opacity-50 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium">Agregar foto</span>
                  </div>
                )}
                {uploadingFoto && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="size-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={triggerFileInput} disabled={uploadingFoto}>
                {uploadingFoto ? 'Subiendo...' : 'Subir fotografía'}
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-8 sm:justify-center border-t border-border pt-6 gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="min-w-[120px]">Cancelar</Button>
            <Button type="submit" className="min-w-[120px]" disabled={uploadingFoto}>{isEditing ? 'Guardar cambios' : 'Crear Vehículo'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
