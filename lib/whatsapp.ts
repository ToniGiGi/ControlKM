import { getPrisma } from './prisma'

// Evolution API (v1). WhatsApp registra los celulares de México como 521 + 10 dígitos.
function toWhatsAppNumber(telefono: string | null | undefined): string | null {
  const digits = (telefono || '').replace(/\D/g, '')
  if (digits.length < 10) return null
  return `521${digits.slice(-10)}`
}

async function sendText(number: string, text: string) {
  const res = await fetch(process.env.WHATSAPP_API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.WHATSAPP_API_KEY!,
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ number, textMessage: { text } }),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${await res.text()}`)
}

// Nunca lanza: si el bot está caído la solicitud ya se guardó y solo se pierde el aviso.
export async function notifyRoleByWhatsApp(role: 'ADMINISTRADOR' | 'CUENTAS_POR_PAGAR', text: string) {
  try {
    if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_KEY) return

    let numbers: string[]
    // Modo prueba: si WHATSAPP_ONLY_TO está definido, todo se manda solo a ese número.
    const testNumber = toWhatsAppNumber(process.env.WHATSAPP_ONLY_TO)
    if (testNumber) {
      numbers = [testNumber]
      text = `[Prueba → ${role}]\n${text}`
    } else {
      const users = await getPrisma().user.findMany({
        where: { role },
        select: { employee: { select: { telefono: true } } },
      })
      numbers = [...new Set(users.map(u => toWhatsAppNumber(u.employee?.telefono)).filter((n): n is string => !!n))]
    }

    const results = await Promise.allSettled(numbers.map(n => sendText(n, text)))
    results.forEach(r => { if (r.status === 'rejected') console.error('Error enviando WhatsApp', r.reason) })
  } catch (e) {
    console.error('Error en notificación de WhatsApp', e)
  }
}
