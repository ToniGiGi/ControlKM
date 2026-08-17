import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const v = await prisma.vehicle.findMany({ 
    where: { empleadoId: { not: null } },
    take: 3 
  });
  if(v[0]) {
    await prisma.vehicle.update({ where: { id: v[0].id }, data: { telemetryStatus: 'en_movimiento' }});
    console.log('Updated', v[0].placas, 'to en_movimiento');
  }
  if(v[1]) {
    await prisma.vehicle.update({ where: { id: v[1].id }, data: { telemetryStatus: 'detenido' }});
    console.log('Updated', v[1].placas, 'to detenido');
  }
  if(v[2]) {
    await prisma.vehicle.update({ where: { id: v[2].id }, data: { telemetryStatus: 'apagado' }});
    console.log('Updated', v[2].placas, 'to apagado');
  }
}
main().finally(() => prisma.$disconnect());
