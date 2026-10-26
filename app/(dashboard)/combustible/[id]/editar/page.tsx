import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getVehicles, getDepartments, getFuelRequest, getFuelPrices, getTagCards } from '@/app/actions/db'
import { FuelRequestForm } from '@/components/fuel/fuel-request-form'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function EditarSolicitudCombustiblePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const [request, vehicles, departments, fuelPrices, tagCards] = await Promise.all([
    getFuelRequest(id),
    getVehicles(),
    getDepartments(),
    getFuelPrices(),
    getTagCards(),
  ])

  const role = String((session?.user as any)?.role || '').toUpperCase()
  const employeeId = (session?.user as any)?.employeeId
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMINISTRADOR'
  const isOwner = role === 'CONDUCTOR' && !!employeeId && request?.vehiculo?.empleadoId === employeeId

  if (!request || request.estado !== 'PENDIENTE' || !(isAdmin || isOwner)) {
    redirect('/combustible')
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/combustible">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Editar Solicitud ${request.folio || ''}`.trim()}
          description={isAdmin
            ? 'Ajusta lo necesario; al aprobarla, el solicitante verá que fue aceptada con modificaciones.'
            : 'Corrige tu solicitud mientras sigue pendiente de aprobación.'}
        />
      </div>

      <FuelRequestForm vehicles={vehicles} departments={departments} initialRequest={request} fuelPrices={fuelPrices} tagCards={tagCards} />
    </div>
  )
}
