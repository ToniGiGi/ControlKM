'use client'

import { useEffect, useState } from 'react'
import { Fuel, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getFuelPrices, updateFuelPrices, type FuelPrices } from '@/app/actions/db'

const FUELS: { key: keyof FuelPrices; label: string; dot: string }[] = [
  { key: 'VERDE', label: 'Magna (Verde)', dot: 'bg-green-600' },
  { key: 'ROJA', label: 'Premium (Roja)', dot: 'bg-red-600' },
  { key: 'DIESEL', label: 'Diésel', dot: 'bg-neutral-800' },
]

// Precio por litro que toman las solicitudes de combustible nuevas.
export function FuelPricesCard({ canEdit }: { canEdit: boolean }) {
  const [prices, setPrices] = useState<Record<keyof FuelPrices, string> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getFuelPrices()
      .then(p => setPrices({ VERDE: String(p.VERDE), ROJA: String(p.ROJA), DIESEL: String(p.DIESEL) }))
      .catch(() => toast.error('No se pudieron cargar los precios de combustible'))
  }, [])

  const handleSave = async () => {
    if (!prices) return
    const parsed = { VERDE: Number(prices.VERDE), ROJA: Number(prices.ROJA), DIESEL: Number(prices.DIESEL) }
    if (Object.values(parsed).some(v => !Number.isFinite(v) || v <= 0)) {
      toast.error('Captura precios válidos mayores a cero.')
      return
    }
    setIsSaving(true)
    try {
      await updateFuelPrices(parsed)
      toast.success('Precios actualizados')
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar los precios')
    }
    setIsSaving(false)
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col">
      <div className="p-6 border-b bg-muted/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Fuel className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg tracking-tight">Precios de Combustible</h3>
            <p className="text-sm text-muted-foreground">Precio por litro que usan las solicitudes de combustible.</p>
          </div>
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={isSaving || !prices} className="gap-2 shrink-0">
            <Save className="size-4" /> {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        )}
      </div>

      <div className="p-6 space-y-4">
        {!prices ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Cargando...
          </div>
        ) : (
          FUELS.map(f => (
            <div key={f.key} className="flex items-center justify-between gap-4">
              <label htmlFor={`precio-${f.key}`} className="flex items-center gap-2 text-sm font-medium">
                <span className={`size-2.5 rounded-full ${f.dot}`} />
                {f.label}
              </label>
              <div className="relative w-40">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id={`precio-${f.key}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={prices[f.key]}
                  readOnly={!canEdit}
                  onChange={e => setPrices({ ...prices, [f.key]: e.target.value })}
                  className="pl-6 pr-10 text-right font-mono"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/L</span>
              </div>
            </div>
          ))
        )}
        <p className="text-xs text-muted-foreground">
          Las solicitudes ya enviadas conservan el precio con el que se calcularon.
        </p>
      </div>
    </div>
  )
}
