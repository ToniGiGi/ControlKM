'use server'

import { getPrisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { hashPassword } from '@/lib/password'

// Genera folios secuenciales (QRQ-C-0001, QRQ-V-0001, ...) usando un contador
// persistente en OrganizationConfig, para que nunca se reutilicen números aunque
// se borren solicitudes.
async function getNextFolio(prisma: ReturnType<typeof getPrisma>, field: 'lastFuelFolio' | 'lastTravelFolio', prefix: string) {
  const config = await prisma.organizationConfig.upsert({
    where: { id: 'default' },
    update: { [field]: { increment: 1 } },
    create: { id: 'default', [field]: 1 },
  })
  const n = (config as any)[field] as number
  return `${prefix}-${String(n).padStart(4, '0')}`
}

export async function getVehicles() {
  const prisma = getPrisma()
  // Optimized: 4 parallel queries instead of 8 JOINs
  const [dbVehicles, allGastos, allMantenimientos, allFuelRequests] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: [
        { orden: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        empleado: { select: { id: true, nombre: true, email: true, telefono: true, puesto: true, fotoUrl: true } },
        seguros: { orderBy: { vencimiento: 'desc' }, take: 1 },
        sucursalRef: { select: { id: true, name: true } },
      }
    }),
    prisma.expense.findMany({
      where: { estado: 'APROBADA' },
      select: { vehiculoId: true, categoria: true, monto: true }
    }),
    prisma.maintenance.findMany({
      where: { estado: 'APROBADA' },
      select: { vehiculoId: true, costo: true, km: true }
    }),
    prisma.fuelRequest.findMany({
      where: { estado: 'APROBADA' },
      select: { vehiculoId: true, costoGasolina: true, costoCasetas: true, costoComidas: true }
    })
  ])

  // Pre-index by vehiculoId for O(1) lookup
  const gastosByVehicle = new Map<string, typeof allGastos>()
  allGastos.forEach(g => {
    const list = gastosByVehicle.get(g.vehiculoId) || []
    list.push(g)
    gastosByVehicle.set(g.vehiculoId, list)
  })

  const mantsByVehicle = new Map<string, typeof allMantenimientos>()
  allMantenimientos.forEach(m => {
    const list = mantsByVehicle.get(m.vehiculoId) || []
    list.push(m)
    mantsByVehicle.set(m.vehiculoId, list)
  })

  const frByVehicle = new Map<string, typeof allFuelRequests>()
  allFuelRequests.forEach(fr => {
    const list = frByVehicle.get(fr.vehiculoId) || []
    list.push(fr)
    frByVehicle.set(fr.vehiculoId, list)
  })

  return dbVehicles.map(v => {
    const vGastos = gastosByVehicle.get(v.id) || []
    const vMants = mantsByVehicle.get(v.id) || []
    const vFR = frByVehicle.get(v.id) || []

    const gasolinaViaticos = vFR.reduce((a, b) => a + (b.costoGasolina || 0), 0)
    const casetasViaticos = vFR.reduce((a, b) => a + (b.costoCasetas || 0), 0)
    const comidasViaticos = vFR.reduce((a, b) => a + (b.costoComidas || 0), 0)

    const gastosMapped = {
      gasolina: vGastos.filter(g => g.categoria === 'GASOLINA').reduce((a, b) => a + b.monto, 0) + gasolinaViaticos,
      mantenimiento: vGastos.filter(g => g.categoria === 'MANTENIMIENTO').reduce((a, b) => a + b.monto, 0) + vMants.reduce((a, b) => a + (b.costo || 0), 0),
      reparacion: vGastos.filter(g => g.categoria === 'REPARACION').reduce((a, b) => a + b.monto, 0),
      aceite: vGastos.filter(g => g.categoria === 'ACEITE').reduce((a, b) => a + b.monto, 0),
      neumaticos: vGastos.filter(g => g.categoria === 'NEUMATICOS').reduce((a, b) => a + b.monto, 0),
      aditamentos: vGastos.filter(g => g.categoria === 'ADITAMENTOS').reduce((a, b) => a + b.monto, 0),
      casetas: vGastos.filter(g => g.categoria === 'CASETAS').reduce((a, b) => a + b.monto, 0) + casetasViaticos,
      multas: vGastos.filter(g => g.categoria === 'MULTAS').reduce((a, b) => a + b.monto, 0),
      otros: vGastos.filter(g => g.categoria === 'OTROS').reduce((a, b) => a + b.monto, 0) + comidasViaticos,
    }

    const telemetria = {
      dispositivo: 'GPS-000',
      estado: v.estado === 'ACTIVO' ? 'en_movimiento' : 'detenido',
      lat: 0,
      lng: 0,
      velocidad: 0,
      ultimoReporte: new Date().toISOString()
    }

    const maxKm = Math.max(
      v.kmActual || 0,
      ...(vMants.map(m => m.km || 0)),
    )

    return {
      ...v,
      kmActual: maxKm,
      estado: v.estado.toLowerCase(),
      seguro: v.seguros && v.seguros[0] ? { ...v.seguros[0], estado: v.seguros[0].estado.toLowerCase() } : { estado: 'vencido' },
      gastos: gastosMapped,
      telemetria,
      // Compatibilidad: sucursal como texto viene de la relación normalizada, con el string viejo como respaldo
      sucursal: v.sucursalRef?.name || v.sucursal,
    }
  })
}

export async function getVehicleDetail(id: string) {
  const prisma = getPrisma()
  const v = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      empleado: { select: { id: true, nombre: true, email: true, telefono: true, puesto: true, fotoUrl: true } },
      seguros: { orderBy: { vencimiento: 'desc' }, take: 1 },
      sucursalRef: { select: { id: true, name: true } },
      mantenimientos: { orderBy: { fecha: 'desc' } },
      incidencias: { orderBy: { fecha: 'desc' } },
      viajes: { orderBy: { fecha: 'desc' } },
      cargas: { orderBy: { fecha: 'desc' } },
      gastos: { where: { estado: 'APROBADA' } },
      fuelRequests: { where: { estado: 'APROBADA' } },
    }
  })
  if (!v) return null

  const gasolinaViaticos = v.fuelRequests.reduce((a, b) => a + (b.costoGasolina || 0), 0)
  const casetasViaticos = v.fuelRequests.reduce((a, b) => a + (b.costoCasetas || 0), 0)
  const comidasViaticos = v.fuelRequests.reduce((a, b) => a + (b.costoComidas || 0), 0)

  const gastosMapped = {
    gasolina: v.gastos.filter(g => g.categoria === 'GASOLINA').reduce((a, b) => a + b.monto, 0) + gasolinaViaticos,
    mantenimiento: v.gastos.filter(g => g.categoria === 'MANTENIMIENTO').reduce((a, b) => a + b.monto, 0) + v.mantenimientos.reduce((a, b) => a + (b.costo || 0), 0),
    reparacion: v.gastos.filter(g => g.categoria === 'REPARACION').reduce((a, b) => a + b.monto, 0),
    aceite: v.gastos.filter(g => g.categoria === 'ACEITE').reduce((a, b) => a + b.monto, 0),
    neumaticos: v.gastos.filter(g => g.categoria === 'NEUMATICOS').reduce((a, b) => a + b.monto, 0),
    aditamentos: v.gastos.filter(g => g.categoria === 'ADITAMENTOS').reduce((a, b) => a + b.monto, 0),
    casetas: v.gastos.filter(g => g.categoria === 'CASETAS').reduce((a, b) => a + b.monto, 0) + casetasViaticos,
    multas: v.gastos.filter(g => g.categoria === 'MULTAS').reduce((a, b) => a + b.monto, 0),
    otros: v.gastos.filter(g => g.categoria === 'OTROS').reduce((a, b) => a + b.monto, 0) + comidasViaticos,
  }

  const telemetria = {
    dispositivo: 'GPS-000',
    estado: v.estado === 'ACTIVO' ? 'en_movimiento' : 'detenido',
    lat: 0,
    lng: 0,
    velocidad: 0,
    ultimoReporte: new Date().toISOString()
  }

  const maxKm = Math.max(v.kmActual || 0, ...(v.mantenimientos.map(m => m.km || 0)))

  return {
    ...v,
    kmActual: maxKm,
    estado: v.estado.toLowerCase(),
    seguro: v.seguros && v.seguros[0] ? { ...v.seguros[0], estado: v.seguros[0].estado.toLowerCase() } : { estado: 'vencido' },
    gastos: gastosMapped,
    telemetria,
    sucursal: v.sucursalRef?.name || v.sucursal,
  }
}

export async function getEmployees() {
  const prisma = getPrisma()
  const dbEmployees = await prisma.employee.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      vehiculosAsignados: true,
      sucursalRef: { select: { id: true, name: true } },
      departamentoRef: { select: { id: true, name: true } },
    }
  })

  return dbEmployees.map(e => ({
    ...e,
    estado: e.estado.toLowerCase(),
    // Compatibilidad: texto viene de la relación normalizada, con el string viejo como respaldo
    sucursal: e.sucursalRef?.name || e.sucursal,
    area: e.departamentoRef?.name || e.area,
  }))
}

function cleanVehicleData(data: any) {
  const allowedFields = [
    'nombreInterno', 'marca', 'modelo', 'anio', 'tipoUnidad', 'placas',
    'vin', 'numeroEconomico', 'color', 'combustible', 'capacidadTanque',
    'kmInicial', 'kmActual', 'estado', 'fechaAsignacion', 'sucursalId',
    'proximoMantenimientoFecha', 'proximoMantenimientoKm', 'empleadoId', 'fotoUrl'
  ];
  
  const clean: any = {};
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  }

  if (clean.estado) clean.estado = clean.estado.toUpperCase();
  if (clean.anio !== undefined && clean.anio !== null) clean.anio = Number(clean.anio);
  if (clean.capacidadTanque !== undefined && clean.capacidadTanque !== null) clean.capacidadTanque = Number(clean.capacidadTanque);
  if (clean.kmInicial !== undefined && clean.kmInicial !== null) clean.kmInicial = Number(clean.kmInicial);
  if (clean.kmActual !== undefined && clean.kmActual !== null) clean.kmActual = Number(clean.kmActual);
  
  if (clean.proximoMantenimientoKm !== undefined && clean.proximoMantenimientoKm !== null && clean.proximoMantenimientoKm !== '') {
    clean.proximoMantenimientoKm = Number(clean.proximoMantenimientoKm);
  } else {
    clean.proximoMantenimientoKm = null;
  }
  
  if (clean.fechaAsignacion) {
    clean.fechaAsignacion = new Date(clean.fechaAsignacion);
  } else {
    clean.fechaAsignacion = null;
  }

  if (clean.proximoMantenimientoFecha) {
    clean.proximoMantenimientoFecha = new Date(clean.proximoMantenimientoFecha);
  } else {
    clean.proximoMantenimientoFecha = null;
  }

  if (!clean.empleadoId || clean.empleadoId === 'unassigned' || clean.empleadoId === '') {
    clean.empleadoId = null;
  }

  if (clean.vin === '') clean.vin = null;
  if (clean.numeroEconomico === '') clean.numeroEconomico = null;
  if (clean.color === '') clean.color = null;
  if (clean.combustible === '') clean.combustible = null;
  if (!clean.sucursalId || clean.sucursalId === 'unassigned') clean.sucursalId = null;

  return clean;
}

function cleanEmployeeData(data: any) {
  const { id, vehiculosAsignados, vehiculo, createdAt, updatedAt, password, user, sucursal, area, sucursalRef, departamentoRef, ...rest } = data;
  if (rest.estado) rest.estado = rest.estado.toUpperCase();
  if (rest.vencimientoLicencia) {
    rest.vencimientoLicencia = new Date(rest.vencimientoLicencia);
  } else {
    rest.vencimientoLicencia = null;
  }
  if (!rest.sucursalId || rest.sucursalId === 'unassigned') rest.sucursalId = null;
  if (!rest.departamentoId || rest.departamentoId === 'unassigned') rest.departamentoId = null;
  return rest;
}

export async function createVehicle(data: any) {
  const prisma = getPrisma()
  const v = await prisma.vehicle.create({ data: cleanVehicleData(data) })
  revalidatePath('/vehiculos')
  revalidatePath('/')
  return v
}

export async function deleteVehicle(id: string) {
  const prisma = getPrisma()
  const v = await prisma.vehicle.delete({ where: { id } })
  revalidatePath('/vehiculos')
  revalidatePath('/')
  return v
}

export async function updateVehicleOrder(updates: { id: string, orden: number }[]) {
  const prisma = getPrisma()
  // Sin $transaction: el adaptador de libsql sobre HTTP no soporta bien las
  // transacciones en lote de Prisma en el runtime edge (tronaba con 500).
  // No es crítico que sea atómico: es solo el orden visual de las tarjetas.
  await Promise.all(
    updates.map((update) =>
      prisma.vehicle.update({
        where: { id: update.id },
        data: { orden: update.orden }
      })
    )
  )
  revalidatePath('/vehiculos')
  revalidatePath('/')
  return true
}


export async function updateVehicle(id: string, data: any) {
  const prisma = getPrisma()
  const v = await prisma.vehicle.update({ where: { id }, data: cleanVehicleData(data) })
  revalidatePath('/vehiculos')
  revalidatePath('/')
  return v
}

export async function createEmployee(data: any) {
  const prisma = getPrisma()
  const { password, ...rest } = data;

  if (rest.email && password) {
    const existing = await prisma.user.findUnique({ where: { email: rest.email } })
    if (existing) {
      throw new Error('Ya existe un empleado registrado con ese correo electrónico.')
    }
  }

  const e = await prisma.employee.create({ data: cleanEmployeeData(rest) })

  if (rest.email && password) {
    const user = await prisma.user.create({
      data: {
        email: rest.email,
        password: await hashPassword(password),
        role: 'CONDUCTOR',
        employee: { connect: { id: e.id } }
      }
    });
    await prisma.employee.update({ where: { id: e.id }, data: { userId: user.id } })
  }
  
  revalidatePath('/empleados')
  return e
}

export async function updateEmployee(id: string, data: any) {
  const prisma = getPrisma()
  const { password, ...rest } = data;
  
  if (password && data.userId) {
     await prisma.user.update({
       where: { id: data.userId },
       data: { password: await hashPassword(password) }
     })
  } else if (password && rest.email && !data.userId) {
    // Create the user if it didn't exist
    const user = await prisma.user.create({
      data: {
        email: rest.email,
        password: await hashPassword(password),
        role: 'CONDUCTOR',
      }
    });
    rest.userId = user.id;
  }
  
  const e = await prisma.employee.update({ where: { id }, data: cleanEmployeeData(rest) })
  revalidatePath('/empleados')
  return e
}

// --- Insurances ---

function cleanInsuranceData(data: any) {
  const { id, vehiculo, createdAt, updatedAt, ...rest } = data;
  
  if (rest.inicio) rest.inicio = new Date(rest.inicio);
  if (rest.vencimiento) rest.vencimiento = new Date(rest.vencimiento);
  if (rest.costo) rest.costo = parseFloat(rest.costo);
  
  return rest;
}

export async function getInsurances() {
  const prisma = getPrisma()
  return await prisma.insurance.findMany({
    orderBy: { vencimiento: 'asc' },
    take: 1000,
    include: {
      vehiculo: { select: { id: true, nombreInterno: true, placas: true, empleadoId: true } }
    }
  })
}

export async function createInsurance(data: any) {
  const prisma = getPrisma()
  const ins = await prisma.insurance.create({ data: cleanInsuranceData(data) })
  revalidatePath('/seguros')
  revalidatePath('/vehiculos')
  return ins
}

export async function updateInsurance(id: string, data: any) {
  const prisma = getPrisma()
  const ins = await prisma.insurance.update({ where: { id }, data: cleanInsuranceData(data) })
  revalidatePath('/seguros')
  revalidatePath('/vehiculos')
  return ins
}

export async function deleteInsurance(id: string) {
  const prisma = getPrisma()
  const ins = await prisma.insurance.delete({ where: { id } })
  revalidatePath('/seguros')
  revalidatePath('/vehiculos')
  return ins
}

// --- Maintenances ---

function cleanMaintenanceData(data: any) {
  const { id, vehiculo, createdAt, updatedAt, ...rest } = data;
  
  if (rest.fecha) rest.fecha = new Date(rest.fecha);
  if (rest.km) rest.km = Number(rest.km);
  if (rest.costo) rest.costo = parseFloat(rest.costo);
  if (rest.tipo) rest.tipo = rest.tipo.toUpperCase();
  if (!rest.registradoPor) rest.registradoPor = 'Administrador';
  
  return rest;
}

export async function getMaintenances() {
  const prisma = getPrisma()
  return await prisma.maintenance.findMany({
    orderBy: { fecha: 'desc' },
    take: 1000,
    include: {
      vehiculo: {
        select: { id: true, nombreInterno: true, placas: true, fotoUrl: true, empleadoId: true }
      }
    }
  })
}

export async function createMaintenance(data: any) {
  const prisma = getPrisma()
  const main = await prisma.maintenance.create({ data: cleanMaintenanceData(data) })
  revalidatePath('/mantenimientos')
  revalidatePath('/vehiculos')
  return main
}

export async function updateMaintenance(id: string, data: any) {
  const prisma = getPrisma()
  const main = await prisma.maintenance.update({ where: { id }, data: cleanMaintenanceData(data) })
  revalidatePath('/mantenimientos')
  revalidatePath('/vehiculos')
  return main
}

export async function deleteMaintenance(id: string) {
  const prisma = getPrisma()
  const main = await prisma.maintenance.delete({ where: { id } })
  revalidatePath('/mantenimientos')
  revalidatePath('/vehiculos')
  return main
}

export async function approveMaintenance(id: string) {
  const prisma = getPrisma()
  const main = await prisma.maintenance.update({
    where: { id },
    data: { estado: 'APROBADA' }
  })
  revalidatePath('/mantenimientos')
  revalidatePath('/vehiculos')
  return main
}

export async function getFuelRequests() {
  const prisma = getPrisma()
  const requests = await prisma.fuelRequest.findMany({
    orderBy: { fechaSolicitud: 'desc' },
    take: 1000,
    include: {
      vehiculo: {
        select: { id: true, nombreInterno: true, placas: true, fotoUrl: true, empleadoId: true }
      },
      departamentoRef: { select: { id: true, name: true } },
    }
  })

  return requests.map(r => ({
    ...r,
    // Compatibilidad: texto viene de la relación normalizada, con el string viejo como respaldo
    departamento: r.departamentoRef?.name || r.departamento,
  }))
}

function cleanFuelRequestData(data: any) {
  const { id, vehiculo, createdAt, updatedAt, departamentoRef, ...rest } = data;

  const numericFields = [
    'kmAproximado', 'kmHolgura', 'rendimiento', 'precioGasolina',
    'litrosSolicitados', 'costoGasolina', 'numCasetas', 'costoCasetas',
    'costoComidas', 'costoTotal'
  ];
  for (const field of numericFields) {
    if (rest[field] !== undefined && rest[field] !== null && rest[field] !== '') {
      rest[field] = Number(rest[field]);
    }
  }

  if (rest.estado) rest.estado = rest.estado.toUpperCase();
  if (!rest.departamentoId || rest.departamentoId === 'unassigned') rest.departamentoId = null;

  return rest;
}

export async function createFuelRequest(data: any) {
  const prisma = getPrisma()
  const { vehiculoId, ...rest } = data
  if (!rest.departamentoId || rest.departamentoId === 'unassigned') rest.departamentoId = null
  const folio = await getNextFolio(prisma, 'lastFuelFolio', 'QRQ-C')
  // vehiculoId se pasa como campo escalar (no vehiculo: { connect }) porque Prisma no
  // permite mezclar el estilo "checked" (relación anidada) con el estilo "unchecked"
  // (departamentoId como escalar) en la misma llamada a create().
  const req = await prisma.fuelRequest.create({
    data: {
      ...rest,
      vehiculoId,
      folio,
    },
    include: { vehiculo: true }
  })
  revalidatePath('/combustible')
  return req
}

export async function updateFuelRequest(id: string, data: any) {
  const prisma = getPrisma()
  const req = await prisma.fuelRequest.update({ where: { id }, data: cleanFuelRequestData(data) })
  revalidatePath('/combustible')
  return req
}

export async function deleteFuelRequest(id: string) {
  const prisma = getPrisma()
  const req = await prisma.fuelRequest.delete({ where: { id } })
  revalidatePath('/combustible')
  return req
}

export async function approveFuelRequest(id: string, firmaAprobadorUrl?: string) {
  const prisma = getPrisma()
  const req = await prisma.fuelRequest.update({
    where: { id },
    data: { estado: 'APROBADA', ...(firmaAprobadorUrl ? { firmaAprobadorUrl } : {}) }
  })
  revalidatePath('/combustible')
  revalidatePath('/vehiculos')
  return req
}

export async function rejectFuelRequest(id: string, observacionesRechazo?: string) {
  const prisma = getPrisma()
  const req = await prisma.fuelRequest.update({
    where: { id },
    data: { estado: 'RECHAZADA', observacionesRechazo: observacionesRechazo || null }
  })
  revalidatePath('/combustible')
  revalidatePath('/vehiculos')
  return req
}

// Último paso del flujo: Cuentas por Pagar firma al entregar el dinero.
export async function payFuelRequest(id: string, firmaPagoUrl: string) {
  const prisma = getPrisma()
  const req = await prisma.fuelRequest.update({
    where: { id },
    data: { estado: 'PAGADA', firmaPagoUrl, fechaPago: new Date() }
  })
  revalidatePath('/combustible')
  revalidatePath('/vehiculos')
  return req
}

// --- Travel Requests (Viáticos) ---

export async function getTravelRequests() {
  const prisma = getPrisma()
  const requests = await prisma.travelRequest.findMany({
    orderBy: { fecha: 'desc' },
    take: 1000,
  })
  return requests
}

export async function createTravelRequest(data: any) {
  const prisma = getPrisma()
  const folio = await getNextFolio(prisma, 'lastTravelFolio', 'QRQ-V')
  const req = await prisma.travelRequest.create({ data: { ...data, folio } })
  revalidatePath('/viaticos')
  return req
}

export async function deleteTravelRequest(id: string) {
  const prisma = getPrisma()
  const req = await prisma.travelRequest.delete({ where: { id } })
  revalidatePath('/viaticos')
  return req
}

export async function approveTravelRequest(id: string, firmaAprobadorUrl?: string) {
  const prisma = getPrisma()
  const req = await prisma.travelRequest.update({
    where: { id },
    data: { estado: 'APROBADA', ...(firmaAprobadorUrl ? { firmaAprobadorUrl } : {}) }
  })
  revalidatePath('/viaticos')
  return req
}

export async function rejectTravelRequest(id: string, observacionesRechazo?: string) {
  const prisma = getPrisma()
  const req = await prisma.travelRequest.update({
    where: { id },
    data: { estado: 'RECHAZADA', observacionesRechazo: observacionesRechazo || null }
  })
  revalidatePath('/viaticos')
  return req
}

// Último paso del flujo: Cuentas por Pagar firma al entregar el dinero.
export async function payTravelRequest(id: string, firmaPagoUrl: string) {
  const prisma = getPrisma()
  const req = await prisma.travelRequest.update({
    where: { id },
    data: { estado: 'PAGADA', firmaPagoUrl, fechaPago: new Date() }
  })
  revalidatePath('/viaticos')
  return req
}

// --- Expenses (Gastos) ---

function cleanExpenseData(data: any) {
  const { id, vehiculo, createdAt, updatedAt, ...rest } = data;
  
  if (rest.fecha) rest.fecha = new Date(rest.fecha);
  if (rest.monto) rest.monto = parseFloat(rest.monto);
  if (rest.categoria) rest.categoria = rest.categoria.toUpperCase();
  
  return rest;
}

export async function getExpenses() {
  const prisma = getPrisma()
  return await prisma.expense.findMany({
    orderBy: { fecha: 'desc' },
    take: 1000,
    include: {
      vehiculo: {
        select: { id: true, nombreInterno: true, placas: true, fotoUrl: true, empleadoId: true }
      }
    }
  })
}

export async function createExpense(data: any) {
  const prisma = getPrisma()
  const exp = await prisma.expense.create({ data: cleanExpenseData(data) })
  revalidatePath('/gastos')
  revalidatePath('/vehiculos')
  return exp
}

export async function updateExpense(id: string, data: any) {
  const prisma = getPrisma()
  const exp = await prisma.expense.update({ where: { id }, data: cleanExpenseData(data) })
  revalidatePath('/gastos')
  revalidatePath('/vehiculos')
  return exp
}

export async function deleteExpense(id: string) {
  const prisma = getPrisma()
  const exp = await prisma.expense.delete({ where: { id } })
  revalidatePath('/gastos')
  revalidatePath('/vehiculos')
  return exp
}

export async function approveExpense(id: string) {
  const prisma = getPrisma()
  const exp = await prisma.expense.update({
    where: { id },
    data: { estado: 'APROBADA' }
  })
  revalidatePath('/gastos')
  revalidatePath('/vehiculos')
  return exp
}

export async function rejectExpense(id: string) {
  const prisma = getPrisma()
  const exp = await prisma.expense.update({
    where: { id },
    data: { estado: 'RECHAZADA' }
  })
  revalidatePath('/gastos')
  revalidatePath('/vehiculos')
  return exp
}

// --- Incidents (Incidencias) ---

function cleanIncidentData(data: any) {
  const { id, vehiculo, createdAt, updatedAt, ...rest } = data;
  
  if (rest.fecha) rest.fecha = new Date(rest.fecha);
  if (rest.costo) rest.costo = parseFloat(rest.costo);
  
  // Enums ya vienen en mayÃºsculas desde el front, aseguramos por si acaso
  if (rest.gravedad) rest.gravedad = rest.gravedad.toUpperCase();
  if (rest.estado) rest.estado = rest.estado.toUpperCase();
  
  return rest;
}

export async function getIncidents() {
  const prisma = getPrisma()
  return await prisma.incident.findMany({
    orderBy: { fecha: 'desc' },
    take: 1000,
    include: {
      vehiculo: {
        select: { id: true, nombreInterno: true, placas: true, fotoUrl: true }
      }
    }
  })
}

export async function createIncident(data: any) {
  const prisma = getPrisma()
  const inc = await prisma.incident.create({ data: cleanIncidentData(data) })
  revalidatePath('/incidencias')
  revalidatePath('/vehiculos')
  return inc
}

export async function updateIncident(id: string, data: any) {
  const prisma = getPrisma()
  const inc = await prisma.incident.update({ where: { id }, data: cleanIncidentData(data) })
  revalidatePath('/incidencias')
  revalidatePath('/vehiculos')
  return inc
}

export async function deleteIncident(id: string) {
  const prisma = getPrisma()
  const inc = await prisma.incident.delete({ where: { id } })
  revalidatePath('/incidencias')
  revalidatePath('/vehiculos')
  return inc
}

export async function getAlerts(empleadoId?: string, role?: string) {
  const prisma = getPrisma()
  const generatedAlerts: any[] = [];
  const filter = empleadoId ? { vehiculo: { empleadoId } } : {};

  const isConductor = role === 'conductor'
  const isCuentasPorPagar = role === 'cuentas_por_pagar'
  const sieteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Combustible: cada rol necesita ver una etapa distinta del flujo
  // (PENDIENTE = por aprobar, APROBADA = por pagar, y el propio empleado
  // quiere ver el estado de lo que él mismo subió).
  const fuelRequestWhere = isCuentasPorPagar
    ? { estado: 'APROBADA', updatedAt: { gte: sieteDiasAtras } }
    : isConductor
      ? { ...filter, OR: [{ estado: 'PENDIENTE' }, { estado: { in: ['APROBADA', 'RECHAZADA'] }, updatedAt: { gte: sieteDiasAtras } }] }
      : { estado: 'PENDIENTE', ...filter }

  const travelRequestWhere = isCuentasPorPagar
    ? { estado: 'APROBADA', updatedAt: { gte: sieteDiasAtras } }
    : isConductor
      ? { ...(empleadoId ? { empleadoId } : {}), OR: [{ estado: 'PENDIENTE' }, { estado: { in: ['APROBADA', 'RECHAZADA'] }, updatedAt: { gte: sieteDiasAtras } }] }
      : { estado: 'PENDIENTE' }

  // Optimized: queries en PARALELO en vez de secuencial
  const [seguros, vehiculosSinSeguro, recientesIncidencias, recientesCombustible, recientesViaticos, recientesGastos, recientesMantenimientos] = await Promise.all([
    prisma.insurance.findMany({
      where: { ...filter, OR: [{ estado: 'VIGENTE' }, { estado: 'VENCIDO' }] },
      include: { vehiculo: { select: { id: true, nombreInterno: true, marca: true } } }
    }),
    prisma.vehicle.findMany({
      where: { ...(empleadoId ? { empleadoId } : {}), seguros: { none: {} } },
      select: { id: true, nombreInterno: true, marca: true, createdAt: true }
    }),
    prisma.incident.findMany({
      where: { estado: 'ABIERTA', ...filter },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { vehiculo: { select: { id: true, nombreInterno: true, marca: true } } }
    }),
    prisma.fuelRequest.findMany({
      where: fuelRequestWhere,
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { vehiculo: { select: { id: true, nombreInterno: true, marca: true } } }
    }),
    prisma.travelRequest.findMany({
      where: travelRequestWhere,
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.expense.findMany({
      where: { estado: 'PENDIENTE', ...filter },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { vehiculo: { select: { id: true, nombreInterno: true, marca: true } } }
    }),
    prisma.maintenance.findMany({
      where: { estado: 'PENDIENTE', ...filter },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { vehiculo: { select: { id: true, nombreInterno: true, marca: true } } }
    })
  ]);

  const now = new Date();
  seguros.forEach(seguro => {
    const vDate = new Date(seguro.vencimiento);
    const diffTime = vDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      generatedAlerts.push({
        id: `seguro-vencido-${seguro.id}`,
        vehiculoId: seguro.vehiculoId,
        tipo: 'Seguro vencido',
        mensaje: `La póliza de ${seguro.vehiculo?.nombreInterno || seguro.vehiculo?.marca} está vencida desde hace ${Math.abs(diffDays)} días`,
        severidad: 'alta',
        href: '/seguros',
        fecha: seguro.createdAt
      });
    } else if (diffDays <= 30) {
      generatedAlerts.push({
        id: `seguro-por-vencer-${seguro.id}`,
        vehiculoId: seguro.vehiculoId,
        tipo: 'Seguro por vencer',
        mensaje: `La póliza de ${seguro.vehiculo?.nombreInterno || seguro.vehiculo?.marca} vencerá en ${diffDays} días`,
        severidad: 'media',
        href: '/seguros',
        fecha: seguro.createdAt
      });
    }
  });

  vehiculosSinSeguro.forEach(v => {
    generatedAlerts.push({
      id: `seguro-faltante-${v.id}`,
      vehiculoId: v.id,
      tipo: 'Seguro no registrado',
      mensaje: `${v.nombreInterno || v.marca} no tiene ninguna póliza de seguro registrada`,
      severidad: 'media',
      href: '/seguros',
      fecha: v.createdAt
    });
  });

  recientesIncidencias.forEach(inc => {
    const created = new Date(inc.createdAt);
    const diffHours = Math.abs(now.getTime() - created.getTime()) / 36e5;
    if (diffHours < 168) {
      generatedAlerts.push({
        id: `incidencia-${inc.id}`,
        vehiculoId: inc.vehiculoId,
        tipo: 'Incidencia Abierta',
        mensaje: `Incidencia en ${inc.vehiculo?.nombreInterno || inc.vehiculo?.marca}: ${inc.descripcion}`,
        severidad: inc.gravedad.toLowerCase() === 'alta' ? 'alta' : 'media',
        href: '/incidencias',
        fecha: inc.createdAt
      });
    }
  });

  recientesCombustible.forEach(req => {
    const vehiculoNombre = req.vehiculo?.nombreInterno || req.vehiculo?.marca
    if (isCuentasPorPagar) {
      generatedAlerts.push({
        id: `combustible-por-pagar-${req.id}`,
        vehiculoId: req.vehiculoId,
        tipo: 'Combustible por Pagar',
        mensaje: `La solicitud de ${req.solicitanteNombre || 'un empleado'} para ${vehiculoNombre} ya tiene visto bueno y está pendiente de pago`,
        severidad: 'media',
        href: '/combustible',
        fecha: req.updatedAt
      });
    } else if (isConductor && req.estado === 'PENDIENTE') {
      generatedAlerts.push({
        id: `combustible-enviada-${req.id}`,
        vehiculoId: req.vehiculoId,
        tipo: 'Solicitud Enviada',
        mensaje: `Tu solicitud de combustible para ${vehiculoNombre} fue enviada y está pendiente de aprobación`,
        severidad: 'baja',
        href: '/combustible',
        fecha: req.createdAt
      });
    } else if (isConductor && req.estado === 'APROBADA') {
      generatedAlerts.push({
        id: `combustible-aprobada-${req.id}`,
        vehiculoId: req.vehiculoId,
        tipo: 'Solicitud Aprobada',
        mensaje: `Tu solicitud de combustible para ${vehiculoNombre} fue aprobada y está pendiente de pago`,
        severidad: 'media',
        href: '/combustible',
        fecha: req.updatedAt
      });
    } else if (isConductor && req.estado === 'RECHAZADA') {
      generatedAlerts.push({
        id: `combustible-rechazada-${req.id}`,
        vehiculoId: req.vehiculoId,
        tipo: 'Solicitud Rechazada',
        mensaje: req.observacionesRechazo
          ? `Tu solicitud de combustible para ${vehiculoNombre} fue rechazada: ${req.observacionesRechazo}`
          : `Tu solicitud de combustible para ${vehiculoNombre} fue rechazada`,
        severidad: 'alta',
        href: '/combustible',
        fecha: req.updatedAt
      });
    } else if (!isConductor) {
      generatedAlerts.push({
        id: `combustible-${req.id}`,
        vehiculoId: req.vehiculoId,
        tipo: 'Combustible por Aprobar',
        mensaje: `Nueva solicitud de combustible por ${req.litrosSolicitados.toFixed(1)} Lts para ${vehiculoNombre}`,
        severidad: 'media',
        href: '/combustible',
        fecha: req.createdAt
      });
    }
  });

  recientesViaticos.forEach(req => {
    if (isCuentasPorPagar) {
      generatedAlerts.push({
        id: `viaticos-por-pagar-${req.id}`,
        tipo: 'Viáticos por Pagar',
        mensaje: `La solicitud de viáticos de ${req.solicitanteNombre} ya tiene visto bueno y está pendiente de pago`,
        severidad: 'media',
        href: '/viaticos',
        fecha: req.updatedAt
      });
    } else if (isConductor && req.estado === 'PENDIENTE') {
      generatedAlerts.push({
        id: `viaticos-enviada-${req.id}`,
        tipo: 'Solicitud Enviada',
        mensaje: `Tu solicitud de viáticos fue enviada y está pendiente de aprobación`,
        severidad: 'baja',
        href: '/viaticos',
        fecha: req.createdAt
      });
    } else if (isConductor && req.estado === 'APROBADA') {
      generatedAlerts.push({
        id: `viaticos-aprobada-${req.id}`,
        tipo: 'Solicitud Aprobada',
        mensaje: `Tu solicitud de viáticos fue aprobada y está pendiente de pago`,
        severidad: 'media',
        href: '/viaticos',
        fecha: req.updatedAt
      });
    } else if (isConductor && req.estado === 'RECHAZADA') {
      generatedAlerts.push({
        id: `viaticos-rechazada-${req.id}`,
        tipo: 'Solicitud Rechazada',
        mensaje: req.observacionesRechazo
          ? `Tu solicitud de viáticos fue rechazada: ${req.observacionesRechazo}`
          : `Tu solicitud de viáticos fue rechazada`,
        severidad: 'alta',
        href: '/viaticos',
        fecha: req.updatedAt
      });
    } else if (!isConductor) {
      generatedAlerts.push({
        id: `viaticos-${req.id}`,
        tipo: 'Viáticos por Aprobar',
        mensaje: `Nueva solicitud de viáticos de ${req.solicitanteNombre} por $${req.costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        severidad: 'media',
        href: '/viaticos',
        fecha: req.createdAt
      });
    }
  });

  recientesGastos.forEach(exp => {
    generatedAlerts.push({
      id: `gasto-${exp.id}`,
      vehiculoId: exp.vehiculoId,
      tipo: 'Gasto por Aprobar',
      mensaje: `Nuevo gasto de ${exp.categoria} por $${exp.monto.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})} para ${exp.vehiculo?.nombreInterno || exp.vehiculo?.marca}`,
      severidad: 'media',
      href: '/gastos',
      fecha: exp.createdAt
    });
  });

  recientesMantenimientos.forEach(m => {
    generatedAlerts.push({
      id: `mantenimiento-pendiente-${m.id}`,
      vehiculoId: m.vehiculoId,
      tipo: 'Mantenimiento por Aprobar',
      mensaje: `Nuevo mantenimiento ${m.tipo} por $${m.costo.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})} para ${m.vehiculo?.nombreInterno || m.vehiculo?.marca}`,
      severidad: 'media',
      href: '/mantenimientos',
      fecha: m.createdAt
    });
  });

  return generatedAlerts.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function getMonthlyExpenses(empleadoId?: string) {
  const prisma = getPrisma()
  const filter = empleadoId ? { vehiculo: { empleadoId } } : {};
  
  // Optimized: filter by last 6 months + parallel queries
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  
  const [expenses, fuelRequests, maintenances] = await Promise.all([
    prisma.expense.findMany({
      where: { estado: 'APROBADA', ...filter, fecha: { gte: sixMonthsAgo } },
      select: { fecha: true, categoria: true, monto: true }
    }),
    prisma.fuelRequest.findMany({
      where: { estado: 'APROBADA', ...filter, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, costoGasolina: true, costoCasetas: true, costoComidas: true }
    }),
    prisma.maintenance.findMany({
      where: { estado: 'APROBADA', ...filter, fecha: { gte: sixMonthsAgo } },
      select: { fecha: true, costo: true }
    })
  ]);

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dataMap = new Map();
  
  for (let i = 5; i >= 0; i--) {
    let d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    let monthName = months[d.getMonth()];
    dataMap.set(`${d.getFullYear()}-${d.getMonth()}`, {
      mes: monthName,
      gasolina: 0,
      mantenimiento: 0,
      otros: 0,
      sortKey: d.getTime()
    });
  }

  expenses.forEach(e => {
    const d = e.fecha;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (dataMap.has(key)) {
      const entry = dataMap.get(key);
      if (e.categoria === 'GASOLINA') entry.gasolina += e.monto;
      else if (e.categoria === 'MANTENIMIENTO') entry.mantenimiento += e.monto;
      else entry.otros += e.monto;
    }
  });

  fuelRequests.forEach(fr => {
    const d = fr.createdAt;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (dataMap.has(key)) {
      const entry = dataMap.get(key);
      entry.gasolina += (fr.costoGasolina || 0);
      entry.otros += (fr.costoCasetas || 0) + (fr.costoComidas || 0);
    }
  });

  maintenances.forEach(m => {
    const d = m.fecha; 
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (dataMap.has(key)) {
      const entry = dataMap.get(key);
      entry.mantenimiento += (m.costo || 0);
    }
  });

  const result = Array.from(dataMap.values()).sort((a, b) => a.sortKey - b.sortKey).map(item => {
    const { sortKey, ...rest } = item;
    return rest;
  });

  return result;
}
export async function rejectMaintenance(id: string) { const prisma = getPrisma(); const main = await prisma.maintenance.update({ where: { id }, data: { estado: 'RECHAZADA' } }); revalidatePath('/mantenimientos'); revalidatePath('/vehiculos'); return main; }


// --- Organization (Branches & Departments) ---

export async function getBranches() {
  const prisma = getPrisma()
  return await prisma.branch.findMany({ orderBy: { name: 'asc' } })
}

export async function createBranch(name: string) {
  const prisma = getPrisma()
  const b = await prisma.branch.create({ data: { name } })
  // revalidatePath('/organizacion')
  // revalidatePath('/empleados')
  // revalidatePath('/vehiculos')
  return b
}

export async function deleteBranch(id: string) {
  const prisma = getPrisma()
  const b = await prisma.branch.delete({ where: { id } })
  revalidatePath('/organizacion')
  revalidatePath('/empleados')
  revalidatePath('/vehiculos')
  return b
}

export async function getDepartments() {
  const prisma = getPrisma()
  return await prisma.department.findMany({ orderBy: { name: 'asc' } })
}

export async function createDepartment(name: string) {
  const prisma = getPrisma()
  const d = await prisma.department.create({ data: { name } })
  revalidatePath('/organizacion')
  revalidatePath('/empleados')
  return d
}

export async function deleteDepartment(id: string) {
  const prisma = getPrisma()
  const d = await prisma.department.delete({ where: { id } })
  revalidatePath('/organizacion')
  revalidatePath('/empleados')
  return d
}

// --- Organization Config ---

export async function getOrganizationConfig() {
  const prisma = getPrisma()
  const config = await prisma.organizationConfig.findUnique({
    where: { id: "default" }
  })
  if (!config) {
    return await prisma.organizationConfig.create({
      data: { id: "default", name: "Mi Organización", logoUrl: null }
    })
  }
  return config
}

export async function updateOrganizationConfig(data: { name: string, logoUrl?: string | null }) {
  const prisma = getPrisma()
  const config = await prisma.organizationConfig.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data }
  })
  revalidatePath('/organizacion')
  return config
}

// --- Insurance Companies (Aseguradoras) ---

export async function getInsuranceCompanies() {
  const prisma = getPrisma()
  return await prisma.insuranceCompany.findMany({ orderBy: { name: 'asc' } })
}

export async function createInsuranceCompany(name: string) {
  const prisma = getPrisma()
  const i = await prisma.insuranceCompany.create({ data: { name } })
  revalidatePath('/organizacion')
  revalidatePath('/seguros')
  return i
}

export async function deleteInsuranceCompany(id: string) {
  const prisma = getPrisma()
  const i = await prisma.insuranceCompany.delete({ where: { id } })
  revalidatePath('/organizacion')
  revalidatePath('/seguros')
  return i
}

// --- Usuarios y Roles ---
// Solo Super Admin puede llegar a estas funciones (la página que las llama
// oculta la sección completa con can('gestionar_usuarios')).

const VALID_ROLES = ['SUPER_ADMIN', 'ADMINISTRADOR', 'CUENTAS_POR_PAGAR', 'CONDUCTOR']

export async function getUsers() {
  const prisma = getPrisma()
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      employee: { select: { nombre: true } },
    }
  })
  return users
}

export async function createUser(data: { email: string, password: string, role: string }) {
  const prisma = getPrisma()
  const role = data.role?.toUpperCase()
  if (!VALID_ROLES.includes(role)) throw new Error('Rol inválido')

  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new Error('Ya existe una cuenta con ese correo electrónico.')

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: await hashPassword(data.password),
      role,
    }
  })
  revalidatePath('/organizacion')
  return user
}

export async function updateUserRole(userId: string, role: string) {
  const prisma = getPrisma()
  const normalized = role?.toUpperCase()
  if (!VALID_ROLES.includes(normalized)) throw new Error('Rol inválido')

  const user = await prisma.user.update({ where: { id: userId }, data: { role: normalized } })
  revalidatePath('/organizacion')
  return user
}


