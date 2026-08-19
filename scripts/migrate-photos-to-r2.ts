import 'dotenv/config'

import { createClient } from '@libsql/client'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '../lib/r2'

async function migrateTable(client: ReturnType<typeof createClient>, table: 'Vehicle' | 'Employee', folder: string) {
  const { rows } = await client.execute(`SELECT id, fotoUrl FROM "${table}" WHERE fotoUrl LIKE 'data:%'`)
  console.log(`${table}: ${rows.length} fotos en base64 encontradas`)

  for (const row of rows) {
    const id = row.id as string
    const dataUrl = row.fotoUrl as string
    const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!match) {
      console.warn(`  ${id}: formato de dataURL no reconocido, se omite`)
      continue
    }
    const [, mimeType, base64Data] = match
    const ext = mimeType.split('/')[1]
    const buffer = Buffer.from(base64Data, 'base64')
    const key = `${folder}/${id}.${ext}`

    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }))

    const publicUrl = `${R2_PUBLIC_URL}/${key}`
    await client.execute({ sql: `UPDATE "${table}" SET fotoUrl = ? WHERE id = ?`, args: [publicUrl, id] })
    console.log(`  ${id}: migrada -> ${publicUrl}`)
  }
}

async function main() {
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
    console.error('Faltan variables de entorno de R2 (R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_PUBLIC_URL, etc). Configúralas antes de correr esta migración.')
    process.exit(1)
  }

  const url = process.env.DATABASE_URL?.split('?')[0]
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!url) {
    console.error('Falta DATABASE_URL')
    process.exit(1)
  }

  console.log('Conectando a la base de datos...')
  const client = createClient({ url, authToken })

  await migrateTable(client, 'Vehicle', 'vehiculos')
  await migrateTable(client, 'Employee', 'empleados')

  console.log('Migración completa.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
