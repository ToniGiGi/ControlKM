'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { updateProfile } from '@/app/actions/profile'
import { uploadImage } from '@/app/actions/upload'
import { toast } from 'sonner'
import { UploadCloud, Save, CheckCircle2, User, Mail, Phone, KeyRound, FileText, Loader2, Building, MapPin, Eye, Calendar } from 'lucide-react'

function toDateInputValue(value: any) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function getLicenseExpiration(vencimiento: string) {
  if (!vencimiento) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expDate = new Date(vencimiento)
  expDate.setHours(0, 0, 0, 0)

  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const totalDays = 365
  let percentage = Math.max(0, Math.min(100, (diffDays / totalDays) * 100))

  let status = 'VIGENTE'
  let progressColor = 'bg-green-500'
  let badgeColor = 'bg-green-500/10 text-green-600 border-green-500/20'

  if (diffDays <= 0) {
    status = 'VENCIDA'
    percentage = 0
    progressColor = 'bg-red-500'
    badgeColor = 'bg-red-500/10 text-red-600 border-red-500/20'
  } else if (diffDays <= 30) {
    status = 'POR VENCER'
    progressColor = 'bg-amber-500'
    badgeColor = 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  }

  return { diffDays, percentage, status, progressColor, badgeColor }
}

export function ProfileForm({ user }: { user: any }) {
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [savingSecurity, setSavingSecurity] = useState(false)
  const [savingDocs, setSavingDocs] = useState(false)
  const [uploadingLicencia, setUploadingLicencia] = useState(false)

  const employee = user.employee || {}
  const areaNombre = employee.departamentoRef?.name || employee.area
  const sucursalNombre = employee.sucursalRef?.name || employee.sucursal

  const [telefono, setTelefono] = useState(employee.telefono || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [licencia, setLicencia] = useState(employee.licencia || '')
  const [licenciaUrl, setLicenciaUrl] = useState(employee.licenciaUrl || '')
  const [vigenciaInicio, setVigenciaInicio] = useState(toDateInputValue(employee.licenciaVigenciaInicio))
  const [vigenciaFin, setVigenciaFin] = useState(toDateInputValue(employee.vencimientoLicencia))
  const [fileName, setFileName] = useState('')
  const [showDocViewer, setShowDocViewer] = useState(false)

  const displayName = employee.nombre || user.email.split('@')[0]
  const avatarUrl = employee.fotoUrl || user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}&backgroundColor=0f172a&textColor=ffffff`
  const expiration = getLicenseExpiration(vigenciaFin)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('Formato no soportado. Usa una imagen o un PDF.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo pesa demasiado. El tamaño máximo permitido es de 5 MB.')
      e.target.value = ''
      return
    }

    setFileName(file.name)
    setUploadingLicencia(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const url = await uploadImage(fd, 'licencias')
      setLicenciaUrl(url)
    } catch {
      toast.error('No se pudo subir el documento. Intenta de nuevo.')
      setFileName('')
    } finally {
      setUploadingLicencia(false)
    }
  }

  const handleSavePersonal = async () => {
    setSavingPersonal(true)
    try {
      await updateProfile(user.id, { telefono, employeeId: employee.id })
      toast.success('Información personal actualizada')
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSavingPersonal(false)
    }
  }

  const handleSaveSecurity = async () => {
    if (!password.trim()) {
      toast.error('Ingresa una nueva contraseña.')
      return
    }
    setSavingSecurity(true)
    try {
      await updateProfile(user.id, { password, currentPassword })
      toast.success('Contraseña actualizada correctamente')
      setPassword('')
      setCurrentPassword('')
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo actualizar la contraseña.')
    } finally {
      setSavingSecurity(false)
    }
  }

  const handleSaveDocuments = async () => {
    setSavingDocs(true)
    try {
      await updateProfile(user.id, {
        licencia,
        licenciaUrl,
        licenciaVigenciaInicio: vigenciaInicio || null,
        vencimientoLicencia: vigenciaFin || null,
        employeeId: employee.id
      })
      toast.success('Documentos actualizados')
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSavingDocs(false)
    }
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 pt-6 space-y-8">

      {/* ─── HEADER ESTILO SOCIAL (Banner + Avatar) ─── */}
      <div className="relative w-full mb-24 md:mb-20 rounded-xl shadow-sm bg-white">
        {/* Banner */}
        <div className="w-full h-48 md:h-64 overflow-hidden relative rounded-t-xl">
          <Image
            src="/vehiculos-login.png"
            alt="Fondo de Perfil"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Overlay sutil para oscurecer y dar contraste si la imagen es muy clara */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
        </div>

        {/* Avatar y Nombre superpuestos */}
        <div className="absolute -bottom-16 left-6 md:left-12 flex flex-col md:flex-row md:items-end gap-4 md:gap-6 w-[calc(100%-3rem)]">

          <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-lg flex-shrink-0">
            <Image
              src={avatarUrl}
              alt="Avatar del Usuario"
              fill
              className="object-cover"
            />
          </div>

          <div className="md:mb-4 bg-white/95 backdrop-blur-sm px-5 py-2.5 rounded-xl shadow-sm border border-slate-200/60 inline-flex flex-col">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{displayName}</h1>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{employee.puesto || 'Miembro del Equipo'}</p>
          </div>

        </div>
      </div>

      {/* ─── DETALLES Y SECCIONES (Grid de 2 Columnas) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Columna Izquierda: Información de solo lectura */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm border-slate-200/60 sticky top-6">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-lg">Detalles de Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <User className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Nombre</p>
                  <p className="text-sm text-slate-700 font-medium">{displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Mail className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Correo Electrónico</p>
                  <p className="text-sm text-slate-700 font-medium break-all">{user.email}</p>
                </div>
              </div>
              {telefono && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Teléfono Principal</p>
                    <p className="text-sm text-slate-700 font-medium">{telefono}</p>
                  </div>
                </div>
              )}
              {areaNombre && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Building className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Área</p>
                    <p className="text-sm text-slate-700 font-medium">{areaNombre}</p>
                  </div>
                </div>
              )}
              {sucursalNombre && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Sucursal</p>
                    <p className="text-sm text-slate-700 font-medium">{sucursalNombre}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Secciones editables, cada una con su propio guardado */}
        <div className="lg:col-span-8 space-y-6">

          {/* Card 1: Datos Personales */}
          <Card className="shadow-sm border-slate-200/60 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4 flex flex-row items-center gap-2">
              <User className="size-5 text-slate-400" />
              <div>
                <CardTitle className="text-lg">Información Personal</CardTitle>
                <CardDescription>Actualiza tus datos de contacto básicos.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" value={displayName} disabled className="bg-slate-50 text-slate-500" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" value={user.email} disabled className="bg-slate-50 text-slate-500" />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="telefono">Teléfono de Contacto</Label>
                <Input
                  id="telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 555-123-4567"
                  className="focus-visible:ring-blue-500 h-11"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <Button type="button" size="sm" onClick={handleSavePersonal} disabled={savingPersonal} className="gap-1.5">
                  {savingPersonal ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {savingPersonal ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Seguridad */}
          <Card className="shadow-sm border-slate-200/60 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4 flex flex-row items-center gap-2">
              <KeyRound className="size-5 text-slate-400" />
              <div>
                <CardTitle className="text-lg">Seguridad</CardTitle>
                <CardDescription>Cambia tu contraseña de acceso si lo requieres.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Requerida para cambiar la contraseña"
                    className="focus-visible:ring-blue-500 h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Nueva Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Dejar en blanco para no cambiar"
                    className="focus-visible:ring-blue-500 h-11"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="button" size="sm" onClick={handleSaveSecurity} disabled={savingSecurity} className="gap-1.5">
                  {savingSecurity ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {savingSecurity ? 'Guardando...' : 'Actualizar Contraseña'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Documentos */}
          <Card className="shadow-sm border-slate-200/60 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-4 flex flex-row items-center gap-2">
              <FileText className="size-5 text-slate-400" />
              <div>
                <CardTitle className="text-lg">Mis Documentos</CardTitle>
                <CardDescription>Sube tu licencia de conducir vigente (Imagen o PDF).</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid gap-6">
              <div className="grid gap-2 max-w-md">
                <Label htmlFor="licenciaNumero">No. de Licencia</Label>
                <Input
                  id="licenciaNumero"
                  value={licencia}
                  onChange={(e) => setLicencia(e.target.value)}
                  placeholder="Ej. ABC123456"
                  className="focus-visible:ring-blue-500 h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
                <div className="grid gap-2">
                  <Label htmlFor="vigenciaInicio">Vigencia Desde</Label>
                  <Input
                    id="vigenciaInicio"
                    type="date"
                    value={vigenciaInicio}
                    onChange={(e) => setVigenciaInicio(e.target.value)}
                    className="focus-visible:ring-blue-500 h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vigenciaFin">Vigencia Hasta</Label>
                  <Input
                    id="vigenciaFin"
                    type="date"
                    value={vigenciaFin}
                    onChange={(e) => setVigenciaFin(e.target.value)}
                    className="focus-visible:ring-blue-500 h-11"
                  />
                </div>
              </div>

              {expiration && (
                <div className="max-w-2xl grid gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <Calendar className="size-4" />
                      {expiration.status === 'VENCIDA'
                        ? `Licencia vencida hace ${Math.abs(expiration.diffDays)} días`
                        : `${expiration.diffDays} días para que venza`}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${expiration.badgeColor}`}>
                      {expiration.status}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-secondary overflow-hidden rounded-full">
                    <div
                      className={`h-full transition-all duration-500 ease-in-out ${expiration.progressColor}`}
                      style={{ width: `${expiration.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                <Label htmlFor="licencia-upload">Documento / Foto de la Licencia</Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('licencia-upload')?.click()}
                    disabled={uploadingLicencia}
                    className="h-11 border-dashed border-2 hover:bg-slate-50"
                  >
                    {uploadingLicencia ? (
                      <Loader2 className="size-5 mr-2 text-slate-400 animate-spin" />
                    ) : (
                      <UploadCloud className="size-5 mr-2 text-slate-400" />
                    )}
                    {uploadingLicencia ? 'Subiendo...' : 'Seleccionar archivo'}
                  </Button>
                  <input
                    type="file"
                    id="licencia-upload"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    disabled={uploadingLicencia}
                  />

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-600">
                      {fileName || (licenciaUrl ? 'Documento actual guardado' : 'Ningún archivo seleccionado')}
                    </span>
                    {licenciaUrl && !uploadingLicencia && (
                      <CheckCircle2 className="size-5 text-emerald-500" />
                    )}
                  </div>

                  {licenciaUrl && (
                    <button
                      type="button"
                      onClick={() => setShowDocViewer(true)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      <Eye className="size-4" /> Ver documento
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" size="sm" onClick={handleSaveDocuments} disabled={savingDocs || uploadingLicencia} className="gap-1.5">
                  {savingDocs ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {savingDocs ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Visor de documento */}
      <Dialog open={showDocViewer} onOpenChange={setShowDocViewer}>
        <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Licencia de Conducir</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto rounded-xl border bg-muted/20 flex items-center justify-center p-2">
            {licenciaUrl && licenciaUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe src={licenciaUrl} className="w-full h-full rounded-lg" title="Licencia de conducir (PDF)" />
            ) : (
              licenciaUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={licenciaUrl} alt="Licencia de conducir" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
