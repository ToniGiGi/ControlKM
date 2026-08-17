'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getVehicles() {
  const dbVehicles = await prisma.vehicle.findMany({
    orderBy: [
      { orden: 'asc' },
      { createdAt: 'desc' }
    ],
    include: {
      empleado: true,
      seguros: true,
      mantenimientos: true,
      incidencias: true,
      viajes: true,
      cargas: true,
      gastos: true,
      fuelRequests: true,
    }
  })

  return dbVehicles.map(v => {
    // Calcular gastos aprobados de viÃ¡ticos
    const approvedFuelRequests = v.fuelRequests.filter(fr => fr.estado === 'APROBADA');
    const gasolinaViaticos = approvedFuelRequests.reduce((a, b) => a + (b.costoGasolina || 0), 0);
    const casetasViaticos = approvedFuelRequests.reduce((a, b) => a + (b.costoCasetas || 0), 0);
    const comidasViaticos = approvedFuelRequests.reduce((a, b) => a + (b.costoComidas || 0), 0);

    // Calcular gastos por categorÃ­a
    const gastosMapped = {
      gasolina: v.gastos.filter(g => g.categoria === 'GASOLINA').reduce((a, b) => a + b.monto, 0) + gasolinaViaticos,
      mantenimiento: v.gastos.filter(g => g.categoria === 'MANTENIMIENTO').reduce((a, b) => a + b.monto, 0) + v.mantenimientos.filter((m: any) => m.estado === 'APROBADA').reduce((a: number, b: any) => a + (b.costo || 0), 0),
      reparacion: v.gastos.filter(g => g.categoria === 'REPARACION').reduce((a, b) => a + b.monto, 0),
      aceite: v.gastos.filter(g => g.categoria === 'ACEITE').reduce((a, b) => a + b.monto, 0),
      neumaticos: v.gastos.filter(g => g.categoria === 'NEUMATICOS').reduce((a, b) => a + b.monto, 0),
      aditamentos: v.gastos.filter(g => g.categoria === 'ADITAMENTOS').reduce((a, b) => a + b.monto, 0),
      casetas: v.gastos.filter(g => g.categoria === 'CASETAS').reduce((a, b) => a + b.monto, 0) + casetasViaticos,
      multas: v.gastos.filter(g => g.categoria === 'MULTAS').reduce((a, b) => a + b.monto, 0),
      otros: v.gastos.filter(g => g.categoria === 'OTROS').reduce((a, b) => a + b.monto, 0) + comidasViaticos,
    }

    // Telemetria por defecto
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
      ...(v.mantenimientos?.map(m => m.km || 0) || []),
      ...(v.fuelRequests?.map(fr => fr.odometro || 0) || [])
    );

    return {
      ...v,
      kmActual: maxKm,
      estado: v.estado.toLowerCase(),
      seguro: v.seguros && v.seguros[0] ? { ...v.seguros[0], estado: v.seguros[0].estado.toLowerCase() } : { estado: 'vencido' },
      gastos: gastosMapped,
      telemetria
    }
  })
}

export async function getEmployees() {
  const dbEmployees = await prisma.employee.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      vehiculosAsignados: true
    }
  })

  return dbEmployees.map(e => ({
    ...e,
    estado: e.estado.toLowerCase()
  }))
}

function cleanVehicleData(data: any) {
  const allowedFields = [
    'nombreInterno', 'marca', 'modelo', 'anio', 'tipoUnidad', 'placas', 
    'vin', 'numeroEconomico', 'color', 'combustible', 'capacidadTanque', 
    'kmInicial', 'kmActual', 'estado', 'fechaAsignacion', 'sucursal', 
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
  if (clean.sucursal === '') clean.sucursal = null;

  return clean;
}

function cleanEmployeeData(data: any) {
  const { id, vehiculosAsignados, vehiculo, createdAt, updatedAt, password, user, ...rest } = data;
  if (rest.estado) rest.estado = rest.estado.toUpperCase();
  if (rest.vencimientoLicencia) {
    rest.vencimientoLicencia = new Date(rest.vencimientoLicencia);
  } else {
    rest.vencimientoLicencia = null;
  }
  return rest;
}

export async function createVehicle(data: any) {
  const v = await prisma.vehicle.create({ data: cleanVehicleData(data) })
  revalidatePath('/vehiculos')
  revalidatePath('/')
  return v
}

export async function deleteVehicle(id: string) {
  const v = await prisma.vehicle.delete({ where: { id } })
  revalidatePath('/vehiculos')
  revalidatePath('/')
  return v
}

export async function updateVehicleOrder(updates: { id: string, orden: number }[]) {
  // Utilizamos transacciones para asegurar que todos los updates se hagan juntos
  await prisma.$transaction(
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
  const v = await prisma.vehicle.update({ where: { id }, data: cleanVehicleData(data) })
  revalidatePath('/vehiculos')
  revalidatePath('/')
  return v
}

export async function createEmployee(data: any) {
  const { password, ...rest } = data;
  const e = await prisma.employee.create({ data: cleanEmployeeData(rest) })
  
  if (rest.email && password) {
    const user = await prisma.user.create({
      data: {
        email: rest.email,
        password: password,
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
  const { password, ...rest } = data;
  
  if (password && data.userId) {
     await prisma.user.update({
       where: { id: data.userId },
       data: { password: password }
     })
  } else if (password && rest.email && !data.userId) {
    // Create the user if it didn't exist
    const user = await prisma.user.create({
      data: {
        email: rest.email,
        password: password,
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
  return await prisma.insurance.findMany({
    orderBy: { vencimiento: 'asc' },
    include: {
      vehiculo: true
    }
  })
}

export async function createInsurance(data: any) {
  const ins = await prisma.insurance.create({ data: cleanInsuranceData(data) })
  revalidatePath('/seguros')
  revalidatePath('/vehiculos')
  return ins
}

export async function updateInsurance(id: string, data: any) {
  const ins = await prisma.insurance.update({ where: { id }, data: cleanInsuranceData(data) })
  revalidatePath('/seguros')
  revalidatePath('/vehiculos')
  return ins
}

export async function deleteInsurance(id: string) {
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
  return await prisma.maintenance.findMany({
    orderBy: { fecha: 'desc' },
    include: {
      vehiculo: {
        select: { id: true, nombreInterno: true, placas: true, fotoUrl: true }
      }
    }
  })
}

export async function createMaintenance(data: any) {
  const main = await prisma.maintenance.create({ data: cleanMaintenanceData(data) })
  revalidatePath('/mantenimientos')
  revalidatePath('/vehiculos')
  return main
}

export async function updateMaintenance(id: string, data: any) {
  const main = await prisma.maintenance.update({ where: { id }, data: cleanMaintenanceData(data) })
  revalidatePath('/mantenimientos')
  revalidatePath('/vehiculos')
  return main
}

export async function deleteMaintenance(id: string) {
  const main = await prisma.maintenance.delete({ where: { id } })
  revalidatePath('/mantenimientos')
  revalidatePath('/vehiculos')
  return main
}

export async function approveMaintenance(id: string) {
  const main = await prisma.maintenance.update({
    where: { id },
    data: { estado: 'APROBADA' }
  })
  revalidatePath('/mantenimientos')
  revalidatePath('/vehiculos')
  return main
}

export async function getFuelRequests() {
  return await prisma.fuelRequest.findMany({
    orderBy: { fechaSolicitud: 'desc' },
    include: {
      vehiculo: {
        select: { id: true, nombreInterno: true, placas: true, fotoUrl: true, empleadoId: true }
      }
    }
  })
}

export async function createFuelRequest(data: any) {
  const { vehiculoId, ...rest } = data
  const req = await prisma.fuelRequest.create({
    data: {
      ...rest,
      departamento: data.departamento || "No especificado",
      area: data.area || "No especificada",
      vehiculo: { connect: { id: vehiculoId } }
    },
    include: { vehiculo: true }
  })
  revalidatePath('/combustible')
  return req
}

export async function updateFuelRequest(id: string, data: any) {
  const req = await prisma.fuelRequest.update({ where: { id }, data: cleanFuelRequestData(data) })
  revalidatePath('/combustible')
  return req
}

export async function deleteFuelRequest(id: string) {
  const req = await prisma.fuelRequest.delete({ where: { id } })
  revalidatePath('/combustible')
  return req
}

export async function approveFuelRequest(id: string) {
  const req = await prisma.fuelRequest.update({ where: { id }, data: { estado: 'APROBADA' } })
  revalidatePath('/combustible')
  revalidatePath('/vehiculos')
  return req
}

export async function rejectFuelRequest(id: string) {
  const req = await prisma.fuelRequest.update({ where: { id }, data: { estado: 'RECHAZADA' } })
  revalidatePath('/combustible')
  revalidatePath('/vehiculos')
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
  return await prisma.expense.findMany({
    orderBy: { fecha: 'desc' },
    include: {
      vehiculo: {
        select: { id: true, nombreInterno: true, placas: true, fotoUrl: true }
      }
    }
  })
}

export async function createExpense(data: any) {
  const exp = await prisma.expense.create({ data: cleanExpenseData(data) })
  revalidatePath('/gastos')
  revalidatePath('/vehiculos')
  return exp
}

export async function updateExpense(id: string, data: any) {
  const exp = await prisma.expense.update({ where: { id }, data: cleanExpenseData(data) })
  revalidatePath('/gastos')
  revalidatePath('/vehiculos')
  return exp
}

export async function deleteExpense(id: string) {
  const exp = await prisma.expense.delete({ where: { id } })
  revalidatePath('/gastos')
  revalidatePath('/vehiculos')
  return exp
}

export async function approveExpense(id: string) {
  const exp = await prisma.expense.update({
    where: { id },
    data: { estado: 'APROBADA' }
  })
  revalidatePath('/gastos')
  revalidatePath('/vehiculos')
  return exp
}

export async function rejectExpense(id: string) {
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
  return await prisma.incident.findMany({
    orderBy: { fecha: 'desc' },
    include: {
      vehiculo: {
        select: { id: true, nombreInterno: true, placas: true, fotoUrl: true }
      }
    }
  })
}

export async function createIncident(data: any) {
  const inc = await prisma.incident.create({ data: cleanIncidentData(data) })
  revalidatePath('/incidencias')
  revalidatePath('/vehiculos')
  return inc
}

export async function updateIncident(id: string, data: any) {
  const inc = await prisma.incident.update({ where: { id }, data: cleanIncidentData(data) })
  revalidatePath('/incidencias')
  revalidatePath('/vehiculos')
  return inc
}

export async function deleteIncident(id: string) {
  const inc = await prisma.incident.delete({ where: { id } })
  revalidatePath('/incidencias')
  revalidatePath('/vehiculos')
  return inc
}

export async function getAlerts(empleadoId?: string) {
  const generatedAlerts: any[] = [];
  const filter = empleadoId ? { vehiculo: { empleadoId } } : {};

  // 1. Seguros por vencer (30 días) y vencidos
  const seguros = await prisma.insurance.findMany({
    where: {
      ...filter,
      OR: [
        { estado: 'VIGENTE' },
        { estado: 'VENCIDO' }
      ]
    },
    include: { vehiculo: true }
  });

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

  // 2. Incidencias ABIERTAS
  const recientesIncidencias = await prisma.incident.findMany({
    where: { 
      estado: 'ABIERTA',
      ...filter
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { vehiculo: true }
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

  // 3. Combustible por Aprobar
  const recientesCombustible = await prisma.fuelRequest.findMany({
    where: { 
      estado: 'PENDIENTE',
      ...filter
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { vehiculo: true }
  });

  recientesCombustible.forEach(req => {
    generatedAlerts.push({
      id: `combustible-${req.id}`,
      vehiculoId: req.vehiculoId,
      tipo: 'Combustible por Aprobar',
      mensaje: `Nueva solicitud de combustible por ${req.litrosSolicitados} Lts para ${req.vehiculo?.nombreInterno || req.vehiculo?.marca}`,
      severidad: 'media',
      href: '/combustible',
      fecha: req.createdAt
    });
  });

  // 4. Gastos PENDIENTE
  const recientesGastos = await prisma.expense.findMany({
    where: { 
      estado: 'PENDIENTE',
      ...filter
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { vehiculo: true }
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

  // 5. Mantenimientos PENDIENTE
  const recientesMantenimientos = await prisma.maintenance.findMany({
    where: { 
      estado: 'PENDIENTE',
      ...filter
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { vehiculo: true }
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
  const filter = empleadoId ? { vehiculo: { empleadoId } } : {};
  const expenses = await prisma.expense.findMany({ where: filter });
  
  const fuelRequests = await prisma.fuelRequest.findMany({
    where: { estado: 'APROBADA', ...filter }
  });

  const maintenances = await prisma.maintenance.findMany({
    where: { estado: 'APROBADA', ...filter }
  });

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dataMap = new Map();
  
  const now = new Date();
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
    const d = fr.createdAt; // or fechaSolicitud
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
export async function rejectMaintenance(id: string) { const main = await prisma.maintenance.update({ where: { id }, data: { estado: 'RECHAZADA' } }); revalidatePath('/mantenimientos'); revalidatePath('/vehiculos'); return main; }


// --- Organization (Branches & Departments) ---

export async function getBranches() {
  const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' } })
  console.log('getBranches called. Found:', branches)
  return branches
}

export async function createBranch(name: string) {
  const b = await prisma.branch.create({ data: { name } })
  // revalidatePath('/organizacion')
  // revalidatePath('/empleados')
  // revalidatePath('/vehiculos')
  return b
}

export async function deleteBranch(id: string) {
  const b = await prisma.branch.delete({ where: { id } })
  revalidatePath('/organizacion')
  revalidatePath('/empleados')
  revalidatePath('/vehiculos')
  return b
}

export async function getDepartments() {
  return await prisma.department.findMany({ orderBy: { name: 'asc' } })
}

export async function createDepartment(name: string) {
  const d = await prisma.department.create({ data: { name } })
  revalidatePath('/organizacion')
  revalidatePath('/empleados')
  return d
}

export async function deleteDepartment(id: string) {
  const d = await prisma.department.delete({ where: { id } })
  revalidatePath('/organizacion')
  revalidatePath('/empleados')
  return d
}

// --- Organization Config ---

export async function getOrganizationConfig() {
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
  return await prisma.insuranceCompany.findMany({ orderBy: { name: 'asc' } })
}

export async function createInsuranceCompany(name: string) {
  const i = await prisma.insuranceCompany.create({ data: { name } })
  revalidatePath('/organizacion')
  revalidatePath('/seguros')
  return i
}

export async function deleteInsuranceCompany(id: string) {
  const i = await prisma.insuranceCompany.delete({ where: { id } })
  revalidatePath('/organizacion')
  revalidatePath('/seguros')
  return i
}


