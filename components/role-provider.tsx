'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useSession } from 'next-auth/react'

export type Role = 'super_admin' | 'administrador' | 'conductor'

interface RoleConfig {
  role: Role
  label: string
  descripcion: string
  empleadoId: string
  nombre: string
  image?: string
}

interface RoleContextValue {
  role: Role
  config: RoleConfig
  setRole: (role: Role) => void
  can: (action: Permission) => boolean
}

export type Permission =
  | 'ver_toda_flotilla'
  | 'crear_editar'
  | 'eliminar'
  | 'configuracion'
  | 'gestionar_usuarios'

const permissionsByRole: Record<Role, Permission[]> = {
  super_admin: ['ver_toda_flotilla', 'crear_editar', 'eliminar', 'configuracion', 'gestionar_usuarios'],
  administrador: ['ver_toda_flotilla', 'crear_editar'],
  conductor: ['crear_editar'],
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  const role = (session?.user as any)?.role?.toLowerCase() as Role || 'conductor'
  const email = session?.user?.email || ''
  const name = session?.user?.name || email.split('@')[0] || 'Usuario'
  const image = session?.user?.image || undefined
  
  const empleadoId = (session?.user as any)?.employeeId || ''
  const config: RoleConfig = {
    role,
    label: role === 'super_admin' ? 'Super Admin' : role === 'administrador' ? 'Administrador' : 'Conductor',
    descripcion: '',
    empleadoId, 
    nombre: name,
    image,
  }

  const can = (action: Permission) => permissionsByRole[role]?.includes(action) || false

  return (
    <RoleContext.Provider value={{ role, config, setRole: () => {}, can }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole debe usarse dentro de RoleProvider')
  return ctx
}
