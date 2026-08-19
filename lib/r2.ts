// Cliente R2 sin dependencias externas: PUT firmado a mano con AWS Signature V4
// usando Web Crypto (100% compatible con el Edge Runtime de Cloudflare, a
// diferencia del SDK de AWS que puede fallar al inicializarse en ese entorno).

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''

export const R2_BUCKET = process.env.R2_BUCKET_NAME || ''
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return toHex(hash)
}

async function hmac(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function uploadToR2(key: string, body: Uint8Array, contentType: string): Promise<string> {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error('Faltan variables de entorno de R2 (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)')
  }

  const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  const payloadHash = await sha256Hex(body)
  const canonicalUri = `/${R2_BUCKET}/${key.split('/').map(encodeURIComponent).join('/')}`
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'
  const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`
  const canonicalRequestHash = await sha256Hex(canonicalRequest)
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

  const kDate = await hmac(new TextEncoder().encode(`AWS4${R2_SECRET_ACCESS_KEY}`).buffer as ArrayBuffer, dateStamp)
  const kRegion = await hmac(kDate, 'auto')
  const kService = await hmac(kRegion, 's3')
  const kSigning = await hmac(kService, 'aws4_request')
  const signature = toHex(await hmac(kSigning, stringToSign))

  const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(`https://${host}${canonicalUri}`, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      Authorization: authorization,
    },
    body: body as BodyInit,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Fallo al subir a R2: ${res.status} ${text}`)
  }

  return `${R2_PUBLIC_URL}/${key}`
}
