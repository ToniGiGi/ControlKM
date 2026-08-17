import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

console.log('INITIALIZING LIBSQL WITH URL:', process.env.DATABASE_URL)
const libsql = createClient({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})
const adapter = new PrismaLibSQL(libsql)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
