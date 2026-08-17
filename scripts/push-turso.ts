import { createClient } from '@libsql/client'
import fs from 'fs'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const url = process.env.DATABASE_URL?.split('?')[0] // remove query params if any
  const authToken = process.env.TURSO_AUTH_TOKEN
  
  if (!url || !url.startsWith('libsql://')) {
    console.error('DATABASE_URL is not a Turso URL.')
    process.exit(1)
  }

  console.log('Connecting to Turso...')
  const client = createClient({ url, authToken })

  const sql = fs.readFileSync('schema.sql', 'utf8')
  
  console.log('Pushing schema to Turso...')
  try {
    await client.executeMultiple(sql)
    console.log('✅ Schema pushed successfully!')
  } catch (e) {
    console.error('❌ Failed to push schema:', e)
  }
}

main()
