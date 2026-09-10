'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calculator, Utensils, BedDouble, Car, Check, Minus, Plus,
  Banknote, FileText, CalendarDays, Fuel,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTravelRequest } from '@/app/actions/db'
import { useRole } from '@/components/role-provider'
import { SignatureModal } from '@/components/shared/signature-modal'
import { cn } from '@/lib/utils'

const PRECIO_COMIDA = 100
const PRECIO_NOCHE = 850

function toDateInputValue(date: Date) {
  const tz = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tz).toISOString().slice(0, 10)
}

function ViaticoCard({
  icon: Icon, label, hint, active, onToggle, children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  hint: string
  active: boolean
  onToggle: () => void
  children?: React.ReactNode
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
      className={cn(
        'rounded-xl border-2 p-4 transition-all cursor-pointer select-none',
        active
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-muted/30 grayscale opacity-60 hover:opacity-80'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={cn('flex items-center justify-center size-9 rounded-lg shrink-0', active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
            <Icon className="size-4.5" />
          </div>
          <div>
            <p className={cn('font-semibold text-sm', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        </div>
        <div className={cn('flex items-center justify-center size-6 rounded-full border-2 shrink-0', active ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30')}>
          {active && <Check className="size-3.5" />}
        </div>
      </div>

      {active && children && (
        <div className="mt-4 pt-4 border-t border-primary/20 space-y-2.5" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  )
}

function Stepper({ label, price, value, onChange }: { label: string; price: number; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-card border rounded-lg px-3 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">${price} c/u</p>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" className="size-7" onClick={() => onChange(Math.max(0, value - 1))}>
          <Minus className="size-3.5" />
        </Button>
        <span className="w-6 text-center font-semibold text-sm">{value}</span>
        <Button type="button" variant="outline" size="icon" className="size-7" onClick={() => onChange(value + 1)}>
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function CustomStepper({
  price, onPriceChange, value, onChange,
}: { price: number | ''; onPriceChange: (v: number | '') => void; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-card border rounded-lg px-3 py-2">
      <div className="flex-1">
        <p className="text-sm font-medium">Personalizado</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-muted-foreground">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Monto"
            value={price}
            onChange={(e) => onPriceChange(e.target.value ? Number(e.target.value) : '')}
            className="h-7 w-24 text-xs px-2"
          />
          <span className="text-xs text-muted-foreground">c/u</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" className="size-7" onClick={() => onChange(Math.max(0, value - 1))}>
          <Minus className="size-3.5" />
        </Button>
        <span className="w-6 text-center font-semibold text-sm">{value}</span>
        <Button type="button" variant="outline" size="icon" className="size-7" onClick={() => onChange(value + 1)}>
          <Plus className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function TransportItem({
  label, active, onToggle, amount, onAmountChange,
}: {
  label: string
  active: boolean
  onToggle: () => void
  amount: number | ''
  onAmountChange: (v: number | '') => void
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors', active ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/20')}>
      <button type="button" onClick={onToggle} className="flex items-center gap-2 text-sm font-medium">
        <div className={cn('flex items-center justify-center size-5 rounded-full border-2 shrink-0', active ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30')}>
          {active && <Check className="size-3" />}
        </div>
        <span className={active ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      </button>
      {active && (
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="Monto $"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value ? Number(e.target.value) : '')}
          className="w-28 h-8 text-sm"
        />
      )}
    </div>
  )
}

type TravelRequestFormProps = {
  fuelRequests: any[]
}

export function TravelRequestForm({ fuelRequests }: TravelRequestFormProps) {
  const router = useRouter()
  const { role, config } = useRole()

  const selectableFuelRequests = role === 'conductor'
    ? fuelRequests.filter(f => f.vehiculo?.empleadoId === config.empleadoId)
    : fuelRequests

  // Datos Generales
  const [solicitanteNombre, setSolicitanteNombre] = useState(role === 'conductor' ? config.nombre : '')
  const [puesto, setPuesto] = useState('')
  const [fecha, setFecha] = useState(toDateInputValue(new Date()))
  const [asociadoPedido, setAsociadoPedido] = useState(false)
  const [folioPedido, setFolioPedido] = useState('')
  const [fuelRequestFolio, setFuelRequestFolio] = useState('')

  // Comida
  const [incluyeComida, setIncluyeComida] = useState(false)
  const [numDesayunos, setNumDesayunos] = useState(0)
  const [numComidas, setNumComidas] = useState(0)
  const [numCenas, setNumCenas] = useState(0)
  const [numPersonalizadoComida, setNumPersonalizadoComida] = useState(0)
  const [precioPersonalizadoComida, setPrecioPersonalizadoComida] = useState<number | ''>('')

  // Hospedaje
  const [incluyeHospedaje, setIncluyeHospedaje] = useState(false)
  const [numNoches, setNumNoches] = useState(0)
  const [numPersonalizadoHospedaje, setNumPersonalizadoHospedaje] = useState(0)
  const [precioPersonalizadoHospedaje, setPrecioPersonalizadoHospedaje] = useState<number | ''>('')

  // Transporte
  const [incluyeTransporte, setIncluyeTransporte] = useState(false)
  const [usaUberDidi, setUsaUberDidi] = useState(false)
  const [montoUberDidi, setMontoUberDidi] = useState<number | ''>('')
  const [usaAutobus, setUsaAutobus] = useState(false)
  const [montoAutobus, setMontoAutobus] = useState<number | ''>('')

  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const costoComida = incluyeComida
    ? (numDesayunos + numComidas + numCenas) * PRECIO_COMIDA + numPersonalizadoComida * (Number(precioPersonalizadoComida) || 0)
    : 0
  const costoHospedaje = incluyeHospedaje
    ? numNoches * PRECIO_NOCHE + numPersonalizadoHospedaje * (Number(precioPersonalizadoHospedaje) || 0)
    : 0
  const costoTransporte = incluyeTransporte
    ? (usaUberDidi ? Number(montoUberDidi) || 0 : 0)
      + (usaAutobus ? Number(montoAutobus) || 0 : 0)
    : 0
  const costoTotal = costoComida + costoHospedaje + costoTransporte

  const hasAnyViatico = incluyeComida || incluyeHospedaje || incluyeTransporte

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasAnyViatico) {
      alert('Selecciona al menos un rubro de viáticos (Comida, Hospedaje o Transporte).')
      return
    }
    setShowSignatureModal(true)
  }

  const handleConfirmSignature = async (firmaSolicitanteUrl: string) => {
    setIsSubmitting(true)
    try {
      await createTravelRequest({
        empleadoId: config.empleadoId || null,
        solicitanteNombre,
        puesto,
        fecha: new Date(fecha),
        asociadoPedido,
        folioPedido: asociadoPedido ? folioPedido : null,
        fuelRequestFolio: fuelRequestFolio || null,
        incluyeComida,
        numDesayunos,
        numComidas,
        numCenas,
        numPersonalizadoComida,
        precioPersonalizadoComida: Number(precioPersonalizadoComida) || 0,
        costoComida,
        incluyeHospedaje,
        numNoches,
        numPersonalizadoHospedaje,
        precioPersonalizadoHospedaje: Number(precioPersonalizadoHospedaje) || 0,
        costoHospedaje,
        incluyeTransporte,
        transporteUberDidi: usaUberDidi ? (Number(montoUberDidi) || 0) : 0,
        transporteAutobus: usaAutobus ? (Number(montoAutobus) || 0) : 0,
        costoTransporte,
        costoTotal,
        estado: 'PENDIENTE',
        firmaSolicitanteUrl,
      })

      router.push('/viaticos')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Error al guardar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatMoney = (val: number) => `$ ${val.toFixed(2)}`

  return (
    <>
    <Card className="border-t-4 border-t-primary shadow-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-10">

          {/* SECCIÓN 1: DATOS GENERALES */}
          <section className="space-y-5">
            <div className="border-b pb-2">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <Calculator className="size-5" />
                1. Datos Generales
              </h3>
              <p className="text-sm text-muted-foreground">Información básica del solicitante.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nombre del Solicitante <span className="text-destructive">*</span></Label>
                <Input required placeholder="Nombre completo" value={solicitanteNombre} onChange={(e) => setSolicitanteNombre(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Puesto / Área <span className="text-destructive">*</span></Label>
                <Input required placeholder="Ej. Ingeniero de servicio" value={puesto} onChange={(e) => setPuesto(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><CalendarDays className="size-4 text-muted-foreground" /> Fecha <span className="text-destructive">*</span></Label>
                <Input required type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><FileText className="size-4 text-muted-foreground" /> Folio de Pedido {asociadoPedido && <span className="text-destructive">*</span>}</Label>
                <Input
                  required={asociadoPedido}
                  disabled={!asociadoPedido}
                  placeholder={asociadoPedido ? 'Ej. PED-00123' : 'No asociado a un pedido'}
                  value={folioPedido}
                  onChange={(e) => setFolioPedido(e.target.value)}
                  className={!asociadoPedido ? 'bg-muted/50' : ''}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="asociadoPedido" checked={asociadoPedido} onCheckedChange={(c) => setAsociadoPedido(c as boolean)} />
              <Label htmlFor="asociadoPedido" className="font-normal cursor-pointer">Esta solicitud está asociada a un pedido</Label>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Fuel className="size-4 text-muted-foreground" /> Vincular con Solicitud de Combustible (opcional)</Label>
              <Select value={fuelRequestFolio || 'none'} onValueChange={(v) => setFuelRequestFolio(!v || v === 'none' ? '' : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin vincular">
                    {fuelRequestFolio || 'Sin vincular'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="none">Sin vincular</SelectItem>
                  {selectableFuelRequests.map((f) => (
                    <SelectItem key={f.id} value={f.folio || f.id}>
                      {f.folio ? `${f.folio} — ` : ''}{f.vehiculo?.nombreInterno || 'Vehículo'} ({f.motivo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Si estos viáticos son por un viaje con solicitud de combustible ya generada, selecciónala aquí para dejar constancia.</p>
            </div>
          </section>

          {/* SECCIÓN 2: VIÁTICOS */}
          <section className="space-y-5">
            <div className="border-b pb-2">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <Banknote className="size-5" />
                2. Viáticos
              </h3>
              <p className="text-sm text-muted-foreground">Selecciona los rubros que aplican para este viaje.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              <ViaticoCard
                icon={Utensils}
                label="Comida"
                hint="Desayuno, comida y cena"
                active={incluyeComida}
                onToggle={() => setIncluyeComida((v) => !v)}
              >
                <Stepper label="Desayunos" price={PRECIO_COMIDA} value={numDesayunos} onChange={setNumDesayunos} />
                <Stepper label="Comidas" price={PRECIO_COMIDA} value={numComidas} onChange={setNumComidas} />
                <Stepper label="Cenas" price={PRECIO_COMIDA} value={numCenas} onChange={setNumCenas} />
                <CustomStepper price={precioPersonalizadoComida} onPriceChange={setPrecioPersonalizadoComida} value={numPersonalizadoComida} onChange={setNumPersonalizadoComida} />
                <div className="flex justify-between pt-1 text-sm font-semibold">
                  <span>Subtotal</span>
                  <span className="text-primary">{formatMoney(costoComida)}</span>
                </div>
              </ViaticoCard>

              <ViaticoCard
                icon={BedDouble}
                label="Hospedaje"
                hint={`$${PRECIO_NOCHE} por noche`}
                active={incluyeHospedaje}
                onToggle={() => setIncluyeHospedaje((v) => !v)}
              >
                <Stepper label="Noches" price={PRECIO_NOCHE} value={numNoches} onChange={setNumNoches} />
                <CustomStepper price={precioPersonalizadoHospedaje} onPriceChange={setPrecioPersonalizadoHospedaje} value={numPersonalizadoHospedaje} onChange={setNumPersonalizadoHospedaje} />
                <div className="flex justify-between pt-1 text-sm font-semibold">
                  <span>Subtotal</span>
                  <span className="text-primary">{formatMoney(costoHospedaje)}</span>
                </div>
              </ViaticoCard>

              <ViaticoCard
                icon={Car}
                label="Transporte"
                hint="Uber/Didi o autobús"
                active={incluyeTransporte}
                onToggle={() => setIncluyeTransporte((v) => !v)}
              >
                <TransportItem label="Uber / Didi" active={usaUberDidi} onToggle={() => setUsaUberDidi((v) => !v)} amount={montoUberDidi} onAmountChange={setMontoUberDidi} />
                <TransportItem label="Autobús" active={usaAutobus} onToggle={() => setUsaAutobus((v) => !v)} amount={montoAutobus} onAmountChange={setMontoAutobus} />
                <div className="flex justify-between pt-1 text-sm font-semibold">
                  <span>Subtotal</span>
                  <span className="text-primary">{formatMoney(costoTransporte)}</span>
                </div>
              </ViaticoCard>
            </div>
          </section>

          {/* RESULTADO DE LA CALCULADORA */}
          <Card className="bg-primary/5 border-primary/20 shadow-inner mt-8">
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Comida + Hospedaje</p>
                <p className="text-xl font-bold mt-1">{formatMoney(costoComida + costoHospedaje)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Transporte</p>
                <p className="text-xl font-bold text-amber-600 mt-1">{formatMoney(costoTransporte)}</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                <p className="text-[10px] sm:text-xs text-primary uppercase font-bold tracking-widest">Gran Total Autorizar</p>
                <p className="text-2xl sm:text-3xl font-black text-primary flex items-center justify-center gap-1 mt-1"><Banknote className="size-5 sm:size-7" /> {formatMoney(costoTotal)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="pt-6 flex justify-end gap-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/viaticos')} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[200px] text-base h-11">
              {isSubmitting ? 'Guardando...' : 'Firmar y Generar Solicitud'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <SignatureModal
      open={showSignatureModal}
      onOpenChange={setShowSignatureModal}
      title="Firma del Solicitante"
      description="Dibuja tu firma para confirmar y enviar la solicitud de viáticos."
      confirmLabel="Firmar y Enviar"
      onConfirm={handleConfirmSignature}
    />
    </>
  )
}
