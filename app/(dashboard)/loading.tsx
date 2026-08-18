import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[70vh]">
      <div className="flex flex-col items-center gap-4 bg-white/50 p-8 rounded-2xl">
        <Loader2 className="size-12 animate-spin text-primary" />
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground">Cargando módulo...</h3>
          <p className="text-sm text-muted-foreground mt-1">Sincronizando con la base de datos</p>
        </div>
      </div>
    </div>
  )
}
