import { VehicleList } from '@/components/vehicles/vehicle-list'
import { getVehicles, getEmployees, getBranches } from '@/app/actions/db'

export const dynamic = 'force-dynamic'

export default async function VehiculosPage() {
  const [vehicles, employees, branches] = await Promise.all([
    getVehicles(),
    getEmployees(),
    getBranches()
  ])
  
  return <VehicleList 
    initialVehicles={vehicles} 
    initialEmployees={employees} 
    branches={branches} 
  />
}
