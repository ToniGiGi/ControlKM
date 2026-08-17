import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const libsql = createClient({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})
const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.user.upsert({
    where: { email: 'tonygarcia692@gmail.com' },
    update: {},
    create: {
      email: 'tonygarcia692@gmail.com',
      password: 'password123',
      role: 'SUPER_ADMIN'
    }
  })
  console.log("Admin user seeded: tonygarcia692@gmail.com / password123")
}

main().catch(console.error).finally(() => prisma.$disconnect())
