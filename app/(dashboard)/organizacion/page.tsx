'use client'

import { useState, useEffect, useRef } from 'react'
import { PageHeader } from '@/components/page-header'
import { Building, MapPin, Plus, Trash2, Save, ShieldCheck, Camera, UploadCloud, Users, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import {
  getBranches, createBranch, deleteBranch,
  getDepartments, createDepartment, deleteDepartment,
  getInsuranceCompanies, createInsuranceCompany, deleteInsuranceCompany,
  getOrganizationConfig, updateOrganizationConfig,
  getUsers, createUser, updateUserRole,
} from '@/app/actions/db'
import { useRole } from '@/components/role-provider'
import { toast } from 'sonner'
import Image from 'next/image'

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'CUENTAS_POR_PAGAR', label: 'Cuentas por Pagar' },
  { value: 'CONDUCTOR', label: 'Conductor' },
]

function roleLabel(role: string) {
  return ROLE_OPTIONS.find(r => r.value === role)?.label || role
}

export default function OrganizacionPage() {
  const { can } = useRole()
  const canManageUsers = can('gestionar_usuarios')

  const [branches, setBranches] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  const [newBranch, setNewBranch] = useState('')
  const [newDepartment, setNewDepartment] = useState('')
  const [newInsuranceCompany, setNewInsuranceCompany] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState('CONDUCTOR')
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)

  const [branchToDelete, setBranchToDelete] = useState<any>(null)
  const [departmentToDelete, setDepartmentToDelete] = useState<any>(null)
  const [insuranceToDelete, setInsuranceToDelete] = useState<any>(null)

  const [orgName, setOrgName] = useState('')
  const [orgLogo, setOrgLogo] = useState<string | null>(null)
  const [isSavingOrg, setIsSavingOrg] = useState(false)
  const [isLogoConfirmOpen, setIsLogoConfirmOpen] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [b, d, i, c, u] = await Promise.all([
        getBranches(),
        getDepartments(),
        getInsuranceCompanies(),
        getOrganizationConfig(),
        canManageUsers ? getUsers() : Promise.resolve([]),
      ])
      setBranches(b)
      setDepartments(d)
      setInsuranceCompanies(i)
      setUsers(u)
      if (c) {
        setOrgName(c.name)
        setOrgLogo(c.logoUrl)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Org handlers
  const handleSaveOrgConfig = async () => {
    if (!orgName.trim()) {
      toast.error('El nombre de la organización no puede estar vacío.')
      return
    }
    setIsSavingOrg(true)
    try {
      await updateOrganizationConfig({ name: orgName.trim(), logoUrl: orgLogo })
      toast.success('Configuración guardada correctamente')
    } catch (e: any) {
      toast.error('Error al guardar configuración: ' + e.message)
    }
    setIsSavingOrg(false)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setOrgLogo(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Branch handlers
  const handleAddBranch = async () => {
    if (!newBranch.trim()) {
      toast.error('El nombre de la sucursal no puede estar vacío.')
      return
    }
    try {
      await createBranch(newBranch.trim())
      setNewBranch('')
      toast.success('Sucursal agregada correctamente')
      loadData()
    } catch (e: any) {
      console.error(e)
      toast.error('Error al agregar sucursal: ' + e.message)
    }
  }

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return
    try {
      await deleteBranch(branchToDelete.id)
      toast.success('Sucursal eliminada')
      setBranchToDelete(null)
      loadData()
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
    }
  }

  // Department handlers
  const handleAddDepartment = async () => {
    if (!newDepartment.trim()) {
      toast.error('El nombre del área no puede estar vacío.')
      return
    }
    try {
      await createDepartment(newDepartment.trim())
      setNewDepartment('')
      toast.success('Área agregada correctamente')
      loadData()
    } catch (e: any) {
      console.error(e)
      toast.error('Error al agregar área: ' + e.message)
    }
  }

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return
    try {
      await deleteDepartment(departmentToDelete.id)
      toast.success('Área eliminada')
      setDepartmentToDelete(null)
      loadData()
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
    }
  }

  // Insurance handlers
  const handleAddInsurance = async () => {
    if (!newInsuranceCompany.trim()) {
      toast.error('El nombre de la aseguradora no puede estar vacío.')
      return
    }
    try {
      await createInsuranceCompany(newInsuranceCompany.trim())
      setNewInsuranceCompany('')
      toast.success('Aseguradora agregada correctamente')
      loadData()
    } catch (e: any) {
      console.error(e)
      toast.error('Error al agregar aseguradora: ' + e.message)
    }
  }

  const handleDeleteInsurance = async () => {
    if (!insuranceToDelete) return
    try {
      await deleteInsuranceCompany(insuranceToDelete.id)
      toast.success('Aseguradora eliminada')
      setInsuranceToDelete(null)
      loadData()
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
    }
  }

  // User handlers
  const handleCreateUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      toast.error('Captura el correo y la contraseña del nuevo usuario.')
      return
    }
    setIsCreatingUser(true)
    try {
      await createUser({ email: newUserEmail.trim(), password: newUserPassword, role: newUserRole })
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserRole('CONDUCTOR')
      toast.success('Usuario creado correctamente')
      loadData()
    } catch (e: any) {
      toast.error(e.message || 'Error al crear el usuario')
    }
    setIsCreatingUser(false)
  }

  const handleChangeUserRole = async (userId: string, role: string) => {
    setUpdatingUserId(userId)
    try {
      await updateUserRole(userId, role)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      toast.success('Rol actualizado')
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar el rol')
    }
    setUpdatingUserId(null)
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-2xl mx-auto w-full">
      <PageHeader
        title="Configuración de mi Organización"
        description="Administra el perfil de tu empresa, sucursales, áreas y aseguradoras."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Identidad de la Empresa */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col">
          <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg tracking-tight">Identidad de Empresa</h3>
                <p className="text-sm text-muted-foreground">Personaliza el nombre y logotipo que aparecerán en tus reportes.</p>
              </div>
            </div>
            <Button onClick={handleSaveOrgConfig} disabled={isSavingOrg} className="gap-2">
              <Save className="size-4" /> {isSavingOrg ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
          
          <div className="p-6 flex flex-col gap-6 items-start">
            <div className="space-y-2 w-full">
              <label className="text-sm font-medium">Nombre de la Organización</label>
              <Input 
                placeholder="Ej. Mi Empresa S.A. de C.V." 
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2 w-full">
              <label className="text-sm font-medium block">Logotipo de la Empresa</label>
              <div className="flex flex-col gap-4 w-full">
                <div 
                  className="relative h-56 w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/20 cursor-pointer overflow-hidden group hover:bg-muted/40 transition-colors"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {orgLogo ? (
                    <>
                      <Image src={orgLogo} alt="Logo" fill className="object-contain p-2" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="text-white size-8" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <UploadCloud className="size-10" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Subir Logo</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Recomendado: PNG o SVG transparente. Máx. 2MB.</p>
                  {orgLogo && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setIsLogoConfirmOpen(true)}>
                      Quitar logo
                    </Button>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={logoInputRef} 
                  onChange={handleLogoUpload} 
                  accept="image/png, image/jpeg, image/svg+xml" 
                  className="hidden" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sucursales */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col">
          <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg tracking-tight">Sucursales y Sedes</h3>
                <p className="text-sm text-muted-foreground">Gestiona las ubicaciones físicas de tu empresa.</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-muted/10 border-b">
            <label className="text-sm font-medium mb-2 block">Agregar nueva sucursal</label>
            <div className="flex gap-3">
              <Input 
                placeholder="Ej. Oficina Central, Bodega Norte..." 
                value={newBranch}
                onChange={e => setNewBranch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddBranch()}
                className="flex-1 bg-background"
              />
              <Button onClick={handleAddBranch} className="gap-2 shrink-0">
                <Plus className="w-4 h-4"/> Guardar
              </Button>
            </div>
          </div>

          <div className="flex-1 p-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Sucursales actuales</h4>
            <div className="border rounded-lg bg-background overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Cargando...
                </div>
              ) : branches.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <MapPin className="w-8 h-8 text-muted-foreground/30" />
                  <p>No hay sucursales registradas aún.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {branches.map(b => (
                    <li key={b.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors group">
                      <span className="font-medium">{b.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => setBranchToDelete(b)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Aseguradoras */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col">
          <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg tracking-tight">Aseguradoras</h3>
                <p className="text-sm text-muted-foreground">Opciones disponibles para pólizas.</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-muted/10 border-b">
            <label className="text-sm font-medium mb-2 block">Agregar nueva aseguradora</label>
            <div className="flex gap-3">
              <Input 
                placeholder="Ej. Quálitas, GNP, Mapfre..." 
                value={newInsuranceCompany}
                onChange={e => setNewInsuranceCompany(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddInsurance()}
                className="flex-1 bg-background"
              />
              <Button onClick={handleAddInsurance} className="gap-2 shrink-0">
                <Plus className="w-4 h-4"/> Guardar
              </Button>
            </div>
          </div>

          <div className="flex-1 p-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Aseguradoras registradas</h4>
            <div className="border rounded-lg bg-background overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Cargando...
                </div>
              ) : insuranceCompanies.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-muted-foreground/30" />
                  <p>No hay aseguradoras registradas aún.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {insuranceCompanies.map(i => (
                    <li key={i.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors group">
                      <span className="font-medium">{i.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => setInsuranceToDelete(i)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Áreas */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col">
          <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg tracking-tight">Departamentos y Áreas</h3>
                <p className="text-sm text-muted-foreground">Clasifica a tu personal por áreas de trabajo.</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-muted/10 border-b">
            <label className="text-sm font-medium mb-2 block">Agregar nuevo departamento</label>
            <div className="flex gap-3">
              <Input 
                placeholder="Ej. Ventas, Logística, Operaciones..." 
                value={newDepartment}
                onChange={e => setNewDepartment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDepartment()}
                className="flex-1 bg-background"
              />
              <Button onClick={handleAddDepartment} className="gap-2 shrink-0">
                <Plus className="w-4 h-4"/> Guardar
              </Button>
            </div>
          </div>

          <div className="flex-1 p-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Departamentos actuales</h4>
            <div className="border rounded-lg bg-background overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Cargando...
                </div>
              ) : departments.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Building className="w-8 h-8 text-muted-foreground/30" />
                  <p>No hay áreas registradas aún.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {departments.map(d => (
                    <li key={d.id} className="p-4 flex justify-between items-center hover:bg-muted/30 transition-colors group">
                      <span className="font-medium">{d.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => setDepartmentToDelete(d)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Usuarios y Roles (solo Super Admin) */}
      {canManageUsers && (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col">
          <div className="p-6 border-b bg-muted/30 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg tracking-tight">Usuarios y Roles</h3>
              <p className="text-sm text-muted-foreground">Da de alta cuentas y asigna el rol de cada quien: Super Admin, Administrador, Cuentas por Pagar o Conductor.</p>
            </div>
          </div>

          <div className="p-6 bg-muted/10 border-b">
            <label className="text-sm font-medium mb-2 block flex items-center gap-1.5"><KeyRound className="size-4" /> Crear nuevo usuario</label>
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                type="email"
                placeholder="correo@empresa.com"
                value={newUserEmail}
                onChange={e => setNewUserEmail(e.target.value)}
                className="flex-1 bg-background"
              />
              <Input
                type="password"
                placeholder="Contraseña"
                value={newUserPassword}
                onChange={e => setNewUserPassword(e.target.value)}
                className="md:w-48 bg-background"
              />
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v || 'CONDUCTOR')}>
                <SelectTrigger className="md:w-52 bg-background">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateUser} disabled={isCreatingUser} className="gap-2 shrink-0">
                <Plus className="w-4 h-4"/> {isCreatingUser ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </div>

          <div className="p-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Cuentas registradas</h4>
            <div className="border rounded-lg bg-background overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground flex justify-center items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Cargando...
                </div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Users className="w-8 h-8 text-muted-foreground/30" />
                  <p>No hay usuarios registrados aún.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {users.map(u => (
                    <li key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{u.employee?.nombre || u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <Select
                        value={u.role}
                        onValueChange={(v) => v && handleChangeUserRole(u.id, v)}
                        disabled={updatingUserId === u.id}
                      >
                        <SelectTrigger className="w-full sm:w-52">
                          <SelectValue>{roleLabel(u.role)}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modals */}
      <AlertDialog open={isLogoConfirmOpen} onOpenChange={setIsLogoConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar logotipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de quitar el logotipo de tu empresa. Tendrás que presionar "Guardar" para que este cambio sea permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setOrgLogo(null); setIsLogoConfirmOpen(false); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Quitar logo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!branchToDelete} onOpenChange={(open) => !open && setBranchToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sucursal?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la sucursal <strong>{branchToDelete?.name}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBranch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!departmentToDelete} onOpenChange={(open) => !open && setDepartmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar área?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el área <strong>{departmentToDelete?.name}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDepartment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!insuranceToDelete} onOpenChange={(open) => !open && setInsuranceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar aseguradora?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar la aseguradora <strong>{insuranceToDelete?.name}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInsurance} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
