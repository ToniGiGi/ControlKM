import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client/http'
import { PrismaLibSQL } from '@prisma/adapter-libsql'


const libsql = createClient({
  url: process.env.DATABASE_URL || 'file:./dev.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})
const adapter = new PrismaLibSQL(libsql)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

globalForPrisma.prisma = prisma
