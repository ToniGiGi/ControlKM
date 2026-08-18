import { Truck } from 'lucide-react'

interface CustomLoaderProps {
  title?: string
  description?: string
}

export function CustomLoader({ 
  title = "Cargando módulo...", 
  description = "Sincronizando con la base de datos" 
}: CustomLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white/50 backdrop-blur-sm min-w-[300px]">
      
      {/* Animación del carrito y carretera */}
      <div className="relative w-48 h-20 mb-6 overflow-hidden flex flex-col justify-end">
        
        {/* Carrito con animación de rebote sutil */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 animate-[bounce_1s_infinite_alternate]">
          <Truck className="size-10 text-primary drop-shadow-md" strokeWidth={1.5} />
        </div>

        {/* Carretera */}
        <div className="w-full h-2 bg-slate-800 rounded-full relative overflow-hidden">
          {/* Líneas discontinuas moviéndose */}
          <div className="absolute inset-0 w-[200%] flex items-center animate-[slide_1s_linear_infinite]">
            <div className="w-full border-t-2 border-dashed border-white/70"></div>
          </div>
        </div>

      </div>

      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <style>{`
        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
