'use client'

import { useState } from 'react'
import { MessageCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { testWhatsAppNotifications } from '@/app/actions/db'

type Diagnosis = Awaited<ReturnType<typeof testWhatsAppNotifications>>

export function WhatsAppTestCard() {
  const [loading, setLoading] = useState(false)
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)

  const handleTest = async () => {
    if (!confirm('Se enviará un WhatsApp de prueba a todos los administradores y a Cuentas por Pagar. ¿Continuar?')) return
    setLoading(true)
    try {
      setDiagnosis(await testWhatsAppNotifications())
    } catch (e: any) {
      toast.error(e.message || 'Error al probar las notificaciones')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="p-6 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="size-5 text-primary" /> Notificaciones de WhatsApp
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Envía un mensaje de prueba a los administradores y a Cuentas por Pagar para ver a quién le llega.
          </p>
        </div>
        <Button onClick={handleTest} disabled={loading} className="gap-2 shrink-0">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
          {loading ? 'Enviando...' : 'Enviar prueba'}
        </Button>
      </div>

      {diagnosis && (
        <div className="p-6 space-y-3">
          {!diagnosis.configurado ? (
            <p className="text-sm font-medium text-destructive">
              WhatsApp no está configurado en este servidor. Faltan las variables: {diagnosis.faltan.join(', ')}.
            </p>
          ) : (
            <>
              {diagnosis.modoPrueba && (
                <p className="text-sm text-amber-600">
                  Modo prueba activo (WHATSAPP_ONLY_TO): los mensajes solo se envían al número de prueba.
                </p>
              )}
              <ul className="divide-y rounded-lg border">
                {diagnosis.resultados.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 text-sm">
                    {r.ok
                      ? <CheckCircle className="size-4 mt-0.5 shrink-0 text-emerald-600" />
                      : <XCircle className="size-4 mt-0.5 shrink-0 text-destructive" />}
                    <div className="min-w-0">
                      <p className="font-medium">{r.nombre} <span className="font-normal text-muted-foreground">· {r.role}</span></p>
                      <p className="text-xs text-muted-foreground break-words">
                        {r.telefono ? `Teléfono: ${r.telefono} — ` : ''}{r.detalle}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
