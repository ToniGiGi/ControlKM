import { EmployeeList } from '@/components/employees/employee-list'
import { getEmployees, getVehicles, getBranches, getDepartments } from '@/app/actions/db'

export default async function EmpleadosPage() {
  const [employees, vehicles, branches, departments] = await Promise.all([
    getEmployees(),
    getVehicles(),
    getBranches(),
    getDepartments(),
  ])

  return <EmployeeList 
    initialEmployees={employees} 
    initialVehicles={vehicles} 
    branches={branches}
    departments={departments}
  />
}
