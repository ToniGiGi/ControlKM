'use client'

import { Bell, Menu, Search, PanelLeftClose, PanelLeft, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  AlertCircle, AlertTriangle, Info, Clock, ShieldCheck, Wrench, Fuel, Receipt, TriangleAlert
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRole } from '@/components/role-provider'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { getAlerts } from '@/app/actions/db'

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
}

function timeAgo(date: string | Date | undefined) {
  if (!date) return 'Reciente';
  const d = new Date(date);
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
  let interval = seconds / 86400;
  if (interval > 1) return "hace " + Math.floor(interval) + (Math.floor(interval) === 1 ? " día" : " días");
  interval = seconds / 3600;
  if (interval > 1) return "hace " + Math.floor(interval) + (Math.floor(interval) === 1 ? " hr" : " hrs");
  interval = seconds / 60;
  if (interval > 1) return "hace " + Math.floor(interval) + " min";
  return "ahora mismo";
}

export function Topbar({ onMenu, onToggleCollapse, isCollapsed }: { onMenu: () => void, onToggleCollapse?: () => void, isCollapsed?: boolean }) {
  const { config, role } = useRole()
  const router = useRouter()
  const pathname = usePathname()
  const [dynamicAlerts, setDynamicAlerts] = useState<any[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('dismissedAlerts')
    if (saved) {
      try {
        setDismissedAlerts(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  useEffect(() => {
    const fetchAlerts = () => {
      getAlerts(role === 'conductor' ? config.empleadoId : undefined).then(setDynamicAlerts).catch(console.error)
    }
    fetchAlerts() // fetch initially
    const interval = setInterval(fetchAlerts, 5000) // poll every 5s
    return () => clearInterval(interval)
  }, [pathname, role, config.empleadoId])

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newDismissed = [...dismissedAlerts, id]
    setDismissedAlerts(newDismissed)
    localStorage.setItem('dismissedAlerts', JSON.stringify(newDismissed))
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const allIds = dynamicAlerts.map(a => a.id)
    const newDismissed = Array.from(new Set([...dismissedAlerts, ...allIds]))
    setDismissedAlerts(newDismissed)
    localStorage.setItem('dismissedAlerts', JSON.stringify(newDismissed))
  }

  const visibleAlerts = dynamicAlerts.filter(a => !dismissedAlerts.includes(a.id))

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:px-6 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu} aria-label="Abrir menú">
          <Menu className="size-5" />
        </Button>

        {onToggleCollapse && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden md:flex text-muted-foreground hover:text-foreground" 
            onClick={onToggleCollapse} 
            aria-label="Alternar menú"
          >
            {isCollapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
          </Button>
        )}

      </div>

      <div className="flex items-center justify-end gap-3 md:gap-5">
        {/* Notificaciones */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 w-9" aria-label="Alertas">
            <Bell className="size-5 text-muted-foreground" />
            {visibleAlerts.length > 0 && (
              <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full border-2 border-background bg-destructive text-[9px] font-bold text-destructive-foreground">
                {visibleAlerts.length}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border-b">
              <span className="text-sm font-medium text-foreground">Alertas recientes</span>
              {visibleAlerts.length > 0 && (
                <Button variant="ghost" size="sm" className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800/50" onClick={handleClearAll}>
                  Limpiar todas
                </Button>
              )}
            </div>
            {visibleAlerts.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="rounded-full bg-muted p-3">
                  <Bell className="size-6 text-muted-foreground/50" />
                </div>
                <div className="text-sm font-medium text-foreground">Estás al día</div>
                <div className="text-xs text-muted-foreground">No tienes notificaciones pendientes</div>
              </div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto p-1 custom-scrollbar">
                {visibleAlerts.slice(0, 10).map((a, i) => {
                  const isAlta = a.severidad === 'alta'
                  
                  let ModuleIcon = isAlta ? AlertCircle : AlertTriangle
                  if (a.href === '/seguros') ModuleIcon = ShieldCheck
                  else if (a.href === '/mantenimientos') ModuleIcon = Wrench
                  else if (a.href === '/combustible') ModuleIcon = Fuel
                  else if (a.href === '/gastos') ModuleIcon = Receipt
                  else if (a.href === '/incidencias') ModuleIcon = TriangleAlert

                  return (
                    <DropdownMenuItem 
                      key={a.id || i} 
                      className="flex items-start gap-3 p-3 cursor-pointer group/alert rounded-lg transition-colors focus:bg-muted mb-1 last:mb-0" 
                      onClick={() => a.href && router.push(a.href)}
                    >
                      <div className={`mt-0.5 flex shrink-0 items-center justify-center rounded-full size-8 ${isAlta ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'}`}>
                        <ModuleIcon className="size-4" />
                      </div>
                      <div className="flex flex-col w-full gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-sm font-medium leading-none ${isAlta ? 'text-destructive' : 'text-foreground'}`}>
                            {a.tipo}
                          </span>
                          <button 
                            onClick={(e) => handleDismiss(a.id, e)} 
                            className="text-muted-foreground opacity-0 group-hover/alert:opacity-100 transition-opacity hover:text-foreground p-1 rounded-md hover:bg-muted-foreground/10 shrink-0" 
                            aria-label="Descartar"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        <span className="text-xs text-muted-foreground leading-snug pr-4 line-clamp-2">
                          {a.mensaje}
                        </span>
                        {a.fecha && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground/70 font-medium">
                            <Clock className="size-3" />
                            <span>{timeAgo(a.fecha)}</span>
                          </div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 pl-1 cursor-pointer outline-none group">
            <div className="hidden leading-tight lg:block text-right">
              <p className="text-sm font-semibold group-hover:text-primary transition-colors">{config.nombre}</p>
              <p className="text-xs text-muted-foreground">{config.label}</p>
            </div>
            <Avatar className="size-9 border border-border group-hover:border-primary/50 transition-colors">
              <AvatarImage src={config.image || undefined} alt={config.nombre} className="object-cover" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {initials(config.nombre)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{config.nombre}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {config.role}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive">
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
