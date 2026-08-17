'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImagePlus, User, Mail, Lock, Phone, Briefcase, MapPin, Building, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { type Employee } from '@/lib/mock-data'

type EmployeeFormModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (emp: Partial<Employee>) => void
  employee?: Employee | null
  sucursales: any[]
  areas: any[]
}

export function EmployeeFormModal({ isOpen, onClose, onSave, employee, sucursales, areas }: EmployeeFormModalProps) {
  const isEditing = !!employee
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<Partial<Employee>>({
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 300 * 1024) {
        toast.error('La imagen pesa demasiado. El tamaño máximo permitido es de 300 KB.')
        e.target.value = ''
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        handleChange('fotoUrl', reader.result as string)
      }
      reader.readAsDataURL(file)
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
              <Avatar className="size-32 cursor-pointer hover:opacity-80 transition-opacity border-2 border-border shadow-sm" onClick={triggerFileInput}>
                <AvatarImage src={formData.fotoUrl || undefined} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground flex flex-col gap-2">
                  <ImagePlus className="size-8" />
                </AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={triggerFileInput}>
                Subir fotografía
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
                <Select required value={formData.area || ''} onValueChange={(val) => handleChange('area', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el Área" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map(a => (
                      <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><MapPin className="size-3.5" /> Sucursal</label>
                <Select required value={formData.sucursal || ''} onValueChange={(val) => handleChange('sucursal', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona sucursal" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
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
            <Button type="submit">{isEditing ? 'Guardar cambios' : 'Crear Empleado'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
