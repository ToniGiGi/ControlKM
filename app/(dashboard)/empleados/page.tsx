import { EmployeeList } from '@/components/employees/employee-list'
import { getEmployees, getVehicles, getBranches, getDepartments } from '@/app/actions/db'

export const dynamic = 'force-dynamic'

export default async function EmpleadosPage() {
  const employees = await getEmployees()
  const vehicles = await getVehicles()
  const branches = await getBranches()
  const departments = await getDepartments()
  
  return <EmployeeList 
    initialEmployees={employees} 
    initialVehicles={vehicles} 
    branches={branches}
    departments={departments}
  />
}
