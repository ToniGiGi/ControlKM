import { getVehicles, getEmployees } from '@/app/actions/db'
import { VehicleDetail } from '@/components/vehicles/vehicle-detail'

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const vehicles = await getVehicles()
  const vehicle = vehicles.find(v => v.id === id)
  const employees = await getEmployees()
  
  return <VehicleDetail 
    id={id} 
    initialVehicle={JSON.parse(JSON.stringify(vehicle))} 
    employees={JSON.parse(JSON.stringify(employees))} 
  />
}
