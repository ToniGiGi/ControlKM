import { getVehicleDetail, getEmployees } from '@/app/actions/db'
import { VehicleDetail } from '@/components/vehicles/vehicle-detail'

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [vehicle, employees] = await Promise.all([
    getVehicleDetail(id),
    getEmployees(),
  ])

  return <VehicleDetail
    id={id}
    initialVehicle={JSON.parse(JSON.stringify(vehicle))}
    employees={JSON.parse(JSON.stringify(employees))}
  />
}
