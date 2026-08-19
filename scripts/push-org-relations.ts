import 'dotenv/config'
import { createClient } from '@libsql/client'

async function run(client: ReturnType<typeof createClient>, label: string, sql: string) {
  try {
    await client.execute(sql)
    console.log(`✅ ${label}`)
  } catch (e: any) {
    console.error(`❌ ${label}: ${e.message}`)
  }
}

async function applyTo(url: string, authToken: string | undefined, target: string) {
  console.log(`\n--- ${target} ---`)
  const client = createClient({ url, authToken })

  await run(client, 'Employee.sucursalId', 'ALTER TABLE "Employee" ADD COLUMN "sucursalId" TEXT')
  await run(client, 'Employee.departamentoId', 'ALTER TABLE "Employee" ADD COLUMN "departamentoId" TEXT')
  await run(client, 'Vehicle.sucursalId', 'ALTER TABLE "Vehicle" ADD COLUMN "sucursalId" TEXT')
  await run(client, 'FuelRequest.departamentoId', 'ALTER TABLE "FuelRequest" ADD COLUMN "departamentoId" TEXT')

  await run(client, 'idx Employee_sucursalId', 'CREATE INDEX IF NOT EXISTS "Employee_sucursalId_idx" ON "Employee"("sucursalId")')
  await run(client, 'idx Employee_departamentoId', 'CREATE INDEX IF NOT EXISTS "Employee_departamentoId_idx" ON "Employee"("departamentoId")')
  await run(client, 'idx Vehicle_sucursalId', 'CREATE INDEX IF NOT EXISTS "Vehicle_sucursalId_idx" ON "Vehicle"("sucursalId")')
  await run(client, 'idx FuelRequest_departamentoId', 'CREATE INDEX IF NOT EXISTS "FuelRequest_departamentoId_idx" ON "FuelRequest"("departamentoId")')
}

async function main() {
  const tursoUrl = process.env.DATABASE_URL?.split('?')[0]
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!tursoUrl || !tursoUrl.startsWith('libsql://')) {
    console.error('DATABASE_URL no es una URL de Turso.')
    process.exit(1)
  }

  await applyTo(tursoUrl, authToken, 'Turso (producción)')
  await applyTo('file:./dev.db', undefined, 'dev.db (local)')

  console.log('\nListo.')
}

main()
