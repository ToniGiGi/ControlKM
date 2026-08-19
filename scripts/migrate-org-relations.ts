import 'dotenv/config'
import { createClient } from '@libsql/client'
import { randomUUID } from 'crypto'

async function backfill(client: ReturnType<typeof createClient>, target: string) {
  console.log(`\n--- ${target} ---`)

  const branchCache = new Map<string, string>()
  async function getBranchId(name: string): Promise<string> {
    if (branchCache.has(name)) return branchCache.get(name)!
    const existing = await client.execute({ sql: 'SELECT id FROM "Branch" WHERE name = ?', args: [name] })
    if (existing.rows.length > 0) {
      const id = existing.rows[0].id as string
      branchCache.set(name, id)
      return id
    }
    const id = randomUUID()
    const now = new Date().toISOString()
    await client.execute({ sql: 'INSERT INTO "Branch" (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)', args: [id, name, now, now] })
    branchCache.set(name, id)
    console.log(`  + Branch creada: ${name}`)
    return id
  }

  const deptCache = new Map<string, string>()
  async function getDeptId(name: string): Promise<string> {
    if (deptCache.has(name)) return deptCache.get(name)!
    const existing = await client.execute({ sql: 'SELECT id FROM "Department" WHERE name = ?', args: [name] })
    if (existing.rows.length > 0) {
      const id = existing.rows[0].id as string
      deptCache.set(name, id)
      return id
    }
    const id = randomUUID()
    const now = new Date().toISOString()
    await client.execute({ sql: 'INSERT INTO "Department" (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)', args: [id, name, now, now] })
    deptCache.set(name, id)
    console.log(`  + Department creado: ${name}`)
    return id
  }

  const vehicles = await client.execute(`SELECT id, sucursal FROM "Vehicle" WHERE sucursal IS NOT NULL AND sucursal != '' AND sucursalId IS NULL`)
  for (const row of vehicles.rows) {
    const name = (row.sucursal as string).trim()
    if (!name) continue
    const branchId = await getBranchId(name)
    await client.execute({ sql: 'UPDATE "Vehicle" SET sucursalId = ? WHERE id = ?', args: [branchId, row.id as string] })
  }
  console.log(`  Vehicle.sucursal -> sucursalId: ${vehicles.rows.length} filas`)

  const empSucursal = await client.execute(`SELECT id, sucursal FROM "Employee" WHERE sucursal IS NOT NULL AND sucursal != '' AND sucursalId IS NULL`)
  for (const row of empSucursal.rows) {
    const name = (row.sucursal as string).trim()
    if (!name) continue
    const branchId = await getBranchId(name)
    await client.execute({ sql: 'UPDATE "Employee" SET sucursalId = ? WHERE id = ?', args: [branchId, row.id as string] })
  }
  console.log(`  Employee.sucursal -> sucursalId: ${empSucursal.rows.length} filas`)

  const empArea = await client.execute(`SELECT id, area FROM "Employee" WHERE area IS NOT NULL AND area != '' AND departamentoId IS NULL`)
  for (const row of empArea.rows) {
    const name = (row.area as string).trim()
    if (!name) continue
    const deptId = await getDeptId(name)
    await client.execute({ sql: 'UPDATE "Employee" SET departamentoId = ? WHERE id = ?', args: [deptId, row.id as string] })
  }
  console.log(`  Employee.area -> departamentoId: ${empArea.rows.length} filas`)

  const frDept = await client.execute(`SELECT id, departamento FROM "FuelRequest" WHERE departamento IS NOT NULL AND departamento != '' AND departamentoId IS NULL`)
  for (const row of frDept.rows) {
    const name = (row.departamento as string).trim()
    if (!name) continue
    const deptId = await getDeptId(name)
    await client.execute({ sql: 'UPDATE "FuelRequest" SET departamentoId = ? WHERE id = ?', args: [deptId, row.id as string] })
  }
  console.log(`  FuelRequest.departamento -> departamentoId: ${frDept.rows.length} filas`)
}

async function main() {
  const tursoUrl = process.env.DATABASE_URL?.split('?')[0]
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!tursoUrl || !tursoUrl.startsWith('libsql://')) {
    console.error('DATABASE_URL no es una URL de Turso.')
    process.exit(1)
  }

  await backfill(createClient({ url: tursoUrl, authToken }), 'Turso (producción)')
  await backfill(createClient({ url: 'file:./dev.db' }), 'dev.db (local)')

  console.log('\nBackfill completo.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
