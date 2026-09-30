import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client/http'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

// No se cachea como singleton a propósito: @prisma/adapter-libsql mantiene un
// Mutex interno por instancia que serializa toda consulta que pase por ese
// cliente. Cloudflare Workers reutiliza el mismo isolate para peticiones
// concurrentes de usuarios distintos, así que un cliente compartido hace que
// una petición quede esperando el release() del candado de otra petición
// completamente distinta — eso es justo lo que Cloudflare reporta como
// "a promise was resolved... from a different request context" y termina
// colgando/cancelando el worker. Cada función de datos crea su propio
// cliente (barato: no abre conexión hasta la primera consulta) para que
// nunca se comparta estado entre peticiones.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export function getPrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  let dbUrl = process.env.DATABASE_URL || 'file:./dev.db'
  if (dbUrl.startsWith('libsql://')) {
    dbUrl = dbUrl.replace('libsql://', 'https://')
  }

  const libsql = createClient({
    url: dbUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
    fetch: (url, init) => {
      return fetch(url, {
        ...init,
        signal: AbortSignal.timeout(30000)
      })
    }
  })
  const adapter = new PrismaLibSQL(libsql)
  const client = new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}
