import { getExpenses, getVehicles } from '@/app/actions/db'
import { ExpenseList } from '@/components/expenses/expense-list'

export default async function ExpensesPage() {
  const expenses = await getExpenses()
  const vehicles = await getVehicles()

  return <ExpenseList initialExpenses={expenses} vehicles={vehicles} />
}
