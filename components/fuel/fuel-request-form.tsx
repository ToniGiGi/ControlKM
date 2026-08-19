'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Map, Fuel, Calculator, Banknote, CreditCard, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { createFuelRequest } from '@/app/actions/db'
import { useRole } from '@/components/role-provider'

const GAS_PRICES = {
  VERDE: 23.79,
  ROJA: 28.55,
  DIESEL: 28.00
}

type FuelRequestFormProps = {
  vehicles: any[]
  departments: any[]
}

export function FuelRequestForm({ vehicles, departments }: FuelRequestFormProps) {
  const router = useRouter()
  const { role, config } = useRole()

  const selectableVehicles = role === 'conductor'
    ? vehicles.filter(v => v.empleadoId === config.empleadoId)
    : vehicles

  // Datos Generales
  const [solicitanteNombre, setSolicitanteNombre] = useState(role === 'conductor' ? config.nombre : '')
  const [departamentoId, setDepartamentoId] = useState('')
  const [area, setArea] = useState('')
  const [vehiculoId, setVehiculoId] = useState(selectableVehicles.length === 1 ? selectableVehicles[0].id : '')
  const [motivo, setMotivo] = useState('')
  const [tarjetaToka, setTarjetaToka] = useState('')
  const [numeroTag, setNumeroTag] = useState('')

  // Auto-llenado de TOKA, TAG y Combustible según vehículo seleccionado
  useEffect(() => {
    if (!vehiculoId) return
    const selectedVehicle = vehicles.find(v => v.id === vehiculoId)
    if (!selectedVehicle) return

    const name = [selectedVehicle.nombreInterno, selectedVehicle.marca, selectedVehicle.modelo, selectedVehicle.alias].join(' ').toLowerCase()
    
    // Auto-llenado de TOKA / TAG
    if (name.includes('sunray')) {
      setTarjetaToka('5064 2983 7195 5362')
      setNumeroTag('IMDM31005090')
    } else if (name.includes('ducato')) {
      setTarjetaToka('5064 2983 9047 6457')
      setNumeroTag('IMDM296348204')
    } else if (name.includes('march')) {
      setTarjetaToka('5064 2983 8809 0195')
      setNumeroTag('')
    } else {
      setTarjetaToka('')
      setNumeroTag('')
    }

    // Auto-llenado del Tipo de Gasolina y Rendimiento
    let perf = 10;
    let fuel: keyof typeof GAS_PRICES = 'VERDE';

    if (name.includes('byd king')) { fuel = 'VERDE'; perf = 18; }
    else if (name.includes('ducato')) { fuel = 'DIESEL'; perf = 10; }
    else if (name.includes('fiat mobi')) { fuel = 'VERDE'; perf = 17; }
    else if (name.includes('gol')) { fuel = 'VERDE'; perf = 17; }
    else if (name.includes('civic')) { fuel = 'VERDE'; perf = 13.5; }
    else if (name.includes('i10 blanco')) { fuel = 'VERDE'; perf = 14; }
    else if (name.includes('i10 plata')) { fuel = 'VERDE'; perf = 13; }
    else if (name.includes('i10')) { fuel = 'VERDE'; perf = 13.5; }
    else if (name.includes('jac smart')) { fuel = 'VERDE'; perf = 14; }
    else if (name.includes('kia seltos')) { fuel = 'VERDE'; perf = 13; }
    else if (name.includes('march')) { fuel = 'VERDE'; perf = 16; }
    else if (name.includes('polo')) { fuel = 'VERDE'; perf = 16; }
    else if (name.includes('ram') || name.includes('promaster')) { fuel = 'VERDE'; perf = 13; }
    else if (name.includes('sunray')) { fuel = 'ROJA'; perf = 11; }
    else if (name.includes('tornado')) { fuel = 'VERDE'; perf = 16; }
    else {
      // Fallback a los datos del vehículo si existen, sino verde genérico
      if (selectedVehicle.combustible && ['VERDE', 'ROJA', 'DIESEL'].includes(selectedVehicle.combustible)) {
        fuel = selectedVehicle.combustible as keyof typeof GAS_PRICES;
      }
    }

    setTipoGasolina(fuel);
    setRendimiento(perf);
  }, [vehiculoId, vehicles])
  
  // Ruta y Calculadora
  const [routeLegs, setRouteLegs] = useState([{ origen: '', destino: '', tipo: 'sencillo', km: '' as number | '' }])
  const [holgura, setHolgura] = useState<number>(100)
  const [rendimiento, setRendimiento] = useState<number>(10)
  const [tipoGasolina, setTipoGasolina] = useState<keyof typeof GAS_PRICES>('VERDE')
  
  // Extras
  const [numCasetas, setNumCasetas] = useState<number | ''>('')
  const [costoCasetas, setCostoCasetas] = useState<number | ''>('')

  // Totales Auto-calculados
  const [kmTotal, setKmTotal] = useState(0)
  const [litros, setLitros] = useState(0)
  const [costoGas, setCostoGas] = useState(0)
  const [granTotal, setGranTotal] = useState(0)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Máscara para la tarjeta TOKA (16 dígitos)
  const handleTokaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '') // Solo números
    if (value.length > 16) value = value.slice(0, 16)
    
    // Formato XXXX XXXX XXXX XXXX
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value
    setTarjetaToka(formatted)
  }

  const addRouteLeg = () => {
    setRouteLegs([...routeLegs, { origen: '', destino: '', tipo: 'sencillo', km: '' }])
  }

  const updateRouteLeg = (index: number, field: string, value: any) => {
    const newLegs = [...routeLegs]
    newLegs[index] = { ...newLegs[index], [field]: value }
    setRouteLegs(newLegs)
  }

  const removeRouteLeg = (index: number) => {
    if (routeLegs.length > 1) {
      setRouteLegs(routeLegs.filter((_, i) => i !== index))
    }
  }

  // Motor de Calculadora Inteligente
  useEffect(() => {
    // Calcular KM base sumando las rutas (redondo multiplica x2)
    const kmBase = routeLegs.reduce((acc, leg) => {
      const legKm = typeof leg.km === 'number' ? leg.km : 0
      const multiplier = leg.tipo === 'redondo' ? 2 : 1
      return acc + (legKm * multiplier)
    }, 0)

    const totalKm = kmBase + (holgura || 0)
    setKmTotal(totalKm)

    const ren = rendimiento > 0 ? rendimiento : 1
    const lts = totalKm / ren
    setLitros(lts)

    const pGas = GAS_PRICES[tipoGasolina]
    const cGas = lts * pGas
    setCostoGas(cGas)

    const cCasetas = typeof costoCasetas === 'number' ? costoCasetas : 0
    
    setGranTotal(cGas + cCasetas)
  }, [routeLegs, holgura, rendimiento, tipoGasolina, costoCasetas])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Construir string de rutas para la BD
    const rutasString = routeLegs
      .map(l => `${l.origen || '?'} - ${l.destino || '?'} (${l.tipo})`)
      .join(' | ')

    const kmBaseAprox = routeLegs.reduce((acc, leg) => acc + ((typeof leg.km === 'number' ? leg.km : 0) * (leg.tipo === 'redondo' ? 2 : 1)), 0)

    try {
      await createFuelRequest({
        vehiculoId,
        solicitanteNombre,
        departamentoId,
        area,
        motivo,
        tarjetaToka,
        numeroTag,
        rutas: rutasString,
        kmAproximado: kmBaseAprox,
        kmHolgura: kmTotal,
        rendimiento,
        tipoGasolina,
        precioGasolina: GAS_PRICES[tipoGasolina],
        litrosSolicitados: litros,
        costoGasolina: costoGas,
        numCasetas: numCasetas || 0,
        costoCasetas: costoCasetas || 0,
        costoComidas: 0,
        costoTotal: granTotal,
        estado: 'PENDIENTE'
      })
      
      router.push('/combustible')
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
              <p className="text-sm text-muted-foreground">Información básica del conductor y el vehículo.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fila 1 */}
              <div className="space-y-2">
                <Label>Nombre del Solicitante <span className="text-destructive">*</span></Label>
                <Input required placeholder="Nombre completo" value={solicitanteNombre} onChange={e => setSolicitanteNombre(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Departamento <span className="text-destructive">*</span></Label>
                <Select value={departamentoId} onValueChange={(v) => setDepartamentoId(v || "")} required>
                  <SelectTrigger><SelectValue placeholder="Selecciona el departamento" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fila 2 */}
              <div className="space-y-2">
                <Label>Área / Puesto <span className="text-destructive">*</span></Label>
                <Input required placeholder="Ej. Ingeniero de servicio" value={area} onChange={e => setArea(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Vehículo <span className="text-destructive">*</span></Label>
                <Select value={vehiculoId} onValueChange={(v) => setVehiculoId(v || "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la unidad">
                      {vehiculoId ? (() => {
                        const v = vehicles.find(v => String(v.id) === String(vehiculoId))
                        if (!v) return vehiculoId;
                        const displayName = v.nombreInterno || v.alias || `${v.marca || ''} ${v.modelo || ''}`.trim() || 'Vehículo Desconocido'
                        const plates = v.placas || 'Sin placas'
                        return `${displayName} - ${plates}`
                      })() : "Selecciona la unidad"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {selectableVehicles.map(v => {
                      const displayName = v.nombreInterno || v.alias || `${v.marca || ''} ${v.modelo || ''}`.trim() || 'Vehículo Desconocido'
                      const plates = v.placas || 'Sin placas'
                      return (
                        <SelectItem key={v.id} value={v.id}>
                          {`${displayName} - ${plates}`}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Fila 3 */}
              <div className="space-y-2">
                <Label>Motivo de la Solicitud <span className="text-destructive">*</span></Label>
                <Input required placeholder="Ej. Capacitación, Entrega de mercancía..." value={motivo} onChange={e => setMotivo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><CreditCard className="size-4 text-muted-foreground"/> Tarjeta TOKA</Label>
                <Input placeholder="XXXX XXXX XXXX XXXX" value={tarjetaToka} onChange={handleTokaChange} maxLength={19} />
              </div>

              {/* Fila 4 */}
              {(() => {
                const selected = vehicles.find(v => v.id === vehiculoId)
                const name = (selected?.nombreInterno || '').toLowerCase()
                const showTag = name.includes('sunray') || name.includes('ducato')
                
                if (showTag) {
                  return (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5"><Tag className="size-4 text-muted-foreground"/> Número de TAG</Label>
                      <Input placeholder="ID del TAG" value={numeroTag} readOnly className="bg-muted/50" />
                    </div>
                  )
                }
                return <div className="hidden md:block"></div>
              })()}
              <div className="hidden md:block"></div>
            </div>
          </section>

          {/* SECCIÓN 2: RUTAS Y RENDIMIENTO */}
          <section className="space-y-5">
            <div className="border-b pb-2 flex justify-between items-end">
              <div>
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                  <Map className="size-5" />
                  2. Rutas del Viaje
                </h3>
                <p className="text-sm text-muted-foreground">Agrega todos los tramos de tu ruta. Los viajes redondos multiplican el kilometraje por 2.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addRouteLeg} className="hidden sm:flex">
                + Agregar Tramo
              </Button>
            </div>

            <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/50">
              {routeLegs.map((leg, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-card border rounded-lg shadow-sm items-stretch">
                  <div className="w-full flex flex-col justify-end gap-1.5">
                    <Label className="text-xs">Origen <span className="text-destructive">*</span></Label>
                    <Input required placeholder="Ej. Querétaro" value={leg.origen} onChange={e => updateRouteLeg(index, 'origen', e.target.value)} />
                  </div>
                  <div className="w-full flex flex-col justify-end gap-1.5">
                    <Label className="text-xs">Destino <span className="text-destructive">*</span></Label>
                    <Input required placeholder="Ej. Xalapa" value={leg.destino} onChange={e => updateRouteLeg(index, 'destino', e.target.value)} />
                  </div>
                  <div className="w-full sm:w-48 flex flex-col justify-end gap-1.5">
                    <Label className="text-xs whitespace-nowrap">Tipo de Viaje</Label>
                    <Select value={leg.tipo} onValueChange={v => updateRouteLeg(index, 'tipo', v)}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sencillo">Sencillo (Ida)</SelectItem>
                        <SelectItem value="redondo">Redondo (Ida y Vuelta)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full sm:w-36 flex flex-col justify-end gap-1.5">
                    <Label className="text-xs whitespace-nowrap">Distancia (km) <span className="text-destructive">*</span></Label>
                    <Input required type="number" min="1" placeholder="km" value={leg.km} onChange={e => updateRouteLeg(index, 'km', e.target.value ? Number(e.target.value) : '')} />
                  </div>
                  {routeLegs.length > 1 && (
                    <div className="flex flex-col justify-end">
                      <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeRouteLeg(index)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addRouteLeg} className="w-full sm:hidden mt-2">
                + Agregar Tramo
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="flex flex-col justify-end gap-2">
                <Label>Holgura extra total (Km) (Opcional)</Label>
                <Input type="number" value={holgura} onChange={e => setHolgura(Number(e.target.value))} />
              </div>
              <div className="flex flex-col justify-end gap-2">
                <Label className="flex items-center gap-1.5">Rendimiento (Km/L) <span className="text-[10px] text-muted-foreground font-normal">(Auto)</span></Label>
                <Input type="number" step="0.1" value={rendimiento} readOnly className="bg-muted/50 font-medium" />
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: COMBUSTIBLE Y CASETAS */}
          <section className="space-y-5">
            <div className="border-b pb-2">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <Fuel className="size-5" />
                3. Tipo de Gasolina y Peajes
              </h3>
              <p className="text-sm text-muted-foreground">Selecciona el tipo de combustible y añade el costo de peajes/casetas (si aplica).</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col justify-end gap-2">
                <Label>Gasolina <span className="text-destructive">*</span></Label>
                <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {tipoGasolina === 'VERDE' ? 'Magna (Verde)' : tipoGasolina === 'ROJA' ? 'Premium (Roja)' : 'Diésel'}
                  </span>
                  <span className="font-mono text-primary font-bold">
                    ${GAS_PRICES[tipoGasolina].toFixed(2)}/L
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col justify-end gap-2">
                <Label>Número de Casetas</Label>
                <Input type="number" min="0" value={numCasetas} onChange={e => setNumCasetas(e.target.value ? Number(e.target.value) : '')} />
              </div>
              <div className="flex flex-col justify-end gap-2">
                <Label>Costo Casetas (MXN)</Label>
                <Input type="number" step="0.01" value={costoCasetas} onChange={e => setCostoCasetas(e.target.value ? Number(e.target.value) : '')} />
              </div>
            </div>
          </section>

          {/* RESULTADO DE LA CALCULADORA */}
          <Card className="bg-primary/5 border-primary/20 shadow-inner mt-8">
            <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 items-center text-center">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Total Km a Recorrer</p>
                <p className="text-xl font-bold flex items-center justify-center gap-1 mt-1"><Map className="size-4 text-muted-foreground"/> {kmTotal} km</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Litros Calculados</p>
                <p className="text-xl font-bold flex items-center justify-center gap-1 mt-1"><Fuel className="size-4 text-muted-foreground"/> {litros.toFixed(2)} L</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold">Subtotal Gasolina</p>
                <p className="text-xl font-bold text-amber-600 mt-1">{formatMoney(costoGas)}</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                <p className="text-[10px] sm:text-xs text-primary uppercase font-bold tracking-widest">Gran Total Autorizar</p>
                <p className="text-2xl sm:text-3xl font-black text-primary flex items-center justify-center gap-1 mt-1"><Banknote className="size-5 sm:size-7"/> {formatMoney(granTotal)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="pt-6 flex justify-end gap-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.push('/combustible')} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[200px] text-base h-11">
              {isSubmitting ? 'Guardando...' : 'Generar Solicitud'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
