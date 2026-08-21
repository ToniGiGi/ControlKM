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
export function getPrisma() {
  const libsql = createClient({
    url: process.env.DATABASE_URL || 'file:./dev.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  const adapter = new PrismaLibSQL(libsql)
  return new PrismaClient({ adapter })
}
