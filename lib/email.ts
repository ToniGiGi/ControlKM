import { Resend } from 'resend';
import { getPrisma } from './prisma';

// Importante: asegúrate de que RESEND_API_KEY esté configurada en tu archivo .env
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

// Configura el correo remitente, si ya tienes un dominio configurado en Resend úsalo aquí
const FROM_EMAIL = 'Notificaciones FLEETCORE <notificaciones@controlkm.com>'; 

export async function sendEmailToAdmins(
  type: 'combustible' | 'viatico',
  data: { solicitanteNombre: string; monto: number; motivo: string; folio?: string | null; fecha: Date }
) {
  try {
    const prisma = getPrisma();
    const admins = await prisma.user.findMany({
      where: { role: 'administrador' },
      select: { email: true }
    });
    const emails = admins.map((a: { email: string }) => a.email).filter(Boolean);
    if (emails.length === 0) return;

    const tipoText = type === 'combustible' ? 'combustible' : 'viático';
    const subject = type === 'combustible' ? 'Nueva solicitud de combustible' : 'Nueva solicitud de viatico';

    await resend.emails.send({
      from: FROM_EMAIL,
      to: emails,
      subject,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Nueva solicitud de ${tipoText}</h2>
          <p>Un conductor ha generado una nueva solicitud y está esperando tu aprobación.</p>
          <ul style="line-height: 1.5;">
            <li><strong>Solicitante:</strong> ${data.solicitanteNombre}</li>
            <li><strong>Folio:</strong> ${data.folio || 'N/A'}</li>
            <li><strong>Monto:</strong> $${data.monto.toFixed(2)}</li>
            <li><strong>Motivo del viaje:</strong> ${data.motivo || 'N/A'}</li>
            <li><strong>Fecha:</strong> ${new Date(data.fecha).toLocaleDateString()}</li>
          </ul>
          <p>Por favor, revisa el sistema para aprobarla o rechazarla.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending email to admins:', error);
  }
}

export async function sendEmailToAccountsPayable(
  type: 'combustible' | 'viatico',
  data: { solicitanteNombre: string; monto: number; motivo: string; folio?: string | null; fecha: Date }
) {
  try {
    const prisma = getPrisma();
    const accounts = await prisma.user.findMany({
      where: { role: 'cuentas_por_pagar' },
      select: { email: true }
    });
    const emails = accounts.map((a: { email: string }) => a.email).filter(Boolean);
    if (emails.length === 0) return;

    const tipoText = type === 'combustible' ? 'combustible' : 'viático';
    const subject = type === 'combustible' ? 'Nueva solicitud de combustible por pagar' : 'Nueva solicitud de viatico por pagar';

    await resend.emails.send({
      from: FROM_EMAIL,
      to: emails,
      subject,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Solicitud de ${tipoText} Aprobada</h2>
          <p>La siguiente solicitud ha sido aprobada por un administrador y está lista para el proceso de pago:</p>
          <ul style="line-height: 1.5;">
            <li><strong>Solicitante:</strong> ${data.solicitanteNombre}</li>
            <li><strong>Folio:</strong> ${data.folio || 'N/A'}</li>
            <li><strong>Monto:</strong> $${data.monto.toFixed(2)}</li>
            <li><strong>Motivo del viaje:</strong> ${data.motivo || 'N/A'}</li>
            <li><strong>Fecha:</strong> ${new Date(data.fecha).toLocaleDateString()}</li>
          </ul>
          <p>Por favor, procede con el pago y recaba la firma en el sistema.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending email to accounts payable:', error);
  }
}

export async function sendEmailToDriver(
  type: 'combustible' | 'viatico',
  data: { solicitanteNombre: string; monto: number; motivo: string; folio?: string | null; fecha: Date },
  vehiculoId?: string | null,
  empleadoId?: string | null
) {
  try {
    const prisma = getPrisma();
    
    let email = null;
    
    // Buscar el correo del conductor basándonos en el empleado o vehículo
    if (empleadoId) {
      const emp = await prisma.employee.findUnique({ where: { id: empleadoId }, include: { user: true } });
      email = emp?.user?.email || emp?.email;
    } else if (vehiculoId) {
      const veh = await prisma.vehicle.findUnique({ where: { id: vehiculoId }, include: { empleado: { include: { user: true } } } });
      email = veh?.empleado?.user?.email || veh?.empleado?.email;
    }

    if (!email) {
      console.warn('No se encontró un correo para notificar al conductor.');
      return;
    }

    const tipoText = type === 'combustible' ? 'combustible' : 'viático';
    const subject = type === 'combustible' ? 'Solicitud de combustible pagada' : 'Solicitud de viaticos pagados';

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Tu solicitud de ${tipoText} ha sido pagada</h2>
          <p>Buenas noticias, tu solicitud ha completado el proceso de pago.</p>
          <ul style="line-height: 1.5;">
            <li><strong>Folio:</strong> ${data.folio || 'N/A'}</li>
            <li><strong>Monto:</strong> $${data.monto.toFixed(2)}</li>
            <li><strong>Motivo del viaje:</strong> ${data.motivo || 'N/A'}</li>
            <li><strong>Fecha original:</strong> ${new Date(data.fecha).toLocaleDateString()}</li>
          </ul>
          <p>Gracias por registrar tu solicitud.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending email to driver:', error);
  }
}
