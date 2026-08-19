import { VehicleList } from '@/components/vehicles/vehicle-list'
import { getVehicles, getEmployees, getBranches } from '@/app/actions/db'

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
