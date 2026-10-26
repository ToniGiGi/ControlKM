'use client'

import { useEffect, useState } from 'react'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getTagCards, createTagCard, deleteTagCard } from '@/app/actions/db'

// Catálogo de TAGs de casetas: de aquí se elige cuál se usa en cada solicitud de combustible.
export function TagCardsCard({ canEdit }: { canEdit: boolean }) {
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [numero, setNumero] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [tagToDelete, setTagToDelete] = useState<any>(null)

  const loadTags = async () => {
    try {
      setTags(await getTagCards())
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTags()
  }, [])

  const handleAdd = async () => {
    if (!numero.trim()) {
      toast.error('Captura el número del TAG.')
      return
    }
    try {
      await createTagCard({ numero, ubicacion })
      setNumero('')
      setUbicacion('')
      toast.success('TAG agregado correctamente')
      loadTags()
    } catch (e: any) {
      toast.error(e.message || 'Error al agregar el TAG')
    }
  }

  const handleDelete = async () => {
    if (!tagToDelete) return
    try {
      await deleteTagCard(tagToDelete.id)
      toast.success('TAG eliminado')
      setTagToDelete(null)
      loadTags()
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
    }
  }

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col">
      <div className="p-6 border-b bg-muted/30 flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Tag className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg tracking-tight">Tarjetas TAG</h3>
          <p className="text-sm text-muted-foreground">TAGs de casetas que se pueden elegir en las solicitudes de combustible.</p>
        </div>
      </div>

      {canEdit && (
        <div className="p-6 bg-muted/10 border-b">
          <label className="text-sm font-medium mb-2 block">Agregar nuevo TAG</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Ej. IMDM 31005169-4"
              value={numero}
              onChange={e => setNumero(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1 bg-background"
            />
            <Input
              placeholder="Ubicación (ej. Querétaro)"
              value={ubicacion}
              onChange={e => setUbicacion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="sm:w-48 bg-background"
            />
            <Button onClick={handleAdd} className="gap-2 shrink-0">
              <Plus className="w-4 h-4"/> Guardar
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 p-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">TAGs registrados ({tags.length})</h4>
        <div className="border rounded-lg bg-background overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Cargando...
            </div>
          ) : tags.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <Tag className="w-8 h-8 text-muted-foreground/30" />
              <p>No hay TAGs registrados aún.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {tags.map(t => {
                const lost = /extraviad/i.test(t.ubicacion || '')
                return (
                  <li key={t.id} className="p-4 flex justify-between items-center gap-3 hover:bg-muted/30 transition-colors group">
                    <div className="min-w-0">
                      <span className="font-medium font-mono">{t.numero}</span>
                      {t.ubicacion && (
                        <span className={`ml-2 text-xs rounded-full px-2 py-0.5 ${lost ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
                          {t.ubicacion}
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <Button variant="ghost" size="icon" onClick={() => setTagToDelete(t)} className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Los TAGs con ubicación "Extraviada" aparecen bloqueados en las solicitudes.</p>
      </div>

      <AlertDialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar TAG?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el TAG <strong>{tagToDelete?.numero}</strong>. Ya no se podrá elegir en nuevas solicitudes; las solicitudes anteriores conservan su número.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
