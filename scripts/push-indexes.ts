import { createClient } from '@libsql/client'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const url = process.env.DATABASE_URL?.split('?')[0]
  const authToken = process.env.TURSO_AUTH_TOKEN
  
  if (!url || !url.startsWith('libsql://')) {
    console.error('DATABASE_URL is not a Turso URL.')
    process.exit(1)
  }

  console.log('Connecting to Turso...')
  const client = createClient({ url, authToken })

  const indexes = [
    // Employee indexes
    'CREATE INDEX IF NOT EXISTS "Employee_estado_idx" ON "Employee"("estado")',
    'CREATE INDEX IF NOT EXISTS "Employee_userId_idx" ON "Employee"("userId")',
    // Vehicle indexes
    'CREATE INDEX IF NOT EXISTS "Vehicle_empleadoId_idx" ON "Vehicle"("empleadoId")',
    'CREATE INDEX IF NOT EXISTS "Vehicle_estado_idx" ON "Vehicle"("estado")',
    // Insurance indexes
    'CREATE INDEX IF NOT EXISTS "Insurance_vehiculoId_idx" ON "Insurance"("vehiculoId")',
    'CREATE INDEX IF NOT EXISTS "Insurance_estado_idx" ON "Insurance"("estado")',
    'CREATE INDEX IF NOT EXISTS "Insurance_vencimiento_idx" ON "Insurance"("vencimiento")',
    // Maintenance indexes
    'CREATE INDEX IF NOT EXISTS "Maintenance_vehiculoId_idx" ON "Maintenance"("vehiculoId")',
    'CREATE INDEX IF NOT EXISTS "Maintenance_estado_idx" ON "Maintenance"("estado")',
    'CREATE INDEX IF NOT EXISTS "Maintenance_fecha_idx" ON "Maintenance"("fecha")',
    // Incident indexes
    'CREATE INDEX IF NOT EXISTS "Incident_vehiculoId_idx" ON "Incident"("vehiculoId")',
    'CREATE INDEX IF NOT EXISTS "Incident_estado_idx" ON "Incident"("estado")',
    'CREATE INDEX IF NOT EXISTS "Incident_fecha_idx" ON "Incident"("fecha")',
    // Trip indexes
    'CREATE INDEX IF NOT EXISTS "Trip_vehiculoId_idx" ON "Trip"("vehiculoId")',
    'CREATE INDEX IF NOT EXISTS "Trip_fecha_idx" ON "Trip"("fecha")',
    // FuelLog indexes
    'CREATE INDEX IF NOT EXISTS "FuelLog_vehiculoId_idx" ON "FuelLog"("vehiculoId")',
    'CREATE INDEX IF NOT EXISTS "FuelLog_fecha_idx" ON "FuelLog"("fecha")',
    // Expense indexes
    'CREATE INDEX IF NOT EXISTS "Expense_vehiculoId_idx" ON "Expense"("vehiculoId")',
    'CREATE INDEX IF NOT EXISTS "Expense_estado_idx" ON "Expense"("estado")',
    'CREATE INDEX IF NOT EXISTS "Expense_categoria_idx" ON "Expense"("categoria")',
    'CREATE INDEX IF NOT EXISTS "Expense_fecha_idx" ON "Expense"("fecha")',
    // FuelRequest indexes
    'CREATE INDEX IF NOT EXISTS "FuelRequest_vehiculoId_idx" ON "FuelRequest"("vehiculoId")',
    'CREATE INDEX IF NOT EXISTS "FuelRequest_estado_idx" ON "FuelRequest"("estado")',
  ]

  console.log(`Pushing ${indexes.length} indexes to Turso...`)
  
  for (const sql of indexes) {
    try {
      await client.execute(sql)
      console.log(`✅ ${sql.split('"')[1]}`)
    } catch (e: any) {
      console.error(`❌ Failed: ${e.message}`)
    }
  }
  
  console.log('\n✅ All indexes pushed successfully!')
}

main()
