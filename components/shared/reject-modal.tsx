'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { XCircle } from 'lucide-react'

type RejectModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  description: string
  onConfirm: (observaciones: string) => Promise<void> | void
}

export function RejectModal({ open, onOpenChange, description, onConfirm }: RejectModalProps) {
  const [observaciones, setObservaciones] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!observaciones.trim()) {
      toast.error('Escribe una observación explicando el motivo del rechazo.')
      return
    }
    setIsSubmitting(true)
    try {
      await onConfirm(observaciones.trim())
      setObservaciones('')
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'No se pudo rechazar la solicitud.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isSubmitting) { onOpenChange(next); if (!next) setObservaciones('') } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="size-4" />
            Rechazar Solicitud
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="observaciones">Observaciones <span className="text-destructive">*</span></Label>
          <Textarea
            id="observaciones"
            placeholder="Explica por qué se rechaza y qué se debe corregir..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Rechazando...' : 'Rechazar Solicitud'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
