import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Iniciando creación de usuarios para empleados...')
  
  const employees = await prisma.employee.findMany({
    where: {
      email: { not: null },
      userId: null,
    }
  })

  console.log(`Encontrados ${employees.length} empleados con email sin usuario asociado.`)

  for (const emp of employees) {
    if (!emp.email) continue

    try {
      let user = await prisma.user.findUnique({ where: { email: emp.email } })
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: emp.email,
            password: 'password123',
            role: 'CONDUCTOR',
          }
        })
        console.log(`Usuario creado para: ${emp.email}`)
      } else {
        console.log(`El usuario ${emp.email} ya existe, enlazando...`)
      }

      await prisma.employee.update({
        where: { id: emp.id },
        data: { userId: user.id }
      })
      console.log(`Empleado ${emp.nombre} enlazado al usuario ${user.id}`)
      
    } catch (e: any) {
      console.error(`Error procesando a ${emp.email}:`, e.message)
    }
  }

  console.log('Proceso finalizado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
