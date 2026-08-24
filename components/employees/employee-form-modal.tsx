'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImagePlus, User, Mail, Lock, Phone, Briefcase, MapPin, Building, Activity, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { type Employee } from '@/lib/mock-data'
import { uploadImage } from '@/app/actions/upload'

type EmployeeFormModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (emp: Partial<Employee>) => void | Promise<void>
  employee?: Employee | null
  sucursales: any[]
  areas: any[]
}

export function EmployeeFormModal({ isOpen, onClose, onSave, employee, sucursales, areas }: EmployeeFormModalProps) {
  const isEditing = !!employee
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState<Partial<Employee>>({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    puesto: '',
    departamentoId: '',
    sucursalId: '',
    estado: 'activo',
    fotoUrl: '',
    vehiculosAsignados: [],
    licencia: '',
    vencimientoLicencia: '2099-12-31',
  })

  useEffect(() => {
    if (employee) {
      setFormData(employee)
    } else {
      setFormData({
        nombre: '',
        email: '',
        password: '',
        telefono: '',
        puesto: '',
        area: '',
        sucursal: '',
        estado: 'activo',
        fotoUrl: '',
        vehiculosAsignados: [],
        licencia: '',
        vencimientoLicencia: '2099-12-31',
      })
    }
  }, [employee, isOpen])

  const handleChange = (field: keyof Employee, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return
    setIsSaving(true)
    try {
      await onSave(formData)
    } catch {
      // El error ya se muestra al usuario donde se maneja onSave.
    } finally {
      setIsSaving(false)
    }
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
      const url = await uploadImage(fd, 'empleados')
      handleChange('fotoUrl', url)
    } catch {
      toast.error('No se pudo subir la fotografía. Intenta de nuevo.')
      handleChange('fotoUrl', employee?.fotoUrl || '')
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Editar Empleado' : 'Dar de alta nuevo empleado'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Foto Profile section */}
            <div className="flex flex-col items-center gap-3 md:w-1/3 mx-auto">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div className="relative">
                <Avatar className="size-32 cursor-pointer hover:opacity-80 transition-opacity border-2 border-border shadow-sm" onClick={triggerFileInput}>
                  <AvatarImage src={formData.fotoUrl || undefined} className="object-cover" />
                  <AvatarFallback className="bg-muted text-muted-foreground flex flex-col gap-2">
                    <ImagePlus className="size-8" />
                  </AvatarFallback>
                </Avatar>
                {uploadingFoto && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Loader2 className="size-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={triggerFileInput} disabled={uploadingFoto}>
                {uploadingFoto ? 'Subiendo...' : 'Subir fotografía'}
              </Button>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4 md:w-2/3 flex-1 w-full">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><User className="size-3.5" /> Nombre completo</label>
                <Input required value={formData.nombre || ''} onChange={(e) => handleChange('nombre', e.target.value)} placeholder="Ej. Juan Pérez" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Mail className="size-3.5" /> Correo electrónico</label>
                <Input required type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} placeholder="juan@empresa.mx" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Lock className="size-3.5" /> Contraseña (Credencial)</label>
                <Input required={!isEditing} type="password" value={formData.password || ''} onChange={(e) => handleChange('password', e.target.value)} placeholder="Contraseña de acceso" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Phone className="size-3.5" /> Teléfono</label>
                <Input required value={formData.telefono || ''} onChange={(e) => handleChange('telefono', e.target.value)} placeholder="55 0000 0000" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Building className="size-3.5" /> Área</label>
                <Select required value={formData.departamentoId || ''} onValueChange={(val) => handleChange('departamentoId', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el Área">
                      {areas.find(a => a.id === formData.departamentoId)?.name || 'Selecciona el Área'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><MapPin className="size-3.5" /> Sucursal</label>
                <Select required value={formData.sucursalId || ''} onValueChange={(val) => handleChange('sucursalId', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona sucursal">
                      {sucursales.find(s => s.id === formData.sucursalId)?.name || 'Selecciona sucursal'}
                    </SelectValue>
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
                  <Select required value={formData.estado || 'activo'} onValueChange={(val) => handleChange('estado', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={uploadingFoto || isSaving}>
              {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear Empleado'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
