import { createClient } from '@libsql/client/http'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  let url = process.env.DATABASE_URL?.split('?')[0]
  if (url?.startsWith('libsql://')) {
    url = url.replace('libsql://', 'https://')
  }
  const authToken = process.env.TURSO_AUTH_TOKEN
  if (!url) return;
  const client = createClient({ url, authToken })

  try {
    await client.execute('ALTER TABLE Vehicle ADD COLUMN rendimiento REAL DEFAULT 10.0;')
    console.log('✅ Alter successful')
  } catch(e) {
    console.error(e)
  }
}
main()
