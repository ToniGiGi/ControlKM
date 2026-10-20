'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RouteMap, buildRouteLayers, legColor, parseSavedLegs } from './route-map'

// Muestra, solo para consulta, la ruta que se calculó al crear la solicitud de combustible.
export function RouteViewerDialog({ request, onClose }: { request: any | null; onClose: () => void }) {
  const legs = request ? parseSavedLegs(request.rutasDetalle) : []
  const { routes, markers } = buildRouteLayers(legs)

  return (
    <Dialog open={!!request} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Ruta {request?.folio ? `· ${request.folio}` : ''}
          </DialogTitle>
        </DialogHeader>
        {request && (
          <p className="text-sm text-muted-foreground -mt-2">
            {request.vehiculo?.nombreInterno || 'Vehículo'} · {request.solicitanteNombre || 'Sin nombre'} · {request.motivo}
          </p>
        )}

        {request && <RouteMap routes={routes} markers={markers} fitKey={1} />}

        <ol className="space-y-1.5 text-sm max-h-40 overflow-y-auto">
          {legs.map((leg, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: legColor(i).hex }} />
              <span className="min-w-0">
                <span className="font-medium">{leg.origen}</span>
                <span className="text-muted-foreground"> → </span>
                <span className="font-medium">{leg.destino}</span>
                <span className="text-muted-foreground">
                  {typeof leg.km === 'number' ? ` · ${leg.km} km` : ''}{leg.tipo === 'redondo' ? ' · redondo' : ''}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  )
}
