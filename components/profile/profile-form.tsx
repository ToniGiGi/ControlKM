'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/app/actions/profile'

import { UploadCloud, Save, CheckCircle2 } from 'lucide-react'

export function ProfileForm({ user }: { user: any }) {
  const [loading, setLoading] = useState(false)
  
  const employee = user.employee || {}
  
  const [telefono, setTelefono] = useState(employee.telefono || '')
  const [password, setPassword] = useState('')
  const [licenciaBase64, setLicenciaBase64] = useState(employee.licencia || '')
  const [fileName, setFileName] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setFileName(file.name)
    const reader = new FileReader()
    reader.onloadend = () => {
      setLicenciaBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(user.id, {
        telefono,
        password,
        licenciaBase64,
        employeeId: employee.id
      })
      alert('Perfil actualizado correctamente')
      setPassword('') // Clear password field after save
    } catch (error) {
      alert('Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-2xl mx-auto w-full">
      <PageHeader 
        title="Mi Perfil" 
        description="Gestiona tu información personal y credenciales de acceso." 
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Tus datos de contacto. El correo electrónico no se puede cambiar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input id="nombre" value={employee.nombre || user.email.split('@')[0]} disabled />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" value={user.email} disabled className="bg-muted/50" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input 
                id="telefono" 
                value={telefono} 
                onChange={(e) => setTelefono(e.target.value)} 
                placeholder="Ej. 555-123-4567" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>
              Cambia tu contraseña de acceso si lo necesitas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Dejar en blanco para no cambiar" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mis Documentos</CardTitle>
            <CardDescription>
              Sube tu licencia de conducir vigente (Imagen o PDF).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Label htmlFor="licencia">Licencia de Conducir</Label>
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => document.getElementById('licencia-upload')?.click()}
                >
                  <UploadCloud className="size-4 mr-2" />
                  Seleccionar archivo
                </Button>
                <input 
                  type="file" 
                  id="licencia-upload" 
                  className="hidden" 
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
                
                <span className="text-sm text-muted-foreground">
                  {fileName || (employee.licencia ? 'Documento guardado' : 'Ningún archivo seleccionado')}
                </span>
                
                {licenciaBase64 && !fileName && (
                  <CheckCircle2 className="size-5 text-emerald-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Guardando...' : (
              <>
                <Save className="size-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
