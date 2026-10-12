import { getPrisma } from './prisma'

type Role = 'ADMINISTRADOR' | 'CUENTAS_POR_PAGAR'

export type WhatsAppResult = {
  nombre: string
  role: string
  telefono: string | null
  ok: boolean
  detalle: string
}

function last10Digits(telefono: string | null | undefined): string | null {
  const digits = (telefono || '').replace(/\D/g, '')
  return digits.length >= 10 ? digits.slice(-10) : null
}

async function post(number: string, text: string) {
  // Evolution API (v1)
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
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
}

// En México WhatsApp registra unas cuentas como 521 + 10 dígitos y otras como 52 + 10
// dígitos; el formato equivocado falla con "No LID for user", así que se prueban ambos.
async function sendText(tenDigits: string, text: string): Promise<string> {
  try {
    await post(`521${tenDigits}`, text)
    return `521${tenDigits}`
  } catch (first) {
    if (first instanceof Error && first.name === 'TimeoutError') throw first
    await post(`52${tenDigits}`, text)
    return `52${tenDigits}`
  }
}

async function getRecipients(roles: Role[]) {
  // Modo prueba: si WHATSAPP_ONLY_TO está definido, todo se manda solo a ese número.
  const onlyTo = process.env.WHATSAPP_ONLY_TO
  if (onlyTo) return [{ nombre: 'Número de prueba (WHATSAPP_ONLY_TO)', role: roles.join(', '), telefono: onlyTo }]

  const users = await getPrisma().user.findMany({
    where: { role: { in: roles } },
    select: { email: true, role: true, employee: { select: { nombre: true, telefono: true } } },
  })
  return users.map(u => ({
    nombre: u.employee?.nombre || u.email,
    role: u.role,
    telefono: u.employee?.telefono || null,
  }))
}

type Recipient = { nombre: string; role: string; telefono: string | null }

async function sendToRecipients(roles: Role[], text: string): Promise<WhatsAppResult[]> {
  return sendTo(await getRecipients(roles), text)
}

async function sendTo(recipients: Recipient[], text: string): Promise<WhatsAppResult[]> {
  const sent = new Set<string>()
  return Promise.all(recipients.map(async (r): Promise<WhatsAppResult> => {
    const digits = last10Digits(r.telefono)
    if (!digits) return { ...r, ok: false, detalle: 'Sin teléfono válido en Empleados' }
    if (sent.has(digits)) return { ...r, ok: true, detalle: 'Mismo número que otro destinatario' }
    sent.add(digits)
    try {
      return { ...r, ok: true, detalle: `Enviado a ${await sendText(digits, text)}` }
    } catch (e) {
      return { ...r, ok: false, detalle: e instanceof Error ? e.message : String(e) }
    }
  }))
}

// Nunca lanza: si el bot está caído la solicitud ya se guardó y solo se pierde el aviso.
export async function notifyRoleByWhatsApp(role: Role, text: string) {
  try {
    if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_KEY) {
      console.error('WhatsApp no configurado: faltan WHATSAPP_API_URL o WHATSAPP_API_KEY')
      return
    }
    const results = await sendToRecipients([role], text)
    results.filter(r => !r.ok).forEach(r => console.error('WhatsApp no enviado a', r.nombre, '-', r.detalle))
  } catch (e) {
    console.error('Error en notificación de WhatsApp', e)
  }
}

// Aviso al empleado dueño de la solicitud. Nunca lanza, igual que notifyRoleByWhatsApp.
export async function notifyEmployeeByWhatsApp(empleadoId: string | null | undefined, text: string) {
  try {
    if (!empleadoId || !process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_KEY) return
    const onlyTo = process.env.WHATSAPP_ONLY_TO
    let recipient: Recipient
    if (onlyTo) {
      recipient = { nombre: 'Número de prueba', role: 'EMPLEADO', telefono: onlyTo }
    } else {
      const emp = await getPrisma().employee.findUnique({ where: { id: empleadoId }, select: { nombre: true, telefono: true } })
      if (!emp) return
      recipient = { nombre: emp.nombre, role: 'EMPLEADO', telefono: emp.telefono }
    }
    const [result] = await sendTo([recipient], text)
    if (!result.ok) console.error('WhatsApp no enviado a', result.nombre, '-', result.detalle)
  } catch (e) {
    console.error('Error en notificación de WhatsApp al empleado', e)
  }
}

// Diagnóstico: manda un mensaje de prueba a todos los destinatarios y devuelve el resultado por persona.
export async function diagnoseWhatsApp(): Promise<{ configurado: boolean; faltan: string[]; modoPrueba: boolean; resultados: WhatsAppResult[] }> {
  const faltan = ['WHATSAPP_API_URL', 'WHATSAPP_API_KEY'].filter(k => !process.env[k])
  if (faltan.length > 0) return { configurado: false, faltan, modoPrueba: false, resultados: [] }
  const resultados = await sendToRecipients(
    ['ADMINISTRADOR', 'CUENTAS_POR_PAGAR'],
    'Prueba de ControlKM: por este medio recibirás los avisos de solicitudes de combustible y viáticos.'
  )
  return { configurado: true, faltan: [], modoPrueba: !!process.env.WHATSAPP_ONLY_TO, resultados }
}
