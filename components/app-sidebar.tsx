'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Truck,
  MapPin,
  Users,
  ShieldCheck,
  Wrench,
  Fuel,
  Receipt,
  TriangleAlert,
  FileText,
  BarChart3,
  Route,
  Settings,
  UserCircle,
  Building,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRole } from '@/components/role-provider'
import { useTheme } from '@/components/theme-provider'
import { useState, useEffect } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

const principal: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Vehículos', href: '/vehiculos', icon: Truck },
]

const cuenta: NavItem[] = [
  { label: 'Mi Perfil', href: '/perfil', icon: UserCircle }
]

const personas: NavItem[] = [{ label: 'Empleados', href: '/empleados', icon: Users }]

const operacion: NavItem[] = [
  { label: 'Seguros', href: '/seguros', icon: ShieldCheck, disabled: false },
  { label: 'Mantenimientos', href: '/mantenimientos', icon: Wrench, disabled: false },
  { label: 'Combustible', href: '/combustible', icon: Fuel, disabled: false },
  { label: 'Gastos', href: '/gastos', icon: Receipt, disabled: false },
  { label: 'Incidencias', href: '/incidencias', icon: TriangleAlert, disabled: false },
  { label: 'Viajes', href: '/viajes', icon: Route, disabled: false },
  { label: 'Reportes', href: '/reportes', icon: BarChart3, disabled: false },
]

const operacionConductor: NavItem[] = [
  { label: 'Mi Seguro', href: '/seguros', icon: ShieldCheck, disabled: false },
  { label: 'Mis Mantenimientos', href: '/mantenimientos', icon: Wrench, disabled: false },
  { label: 'Combustible', href: '/combustible', icon: Fuel, disabled: false },
  { label: 'Mis Gastos', href: '/gastos', icon: Receipt, disabled: false },
]

import Image from 'next/image'

const configuracionAdmin: NavItem[] = [
  { label: 'Organización', href: '/organizacion', icon: Building },
  { label: 'Personalización', href: '/personalizacion', icon: Settings },
]

const configuracionConductor: NavItem[] = [
  { label: 'Personalización', href: '/personalizacion', icon: Settings },
]

function NavGroup({ title, items, isCollapsed, pendingHref, onNavigate }: { title: string; items: NavItem[], isCollapsed?: boolean, pendingHref: string | null, onNavigate: (href: string) => void }) {
  const pathname = usePathname()
  return (
    <div className={cn("px-3", isCollapsed && "px-2")}>
      {!isCollapsed ? (
        <p className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          {title}
        </p>
      ) : (
        <div className="h-6" /> // spacer
      )}
      <ul className="space-y-1">
        {items.map((item) => {
          // Use pendingHref for instant feedback, fall back to actual pathname
          const effectivePath = pendingHref || pathname
          const active =
            item.href === '/' ? effectivePath === '/' : effectivePath.startsWith(item.href) && item.href !== '#'
          const Icon = item.icon
          if (item.disabled) {
            return (
              <li key={item.label}>
                <span className={cn(
                  "flex cursor-not-allowed items-center gap-2.5 rounded-lg py-1.5 text-[13px] text-sidebar-foreground/35 font-medium",
                  isCollapsed ? "justify-center px-0" : "px-3"
                )} title={item.label}>
                  <Icon className="size-[18px] shrink-0" />
                  <span className={cn(
                    "flex-1 overflow-hidden whitespace-nowrap transition-all duration-300",
                    isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 ml-2.5"
                  )}>
                    {item.label}
                  </span>
                  {!isCollapsed && (
                    <span className="rounded bg-sidebar-accent/60 px-1.5 py-0.5 text-[9px] font-medium uppercase text-sidebar-foreground/40 shrink-0">
                      Pronto
                    </span>
                  )}
                </span>
              </li>
            )
          }
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                title={item.label}
                onClick={() => onNavigate(item.href)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg py-1.5 text-[13px] transition-all duration-200 font-medium',
                  isCollapsed ? 'justify-center px-0' : 'px-3',
                  active
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-sidebar-foreground/80 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className={cn("shrink-0", isCollapsed ? "size-5" : "size-[18px]")} />
                <span className={cn(
                  "overflow-hidden whitespace-nowrap transition-all duration-300",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 ml-1"
                )}>
                  {item.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function AppSidebar({ isCollapsed }: { isCollapsed?: boolean }) {
  const pathname = usePathname()
  const { role } = useRole()
  const isConductor = role === 'conductor'
  const isSuperAdmin = role === 'super_admin'
  
  const { sidebarColor } = useTheme()
  const [isMounted, setIsMounted] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Reset pendingHref when actual pathname catches up
  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  const handleNavigate = (href: string) => {
    if (href !== pathname) {
      setPendingHref(href)
    }
  }

  return (
    <aside 
      className={cn(
        "flex h-full flex-col text-sidebar-foreground transition-all duration-300 ease-in-out border-r border-sidebar-border overflow-hidden shrink-0",
        isCollapsed ? "w-[72px]" : "w-[240px]"
      )}
      style={isMounted ? { backgroundColor: sidebarColor } : { backgroundColor: '#00173A' }}
    >
      <nav className="flex-1 overflow-y-auto pb-4 space-y-2 mt-6 custom-scrollbar">
        <NavGroup title="Principal" items={principal} isCollapsed={isCollapsed} pendingHref={pendingHref} onNavigate={handleNavigate} />
        {!isSuperAdmin && <NavGroup title="Cuenta" items={cuenta} isCollapsed={isCollapsed} pendingHref={pendingHref} onNavigate={handleNavigate} />}
        {!isConductor && <NavGroup title="Personas" items={personas} isCollapsed={isCollapsed} pendingHref={pendingHref} onNavigate={handleNavigate} />}
        {!isConductor && <NavGroup title="Operación" items={operacion} isCollapsed={isCollapsed} pendingHref={pendingHref} onNavigate={handleNavigate} />}
        {isConductor && <NavGroup title="Operación" items={operacionConductor} isCollapsed={isCollapsed} pendingHref={pendingHref} onNavigate={handleNavigate} />}
        
        {!isConductor && <NavGroup title="Configuración" items={configuracionAdmin} isCollapsed={isCollapsed} pendingHref={pendingHref} onNavigate={handleNavigate} />}
        {isConductor && <NavGroup title="Configuración" items={configuracionConductor} isCollapsed={isCollapsed} pendingHref={pendingHref} onNavigate={handleNavigate} />}
        {isConductor && (
          <div className={cn(
            "mx-4 mt-6 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs text-sidebar-foreground/70 overflow-hidden transition-all duration-300",
            isCollapsed ? "opacity-0 h-0 p-0 m-0 border-0" : "opacity-100 h-auto"
          )}>
            Como conductor solo puedes consultar la información de tu vehículo asignado.
          </div>
        )}
      </nav>

      <div className={cn("flex items-center py-5 border-t border-sidebar-border/20", isCollapsed ? "justify-center px-0" : "gap-3 px-6")}>
        <div className="flex shrink-0 items-center justify-center">
          {/* Sello Qrubyx (Isotipo) */}
          <div className="flex items-baseline justify-center shrink-0 transition-all duration-300 drop-shadow-sm">
            <span 
              className="font-black tracking-tighter text-white leading-none" 
              style={{ fontSize: isCollapsed ? '32px' : '38px', letterSpacing: '-0.05em' }}
            >
              Q
            </span>
            <div className={cn("bg-[#10b981] rounded-full shrink-0", isCollapsed ? "w-2 h-2 ml-0.5" : "w-2.5 h-2.5 ml-0.5")}></div>
          </div>
        </div>
        
        <div className={cn(
          "leading-tight overflow-hidden transition-all duration-300 whitespace-nowrap",
          isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          {/* Texto Qrubyx */}
          <div className="flex items-baseline">
            <p className="text-[17px] font-black tracking-tighter text-white" style={{ letterSpacing: '-0.05em' }}>Qrubyx</p>
            <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full ml-[2px]"></div>
          </div>
          <p className="text-[10px] text-sidebar-foreground/60 font-semibold uppercase tracking-[0.1em] mt-0.5">Solutions</p>
        </div>
      </div>
    </aside>
  )
}
