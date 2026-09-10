'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Eraser, PenLine } from 'lucide-react'
import { SignaturePad, type SignaturePadHandle } from '@/components/ui/signature-pad'
import { uploadImage } from '@/app/actions/upload'

type SignatureModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: (signatureUrl: string) => Promise<void> | void
}

export function SignatureModal({ open, onOpenChange, title, description, confirmLabel, onConfirm }: SignatureModalProps) {
  const padRef = useRef<SignaturePadHandle | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClear = () => {
    padRef.current?.clear()
  }

  const handleConfirm = async () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      toast.error('Dibuja tu firma antes de continuar.')
      return
    }
    setIsSubmitting(true)
    try {
      const blob = await padRef.current.toBlob()
      if (!blob) throw new Error('No se pudo capturar la firma.')

      const fd = new FormData()
      fd.append('file', new File([blob], 'firma.png', { type: 'image/png' }))
      const url = await uploadImage(fd, 'firmas')

      await onConfirm(url)
      padRef.current.clear()
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || 'No se pudo guardar la firma.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isSubmitting) onOpenChange(next) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="size-4" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <SignaturePad ref={padRef} />

        <div className="flex justify-between items-center pt-2">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleClear} disabled={isSubmitting}>
            <Eraser className="size-3.5" />
            Limpiar
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
