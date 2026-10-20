'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Fuel, GripVertical, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export type ColumnHelpers = {
  formatDate: (d: any) => string
  formatTime: (d: any) => string
  formatCurrency: (n: number) => string
  badgeClass: string
}

export type FuelColumn = {
  id: string
  label: string
  width: number // ancho aproximado en px, para no rebasar el espacio de la tabla
  defaultVisible: boolean
  render: (r: any, h: ColumnHelpers) => ReactNode
}

const sub = (main: ReactNode, secondary?: ReactNode) => (
  <div className="flex flex-col text-sm">
    <span>{main}</span>
    {secondary && <span className="text-xs text-muted-foreground">{secondary}</span>}
  </div>
)

export const FUEL_COLUMNS: FuelColumn[] = [
  {
    id: 'vehiculo', label: 'Vehículo', width: 260, defaultVisible: true,
    render: (r) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-9 rounded-md bg-muted p-1 shrink-0">
          <AvatarFallback className="rounded-md bg-transparent text-primary"><Fuel className="size-4" /></AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium text-sm truncate max-w-[180px]">{r.vehiculo?.nombreInterno || 'Vehículo Desconocido'}</span>
          {r.folio && <span className="text-[10px] font-mono text-muted-foreground">{r.folio}</span>}
        </div>
      </div>
    ),
  },
  {
    id: 'solicitante', label: 'Solicitante', width: 270, defaultVisible: true,
    render: (r, h) => (
      <div className="flex flex-col text-sm">
        <span className="font-medium">{r.solicitanteNombre || 'Sin nombre'}</span>
        <span className="text-xs text-muted-foreground">{h.formatDate(r.fechaSolicitud)}{r.createdAt ? ` · ${h.formatTime(r.createdAt)}` : ''}</span>
      </div>
    ),
  },
  {
    id: 'motivoRuta', label: 'Motivo y Ruta', width: 290, defaultVisible: true,
    render: (r) => (
      <div className="flex flex-col text-sm max-w-[220px]">
        <span className="font-medium truncate">{r.motivo}</span>
        <span className="text-xs text-muted-foreground truncate">{r.rutas}</span>
      </div>
    ),
  },
  { id: 'gasolina', label: 'Gasolina', width: 90, defaultVisible: true, render: (r) => sub(r.tipoGasolina, `${(r.litrosSolicitados || 0).toFixed(1)} L`) },
  {
    id: 'distancia', label: 'Distancia', width: 100, defaultVisible: true,
    render: (r) => sub(`${new Intl.NumberFormat().format(r.kmHolgura || 0)} km`, r.numCasetas ? `+${r.numCasetas} Casetas` : 'Sin peajes'),
  },
  {
    id: 'costoTotal', label: 'Costo Total', width: 115, defaultVisible: true,
    render: (r, h) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{h.formatCurrency(r.costoTotal)}</span>,
  },
  {
    id: 'estado', label: 'Estado', width: 135, defaultVisible: true,
    render: (r, h) => (
      <div className="flex flex-col items-start gap-1">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${h.badgeClass}`}>{r.estado}</span>
        {r.modificadaPorAdmin && <span className="text-[10px] font-medium text-amber-600">Con modificaciones</span>}
      </div>
    ),
  },
  { id: 'folio', label: 'Folio', width: 110, defaultVisible: false, render: (r) => <span className="font-mono text-xs">{r.folio || '-'}</span> },
  { id: 'fecha', label: 'Fecha y hora', width: 130, defaultVisible: false, render: (r, h) => sub(h.formatDate(r.fechaSolicitud), r.createdAt ? h.formatTime(r.createdAt) : undefined) },
  { id: 'departamento', label: 'Departamento', width: 150, defaultVisible: false, render: (r) => sub(r.departamento || '-') },
  { id: 'area', label: 'Área / Puesto', width: 150, defaultVisible: false, render: (r) => sub(r.area || '-') },
  { id: 'placas', label: 'Placas', width: 110, defaultVisible: false, render: (r) => sub(r.vehiculo?.placas || '-') },
  { id: 'tarjetaToka', label: 'Tarjeta TOKA', width: 200, defaultVisible: false, render: (r) => <span className="font-mono text-xs tracking-wider whitespace-nowrap">{r.tarjetaToka || '-'}</span> },
  { id: 'numeroTag', label: 'Número de TAG', width: 150, defaultVisible: false, render: (r) => <span className="font-mono text-xs">{r.numeroTag || '-'}</span> },
  { id: 'rendimiento', label: 'Rendimiento', width: 110, defaultVisible: false, render: (r) => sub(`${r.rendimiento ?? '-'} km/l`) },
  { id: 'litros', label: 'Litros', width: 100, defaultVisible: false, render: (r) => sub(`${(r.litrosSolicitados || 0).toFixed(2)} L`) },
  { id: 'costoGasolina', label: 'Costo gasolina', width: 130, defaultVisible: false, render: (r, h) => sub(h.formatCurrency(r.costoGasolina || 0), r.precioGasolina ? `${h.formatCurrency(r.precioGasolina)}/L` : undefined) },
  { id: 'casetas', label: 'Casetas', width: 115, defaultVisible: false, render: (r, h) => sub(h.formatCurrency(r.costoCasetas || 0), `${r.numCasetas || 0} casetas`) },
  { id: 'fechaPago', label: 'Fecha de pago', width: 125, defaultVisible: false, render: (r, h) => sub(r.fechaPago ? h.formatDate(r.fechaPago) : '-') },
  { id: 'motivoModificacion', label: 'Motivo de modificación', width: 230, defaultVisible: false, render: (r) => <span className="text-xs max-w-[220px] block truncate">{r.motivoModificacion || '-'}</span> },
  { id: 'observacionesRechazo', label: 'Motivo de rechazo', width: 230, defaultVisible: false, render: (r) => <span className="text-xs max-w-[220px] block truncate">{r.observacionesRechazo || '-'}</span> },
]

// Columna de Acciones (fija a la derecha): hasta 5 iconos más padding.
export const ACTIONS_COLUMN_WIDTH = 200

export type ColumnPref = { id: string; visible: boolean }

const widthOf = (id: string) => FUEL_COLUMNS.find(c => c.id === id)?.width || 150

const defaultPrefs = (): ColumnPref[] => FUEL_COLUMNS.map(c => ({ id: c.id, visible: c.defaultVisible }))

// Conserva el orden guardado, descarta columnas que ya no existen y agrega al final (ocultas) las nuevas.
function mergePrefs(saved: ColumnPref[]): ColumnPref[] {
  const known = new Set(FUEL_COLUMNS.map(c => c.id))
  const kept = saved.filter(p => known.has(p.id))
  const seen = new Set(kept.map(p => p.id))
  const added = FUEL_COLUMNS.filter(c => !seen.has(c.id)).map(c => ({ id: c.id, visible: false }))
  const merged = [...kept, ...added]
  return merged.some(p => p.visible) ? merged : defaultPrefs()
}

// Preferencia por usuario y navegador (localStorage); si no se puede leer se usa la vista por defecto.
export function useFuelColumnPrefs(userKey: string) {
  const storageKey = `fuel-table-columns:${userKey || 'anon'}`
  const [prefs, setPrefsState] = useState<ColumnPref[]>(defaultPrefs)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setPrefsState(mergePrefs(JSON.parse(raw)))
    } catch {}
  }, [storageKey])

  const setPrefs = (next: ColumnPref[]) => {
    setPrefsState(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
  }

  const visibleColumns = prefs
    .filter(p => p.visible)
    .map(p => FUEL_COLUMNS.find(c => c.id === p.id)!)
    .filter(Boolean)

  return { prefs, setPrefs, visibleColumns, resetPrefs: () => setPrefs(defaultPrefs()) }
}

function SortableColumnItem({ pref, label, onToggle, dragDisabled }: { pref: ColumnPref; label: string; onToggle: () => void; dragDisabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pref.id, disabled: dragDisabled })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 bg-background ${isDragging ? 'shadow-md ring-1 ring-primary/30 z-10 relative' : 'hover:bg-muted/60'}`}
    >
      <button
        type="button"
        className={`text-muted-foreground ${dragDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
        aria-label={`Mover ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-primary" checked={pref.visible} onChange={onToggle} />
        {label}
      </label>
    </li>
  )
}

export function ManageColumnsDialog({ open, onOpenChange, prefs, onSave, availableWidth }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefs: ColumnPref[]
  onSave: (prefs: ColumnPref[]) => void
  // Ancho real de la tabla en pantalla; las columnas visibles + Acciones no deben rebasarlo.
  availableWidth: number
}) {
  const [draft, setDraft] = useState<ColumnPref[]>(prefs)
  const [search, setSearch] = useState('')
  const [warning, setWarning] = useState('')

  useEffect(() => {
    if (open) { setDraft(prefs); setSearch(''); setWarning('') }
  }, [open, prefs])

  const usedWidth = ACTIONS_COLUMN_WIDTH + draft.filter(p => p.visible).reduce((acc, p) => acc + widthOf(p.id), 0)
  const usedPct = availableWidth > 0 ? Math.min(100, Math.round((usedWidth / availableWidth) * 100)) : 0

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const labelOf = (id: string) => FUEL_COLUMNS.find(c => c.id === id)?.label || id
  const q = search.trim().toLowerCase()
  const shown = q ? draft.filter(p => labelOf(p.id).toLowerCase().includes(q)) : draft
  const visibleCount = draft.filter(p => p.visible).length

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = draft.findIndex(p => p.id === active.id)
    const to = draft.findIndex(p => p.id === over.id)
    setDraft(arrayMove(draft, from, to))
  }

  const toggle = (id: string) => {
    const pref = draft.find(p => p.id === id)
    if (!pref) return
    if (!pref.visible && availableWidth > 0 && usedWidth + widthOf(id) > availableWidth) {
      setWarning(`Son demasiadas columnas para el ancho de tu pantalla. Oculta otra columna para poder agregar "${labelOf(id)}".`)
      return
    }
    setWarning('')
    setDraft(draft.map(p => (p.id === id ? { ...p, visible: !p.visible } : p)))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gestionar columnas</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">Marca las columnas que quieres ver y arrástralas para cambiar su orden.</p>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar" className="pl-9" />
        </div>
        {q && <p className="text-xs text-muted-foreground">Borra la búsqueda para poder reordenar.</p>}

        {availableWidth > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Espacio de la tabla</span>
              <span>{usedPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${usedPct >= 95 ? 'bg-destructive' : usedPct >= 80 ? 'bg-amber-500' : 'bg-primary'}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        )}

        {warning && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {warning}
          </p>
        )}

        <div className="max-h-[50vh] overflow-y-auto pr-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={shown.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-0.5">
                {shown.map(p => (
                  <SortableColumnItem key={p.id} pref={p} label={labelOf(p.id)} onToggle={() => toggle(p.id)} dragDisabled={!!q} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={() => { setDraft(defaultPrefs()); setWarning('') }}>Restablecer</Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button
              type="button"
              disabled={visibleCount === 0}
              onClick={() => { onSave(draft); onOpenChange(false) }}
            >
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
