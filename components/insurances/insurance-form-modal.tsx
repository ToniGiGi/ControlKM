'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShieldAlert, Car, Building, Hash, Banknote, Calendar, Upload } from 'lucide-react'
import { type Vehicle } from '@/lib/mock-data'

type InsuranceFormModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (ins: any) => void
  insurance?: any | null
  vehicles: Vehicle[]
  insuranceCompanies: any[]
}

export function InsuranceFormModal({ isOpen, onClose, onSave, insurance, vehicles, insuranceCompanies }: InsuranceFormModalProps) {
  const isEditing = !!insurance
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<any>({
    vehiculoId: '',
    aseguradora: '',
    poliza: '',
    cobertura: '',
    inicio: new Date().toISOString().split('T')[0],
    vencimiento: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    costo: 0,
    estado: 'VIGENTE',
    archivoPdf: '',
  })

  useEffect(() => {
    if (insurance) {
      setFormData({
        ...insurance,
        inicio: insurance.inicio ? new Date(insurance.inicio).toISOString().split('T')[0] : '',
        vencimiento: insurance.vencimiento ? new Date(insurance.vencimiento).toISOString().split('T')[0] : '',
      })
    } else {
      setFormData({
        vehiculoId: '',
        aseguradora: '',
        poliza: '',
        cobertura: '',
        inicio: new Date().toISOString().split('T')[0],
        vencimiento: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        costo: 0,
        estado: 'VIGENTE',
        archivoPdf: '',
      })
    }
  }, [insurance, isOpen])

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        handleChange('archivoPdf', reader.result as string)
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
          <DialogTitle className="text-xl flex items-center gap-2">
            <ShieldAlert className="size-5 text-primary" />
            {isEditing ? 'Editar Póliza de Seguro' : 'Nueva Póliza de Seguro'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5 w-full">
            
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Car className="size-3.5" /> Vehículo Asignado</label>
              <Select required value={formData.vehiculoId || ''} onValueChange={(val) => handleChange('vehiculoId', val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona el vehículo">
                    {formData.vehiculoId && vehicles.find((v: any) => v.id === formData.vehiculoId)
                      ? `${vehicles.find((v: any) => v.id === formData.vehiculoId)?.nombreInterno} - ${vehicles.find((v: any) => v.id === formData.vehiculoId)?.placas}`
                      : ''}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {`${v.nombreInterno} - ${v.placas}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Building className="size-3.5" /> Aseguradora</label>
              <Select required value={formData.aseguradora || ''} onValueChange={(val) => handleChange('aseguradora', val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona la aseguradora">
                    {formData.aseguradora ? formData.aseguradora : ''}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {insuranceCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Hash className="size-3.5" /> No. de Póliza</label>
              <Input required value={formData.poliza || ''} onChange={(e) => handleChange('poliza', e.target.value)} placeholder="Ej. QUA-12345678" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><ShieldAlert className="size-3.5" /> Cobertura</label>
              <Select required value={formData.cobertura || ''} onValueChange={(val) => handleChange('cobertura', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de cobertura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Amplia">Amplia</SelectItem>
                  <SelectItem value="Limitada">Limitada</SelectItem>
                  <SelectItem value="Responsabilidad Civil">Responsabilidad Civil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Banknote className="size-3.5" /> Costo Anual</label>
              <Input required type="number" min="0" step="0.01" value={formData.costo || ''} onChange={(e) => handleChange('costo', e.target.value)} placeholder="Ej. 15000" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Calendar className="size-3.5" /> Fecha de Inicio</label>
              <Input required type="date" value={formData.inicio || ''} onChange={(e) => handleChange('inicio', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Calendar className="size-3.5" /> Fecha de Vencimiento</label>
              <Input required type="date" value={formData.vencimiento || ''} onChange={(e) => handleChange('vencimiento', e.target.value)} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Upload className="size-3.5" /> Documento de Póliza (Opcional)</label>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="application/pdf,image/*" 
                className="hidden" 
              />
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={triggerFileInput} className="w-full md:w-auto">
                  {formData.archivoPdf ? 'Reemplazar documento' : 'Subir archivo (PDF o Imagen)'}
                </Button>
                {formData.archivoPdf && <span className="text-sm text-green-600 font-medium">Documento cargado ✓</span>}
              </div>
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar póliza
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
