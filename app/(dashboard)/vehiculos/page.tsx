import { VehicleList } from '@/components/vehicles/vehicle-list'
import { getVehicles, getEmployees, getBranches } from '@/app/actions/db'

export default async function VehiculosPage() {
  const [vehicles, employees, branches] = await Promise.all([
    getVehicles(),
    getEmployees(),
    getBranches()
  ])
  
  return <VehicleList 
    initialVehicles={JSON.parse(JSON.stringify(vehicles))} 
    initialEmployees={JSON.parse(JSON.stringify(employees))} 
    branches={JSON.parse(JSON.stringify(branches))} 
  />
}
