'use client'

import { useState, useEffect } from 'react'
import { X, Map, Fuel, Calculator, Banknote, CreditCard, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

const GAS_PRICES = {
  VERDE: 23.79,
  ROJA: 28.55,
  DIESEL: 28.00
}

type FuelRequestModalProps = {
  vehicles: any[]
  onClose: () => void
  onSave: (data: any) => void
}

export function FuelRequestModal({ vehicles, onClose, onSave }: FuelRequestModalProps) {
  // Datos Generales
  const [solicitanteNombre, setSolicitanteNombre] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [motivo, setMotivo] = useState('')
  const [tarjetaToka, setTarjetaToka] = useState('')
  const [numeroTag, setNumeroTag] = useState('')
  
  // Ruta y Calculadora
  const [rutas, setRutas] = useState('')
  const [kmAproximado, setKmAproximado] = useState<number | ''>('')
  const [holgura, setHolgura] = useState<number>(100) // Default 100km extra
  const [rendimiento, setRendimiento] = useState<number>(10) // 10 km/l default
  const [tipoGasolina, setTipoGasolina] = useState<keyof typeof GAS_PRICES>('VERDE')
  
  // Extras
  const [numCasetas, setNumCasetas] = useState<number | ''>('')
  const [costoCasetas, setCostoCasetas] = useState<number | ''>('')
  const [costoComidas, setCostoComidas] = useState<number | ''>('')

  // Totales Auto-calculados
  const [kmTotal, setKmTotal] = useState(0)
  const [litros, setLitros] = useState(0)
  const [costoGas, setCostoGas] = useState(0)
  const [granTotal, setGranTotal] = useState(0)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Motor de Calculadora Inteligente
  useEffect(() => {
    const kmBase = typeof kmAproximado === 'number' ? kmAproximado : 0
    const totalKm = kmBase + (holgura || 0)
    setKmTotal(totalKm)

    const ren = rendimiento > 0 ? rendimiento : 1
    const lts = totalKm / ren
    setLitros(lts)

    const pGas = GAS_PRICES[tipoGasolina]
    const cGas = lts * pGas
    setCostoGas(cGas)

    const cCasetas = typeof costoCasetas === 'number' ? costoCasetas : 0
    const cComidas = typeof costoComidas === 'number' ? costoComidas : 0
    
    setGranTotal(cGas + cCasetas + cComidas)
  }, [kmAproximado, holgura, rendimiento, tipoGasolina, costoCasetas, costoComidas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await onSave({
      vehiculoId,
      solicitanteNombre,
      motivo,
      tarjetaToka,
      numeroTag,
      rutas,
      kmAproximado: kmAproximado || 0,
      kmHolgura: kmTotal,
      rendimiento,
      tipoGasolina,
      precioGasolina: GAS_PRICES[tipoGasolina],
      litrosSolicitados: litros,
      costoGasolina: costoGas,
      numCasetas: numCasetas || 0,
      costoCasetas: costoCasetas || 0,
      costoComidas: costoComidas || 0,
      costoTotal: granTotal,
      estado: 'PENDIENTE'
    })
    setIsSubmitting(false)
  }

  const formatMoney = (val: number) => `$ ${val.toFixed(2)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-xl border bg-card p-6 shadow-xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
          <X className="size-4" />
        </Button>

        <div className="mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calculator className="size-5 text-primary" />
            Solicitud de Viáticos y Combustible
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Calculadora inteligente: Llena los campos y calcularemos automáticamente los montos requeridos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-8">
          
          {/* SECCIÓN 1: DATOS GENERALES */}
          <section className="space-y-4">
            <h3 className="font-semibold text-primary border-b pb-2">1. Datos Generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Solicitante <span className="text-destructive">*</span></Label>
                <Input required placeholder="Nombre completo" value={solicitanteNombre} onChange={e => setSolicitanteNombre(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vehículo <span className="text-destructive">*</span></Label>
                <Select value={vehiculoId} onValueChange={(v) => setVehiculoId(v || "")} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona la unidad">
                      {vehiculoId && vehicles.find((v: any) => v.id === vehiculoId)
                        ? `${vehicles.find((v: any) => v.id === vehiculoId)?.nombreInterno} - ${vehicles.find((v: any) => v.id === vehiculoId)?.placas}`
                        : ''}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{`${v.nombreInterno} - ${v.placas}`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Motivo de la Solicitud <span className="text-destructive">*</span></Label>
                <Input required placeholder="Ej. Capacitación, Entrega de mercancía..." value={motivo} onChange={e => setMotivo(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><CreditCard className="size-3"/> Tarjeta TOKA</Label>
                  <Input placeholder="Últimos 4 dígitos" value={tarjetaToka} onChange={e => setTarjetaToka(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Tag className="size-3"/> Número de TAG</Label>
                  <Input placeholder="ID del TAG" value={numeroTag} onChange={e => setNumeroTag(e.target.value)} />
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: RUTAS Y RENDIMIENTO */}
          <section className="space-y-4">
            <h3 className="font-semibold text-primary border-b pb-2">2. Ruta y Kilometraje</h3>
            <div className="space-y-2">
              <Label>Ruta(s) a realizar (Origen - Destinos) <span className="text-destructive">*</span></Label>
              <Input required placeholder="Ej. XALAPA, POZA RICA, TUXPAN..." value={rutas} onChange={e => setRutas(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Km aprox. por recorrer <span className="text-destructive">*</span></Label>
                <Input type="number" required min="1" value={kmAproximado} onChange={e => setKmAproximado(e.target.value ? Number(e.target.value) : '')} />
              </div>
              <div className="space-y-2">
                <Label>Holgura extra (Km)</Label>
                <Input type="number" value={holgura} onChange={e => setHolgura(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Rendimiento (Km/L)</Label>
                <Input type="number" step="0.1" value={rendimiento} onChange={e => setRendimiento(Number(e.target.value))} />
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: COMBUSTIBLE Y CASETAS */}
          <section className="space-y-4">
            <h3 className="font-semibold text-primary border-b pb-2">3. Tipo de Gasolina y Peajes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Gasolina <span className="text-destructive">*</span></Label>
                <Select value={tipoGasolina} onValueChange={(v: any) => setTipoGasolina(v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VERDE">Magna (Verde) - $23.79</SelectItem>
                    <SelectItem value="ROJA">Premium (Roja) - $28.55</SelectItem>
                    <SelectItem value="DIESEL">Diésel - $28.00</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Número de Casetas</Label>
                <Input type="number" min="0" value={numCasetas} onChange={e => setNumCasetas(e.target.value ? Number(e.target.value) : '')} />
              </div>
              <div className="space-y-2">
                <Label>Costo Casetas (MXN)</Label>
                <Input type="number" step="0.01" value={costoCasetas} onChange={e => setCostoCasetas(e.target.value ? Number(e.target.value) : '')} />
              </div>
            </div>
            
            <div className="space-y-2 md:w-1/3">
              <Label>Apoyo Comidas (MXN)</Label>
              <Input type="number" step="0.01" value={costoComidas} onChange={e => setCostoComidas(e.target.value ? Number(e.target.value) : '')} />
            </div>
          </section>

          {/* RESULTADO DE LA CALCULADORA */}
          <Card className="bg-primary/5 border-primary/20 shadow-inner">
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 items-center text-center">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Km a Recorrer</p>
                <p className="text-xl font-bold flex items-center justify-center gap-1"><Map className="size-4 text-muted-foreground"/> {kmTotal} km</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Litros Calculados</p>
                <p className="text-xl font-bold flex items-center justify-center gap-1"><Fuel className="size-4 text-muted-foreground"/> {litros.toFixed(2)} L</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Subtotal Gasolina</p>
                <p className="text-xl font-bold text-amber-600">{formatMoney(costoGas)}</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-2 border border-primary/20">
                <p className="text-xs text-primary uppercase font-bold tracking-widest">Gran Total Autorizar</p>
                <p className="text-2xl font-black text-primary flex items-center justify-center gap-1"><Banknote className="size-5"/> {formatMoney(granTotal)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
              {isSubmitting ? 'Guardando...' : 'Generar Solicitud'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
