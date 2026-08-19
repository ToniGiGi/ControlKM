export type VehicleStatus =
  | 'activo'
  | 'inactivo'
  | 'mantenimiento'
  | 'fuera_servicio'
  | 'vendido'
  | 'baja'

export type TelemetryStatus = 'en_movimiento' | 'detenido' | 'apagado' | 'sin_senal'

export type InsuranceStatus = 'vigente' | 'por_vencer' | 'vencido'

export type ExpenseCategory =
  | 'gasolina'
  | 'mantenimiento'
  | 'reparacion'
  | 'aceite'
  | 'neumaticos'
  | 'aditamentos'
  | 'casetas'
  | 'multas'
  | 'otros'

export interface Maintenance {
  id: string
  tipo: 'preventivo' | 'correctivo'
  fecha: string
  km: number
  taller: string
  descripcion: string
  costo: number
}

export interface Incident {
  id: string
  tipo: string
  fecha: string
  gravedad: 'baja' | 'media' | 'alta'
  descripcion: string
  estado: 'abierta' | 'en_revision' | 'resuelta' | 'cerrada'
  costo: number
}

export interface Trip {
  id: string
  origen: string
  destino: string
  fecha: string
  km: number
  motivo: string
}

export interface FuelLog {
  id: string
  fecha: string
  litros: number
  costoLitro: number
  km: number
  gasolinera: string
}

export interface Vehicle {
  id: string
  nombreInterno: string
  marca: string
  modelo: string
  anio: number
  tipoUnidad: string
  placas: string
  vin: string
  numeroEconomico: string
  color: string
  combustible: string
  capacidadTanque: number
  kmInicial: number
  kmActual: number
  estado: VehicleStatus
  empleadoId: string | null
  fechaAsignacion: string
  sucursal: string
  sucursalId?: string | null
  seguro: {
    aseguradora: string
    poliza: string
    cobertura: string
    inicio: string
    vencimiento: string
    costo: number
    estado: InsuranceStatus
  }
  proximoMantenimientoFecha: string
  proximoMantenimientoKm: number
  gastos: Record<ExpenseCategory, number>
  telemetria: {
    dispositivo: string
    estado: TelemetryStatus
    lat: number
    lng: number
    velocidad: number
    ultimoReporte: string
  }
  fotoUrl?: string
  mantenimientos: Maintenance[]
  incidencias: Incident[]
  viajes: Trip[]
  cargas: FuelLog[]
  documentos: { nombre: string; tipo: string; fecha: string }[]
}

export interface Employee {
  id: string
  nombre: string
  email: string
  telefono: string
  puesto: string
  area: string
  sucursal: string
  sucursalId?: string | null
  departamentoId?: string | null
  licencia: string
  vencimientoLicencia: string
  estado: 'activo' | 'inactivo'
  vehiculosAsignados: string[]
  fotoUrl?: string
  password?: string
}

export interface Alert {
  id: string
  tipo: string
  severidad: 'alta' | 'media' | 'baja'
  vehiculoId: string
  mensaje: string
  fecha: string
}

export const employees: Employee[] = [
  {
    id: 'e1',
    nombre: 'Carlos Herrera',
    email: 'carlos.herrera@empresa.mx',
    telefono: '55 1234 5678',
    puesto: 'Conductor',
    area: 'Logística',
    sucursal: 'Ciudad de México',
    licencia: 'B-2291043',
    vencimientoLicencia: '2026-08-14',
    estado: 'activo',
    vehiculosAsignados: ['v1'],
    fotoUrl: 'https://i.pravatar.cc/150?u=carlos',
  },
  {
    id: 'e2',
    nombre: 'María Fernanda López',
    email: 'mf.lopez@empresa.mx',
    telefono: '55 2345 6789',
    puesto: 'Conductora',
    area: 'Ventas',
    sucursal: 'Querétaro',
    licencia: 'B-8841200',
    vencimientoLicencia: '2026-03-02',
    estado: 'activo',
    vehiculosAsignados: ['v2'],
    fotoUrl: 'https://i.pravatar.cc/150?u=maria',
  },
  {
    id: 'e3',
    nombre: 'Jorge Ramírez',
    email: 'jorge.ramirez@empresa.mx',
    telefono: '55 3456 7890',
    puesto: 'Operador de Tráiler',
    area: 'Distribución',
    sucursal: 'San Luis Potosí',
    licencia: 'E-1120934',
    vencimientoLicencia: '2026-11-20',
    estado: 'activo',
    vehiculosAsignados: ['v3'],
  },
  {
    id: 'e4',
    nombre: 'Ana Sofía Delgado',
    email: 'ana.delgado@empresa.mx',
    telefono: '55 4567 8901',
    puesto: 'Supervisora de Ruta',
    area: 'Operaciones',
    sucursal: 'Xalapa',
    licencia: 'B-5590128',
    vencimientoLicencia: '2026-01-18',
    estado: 'activo',
    vehiculosAsignados: ['v4'],
    fotoUrl: 'https://i.pravatar.cc/150?u=ana',
  },
  {
    id: 'e5',
    nombre: 'Roberto Núñez',
    email: 'roberto.nunez@empresa.mx',
    telefono: '55 5678 9012',
    puesto: 'Conductor',
    area: 'Mantenimiento',
    sucursal: 'Huasteca',
    licencia: 'B-3320991',
    vencimientoLicencia: '2027-05-10',
    estado: 'activo',
    vehiculosAsignados: ['v5'],
  },
  {
    id: 'e6',
    nombre: 'Patricia Vega',
    email: 'patricia.vega@empresa.mx',
    telefono: '55 6789 0123',
    puesto: 'Conductora',
    area: 'Ventas',
    sucursal: 'Ciudad de México',
    licencia: 'B-7712004',
    vencimientoLicencia: '2026-09-25',
    estado: 'inactivo',
    vehiculosAsignados: [],
    fotoUrl: 'https://i.pravatar.cc/150?u=patricia',
  },
]

function gastos(
  gasolina: number,
  mantenimiento: number,
  reparacion: number,
  aceite: number,
  neumaticos: number,
  aditamentos: number,
  casetas: number,
  multas: number,
  otros: number,
): Record<ExpenseCategory, number> {
  return {
    gasolina,
    mantenimiento,
    reparacion,
    aceite,
    neumaticos,
    aditamentos,
    casetas,
    multas,
    otros,
  }
}

export const vehicles: Vehicle[] = [
  {
    id: 'v1',
    nombreInterno: 'Unidad Reparto 01',
    marca: 'Nissan',
    modelo: 'NP300',
    anio: 2022,
    tipoUnidad: 'Pickup',
    placas: 'MRT-45-12',
    vin: '3N1AB7AP1KL123456',
    numeroEconomico: 'ECO-101',
    color: 'Blanco',
    combustible: 'Gasolina',
    capacidadTanque: 80,
    kmInicial: 12000,
    kmActual: 68420,
    estado: 'activo',
    empleadoId: 'e1',
    fechaAsignacion: '2023-02-01',
    sucursal: 'Ciudad de México',
    fotoUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=800',
    seguro: {
      aseguradora: 'GNP Seguros',
      poliza: 'POL-778812',
      cobertura: 'Amplia',
      inicio: '2025-03-15',
      vencimiento: '2026-03-15',
      costo: 18500,
      estado: 'vigente',
    },
    proximoMantenimientoFecha: '2026-07-20',
    proximoMantenimientoKm: 72000,
    gastos: gastos(42300, 15600, 4200, 2100, 8900, 1200, 3400, 900, 500),
    telemetria: {
      dispositivo: 'GPS-8841',
      estado: 'en_movimiento',
      lat: 19.4978,
      lng: -99.1269,
      velocidad: 54,
      ultimoReporte: 'Hace 1 min',
    },
    mantenimientos: [
      { id: 'm1', tipo: 'preventivo', fecha: '2026-01-10', km: 60000, taller: 'Taller Central', descripcion: 'Servicio 60 mil km', costo: 5200 },
      { id: 'm2', tipo: 'correctivo', fecha: '2025-09-04', km: 51000, taller: 'Frenos Express', descripcion: 'Cambio de balatas', costo: 3100 },
    ],
    incidencias: [
      { id: 'i1', tipo: 'Golpe menor', fecha: '2025-11-22', gravedad: 'baja', descripcion: 'Rayón en puerta trasera', estado: 'resuelta', costo: 1800 },
    ],
    viajes: [
      { id: 't1', origen: 'CDMX', destino: 'Toluca', fecha: '2026-06-28', km: 130, motivo: 'Entrega cliente' },
      { id: 't2', origen: 'CDMX', destino: 'Querétaro', fecha: '2026-06-20', km: 420, motivo: 'Ruta distribución' },
    ],
    cargas: [
      { id: 'f1', fecha: '2026-06-29', litros: 62, costoLitro: 24.1, km: 68420, gasolinera: 'Pemex Insurgentes' },
      { id: 'f2', fecha: '2026-06-18', litros: 70, costoLitro: 23.8, km: 67800, gasolinera: 'BP Reforma' },
    ],
    documentos: [
      { nombre: 'Póliza de seguro 2025-2026', tipo: 'Seguro', fecha: '2025-03-15' },
      { nombre: 'Tarjeta de circulación', tipo: 'Circulación', fecha: '2024-01-10' },
    ],
  },
  {
    id: 'v2',
    nombreInterno: 'Ventas Sedán 02',
    marca: 'Toyota',
    modelo: 'Corolla',
    anio: 2023,
    tipoUnidad: 'Automóvil',
    placas: 'NWT-90-33',
    vin: '2T1BURHE0KC098765',
    numeroEconomico: 'ECO-102',
    color: 'Gris',
    combustible: 'Gasolina',
    capacidadTanque: 50,
    kmInicial: 5000,
    kmActual: 39120,
    estado: 'activo',
    empleadoId: 'e2',
    fechaAsignacion: '2023-06-12',
    sucursal: 'Querétaro',
    fotoUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fd?auto=format&fit=crop&q=80&w=800',
    seguro: {
      aseguradora: 'AXA Seguros',
      poliza: 'POL-334451',
      cobertura: 'Amplia',
      inicio: '2025-07-01',
      vencimiento: '2026-07-18',
      costo: 14200,
      estado: 'por_vencer',
    },
    proximoMantenimientoFecha: '2026-08-01',
    proximoMantenimientoKm: 40000,
    gastos: gastos(28900, 9200, 1500, 1800, 0, 600, 2100, 0, 300),
    telemetria: {
      dispositivo: 'GPS-2210',
      estado: 'detenido',
      lat: 19.3573,
      lng: -99.1666,
      velocidad: 0,
      ultimoReporte: 'Hace 6 min',
    },
    mantenimientos: [
      { id: 'm3', tipo: 'preventivo', fecha: '2025-12-15', km: 30000, taller: 'Toyota Del Valle', descripcion: 'Servicio 30 mil km', costo: 4100 },
    ],
    incidencias: [],
    viajes: [
      { id: 't3', origen: 'CDMX', destino: 'Cuernavaca', fecha: '2026-06-25', km: 90, motivo: 'Visita cliente' },
    ],
    cargas: [
      { id: 'f3', fecha: '2026-06-27', litros: 40, costoLitro: 24.0, km: 39120, gasolinera: 'Pemex Coyoacán' },
    ],
    documentos: [{ nombre: 'Póliza de seguro 2025-2026', tipo: 'Seguro', fecha: '2025-07-01' }],
  },
  {
    id: 'v3',
    nombreInterno: 'Tráiler Distribución 03',
    marca: 'Kenworth',
    modelo: 'T680',
    anio: 2021,
    tipoUnidad: 'Tráiler',
    placas: 'TRC-11-88',
    vin: '1XKYD49X5MJ456123',
    numeroEconomico: 'ECO-201',
    color: 'Rojo',
    combustible: 'Diésel',
    capacidadTanque: 450,
    kmInicial: 40000,
    kmActual: 214500,
    estado: 'mantenimiento',
    empleadoId: 'e3',
    fechaAsignacion: '2022-04-18',
    sucursal: 'San Luis Potosí',
    fotoUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800',
    seguro: {
      aseguradora: 'Qualitas',
      poliza: 'POL-901277',
      cobertura: 'Amplia Plus',
      inicio: '2025-05-10',
      vencimiento: '2026-05-10',
      costo: 62000,
      estado: 'vigente',
    },
    proximoMantenimientoFecha: '2026-07-05',
    proximoMantenimientoKm: 216000,
    gastos: gastos(198000, 84000, 32000, 12000, 45000, 8000, 28000, 3500, 4000),
    telemetria: {
      dispositivo: 'GPS-5567',
      estado: 'apagado',
      lat: 19.5921,
      lng: -99.0501,
      velocidad: 0,
      ultimoReporte: 'Hace 2 h',
    },
    mantenimientos: [
      { id: 'm4', tipo: 'correctivo', fecha: '2026-06-30', km: 214500, taller: 'Kenworth Servicio', descripcion: 'Reparación de turbo', costo: 28000 },
      { id: 'm5', tipo: 'preventivo', fecha: '2026-03-11', km: 200000, taller: 'Kenworth Servicio', descripcion: 'Servicio mayor', costo: 21000 },
    ],
    incidencias: [
      { id: 'i2', tipo: 'Falla mecánica', fecha: '2026-06-29', gravedad: 'alta', descripcion: 'Pérdida de potencia en carretera', estado: 'en_revision', costo: 28000 },
      { id: 'i3', tipo: 'Multa', fecha: '2026-05-02', gravedad: 'media', descripcion: 'Exceso de velocidad en autopista', estado: 'cerrada', costo: 2400 },
    ],
    viajes: [
      { id: 't4', origen: 'Toluca', destino: 'Guadalajara', fecha: '2026-06-15', km: 520, motivo: 'Ruta larga distribución' },
    ],
    cargas: [
      { id: 'f4', fecha: '2026-06-14', litros: 380, costoLitro: 25.6, km: 213900, gasolinera: 'Pemex Autopista' },
    ],
    documentos: [
      { nombre: 'Póliza de seguro 2025-2026', tipo: 'Seguro', fecha: '2025-05-10' },
      { nombre: 'Verificación físico-mecánica', tipo: 'Verificación', fecha: '2025-08-20' },
    ],
  },
  {
    id: 'v4',
    nombreInterno: 'Camioneta Ruta 04',
    marca: 'Ford',
    modelo: 'Transit',
    anio: 2022,
    tipoUnidad: 'Camioneta',
    placas: 'CMT-22-45',
    vin: '1FTBW2CM8NKA33221',
    numeroEconomico: 'ECO-103',
    color: 'Blanco',
    combustible: 'Diésel',
    capacidadTanque: 80,
    kmInicial: 8000,
    kmActual: 95300,
    estado: 'activo',
    empleadoId: 'e4',
    fechaAsignacion: '2022-09-01',
    sucursal: 'Xalapa',
    fotoUrl: 'https://images.unsplash.com/photo-1562624388-75b221006544?auto=format&fit=crop&q=80&w=800',
    seguro: {
      aseguradora: 'HDI Seguros',
      poliza: 'POL-556123',
      cobertura: 'Amplia',
      inicio: '2024-12-20',
      vencimiento: '2025-12-20',
      costo: 22000,
      estado: 'vencido',
    },
    proximoMantenimientoFecha: '2026-07-10',
    proximoMantenimientoKm: 96000,
    gastos: gastos(68000, 24000, 9000, 3200, 14000, 2400, 6800, 1200, 900),
    telemetria: {
      dispositivo: 'GPS-3390',
      estado: 'en_movimiento',
      lat: 19.4326,
      lng: -99.1332,
      velocidad: 38,
      ultimoReporte: 'Hace 30 s',
    },
    mantenimientos: [
      { id: 'm6', tipo: 'preventivo', fecha: '2026-02-20', km: 90000, taller: 'Ford Polanco', descripcion: 'Servicio 90 mil km', costo: 6800 },
    ],
    incidencias: [
      { id: 'i4', tipo: 'Accidente', fecha: '2026-04-14', gravedad: 'alta', descripcion: 'Colisión lateral en cruce', estado: 'abierta', costo: 34000 },
    ],
    viajes: [
      { id: 't5', origen: 'CDMX', destino: 'Pachuca', fecha: '2026-06-26', km: 95, motivo: 'Ruta reparto' },
    ],
    cargas: [
      { id: 'f5', fecha: '2026-06-28', litros: 65, costoLitro: 25.4, km: 95300, gasolinera: 'Pemex Vallejo' },
    ],
    documentos: [{ nombre: 'Póliza de seguro (vencida)', tipo: 'Seguro', fecha: '2024-12-20' }],
  },
  {
    id: 'v5',
    nombreInterno: 'Moto Mensajería 05',
    marca: 'Italika',
    modelo: 'FT150',
    anio: 2024,
    tipoUnidad: 'Motocicleta',
    placas: 'MOT-77-90',
    vin: 'LXYPCNL0XN0012345',
    numeroEconomico: 'ECO-104',
    color: 'Negro',
    combustible: 'Gasolina',
    capacidadTanque: 12,
    kmInicial: 200,
    kmActual: 14800,
    estado: 'activo',
    empleadoId: 'e5',
    fechaAsignacion: '2024-01-15',
    sucursal: 'Huasteca',
    fotoUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=800',
    seguro: {
      aseguradora: 'Chubb',
      poliza: 'POL-220089',
      cobertura: 'Limitada',
      inicio: '2025-06-01',
      vencimiento: '2026-06-01',
      costo: 4200,
      estado: 'vencido',
    },
    proximoMantenimientoFecha: '2026-07-15',
    proximoMantenimientoKm: 16000,
    gastos: gastos(8900, 2200, 400, 600, 900, 300, 0, 0, 150),
    telemetria: {
      dispositivo: 'GPS-1102',
      estado: 'sin_senal',
      lat: 19.3907,
      lng: -99.1436,
      velocidad: 0,
      ultimoReporte: 'Hace 3 h',
    },
    mantenimientos: [
      { id: 'm7', tipo: 'preventivo', fecha: '2026-05-01', km: 12000, taller: 'Italika Service', descripcion: 'Afinación', costo: 900 },
    ],
    incidencias: [],
    viajes: [
      { id: 't6', origen: 'CDMX', destino: 'CDMX', fecha: '2026-06-29', km: 42, motivo: 'Mensajería local' },
    ],
    cargas: [
      { id: 'f6', fecha: '2026-06-29', litros: 10, costoLitro: 24.2, km: 14800, gasolinera: 'Pemex Del Valle' },
    ],
    documentos: [],
  },
  {
    id: 'v6',
    nombreInterno: 'Caja Seca 06',
    marca: 'International',
    modelo: 'DuraStar',
    anio: 2020,
    tipoUnidad: 'Caja seca',
    placas: 'CJS-40-71',
    vin: '1HTMKAAL7LH654321',
    numeroEconomico: 'ECO-202',
    color: 'Azul',
    combustible: 'Diésel',
    capacidadTanque: 200,
    kmInicial: 60000,
    kmActual: 189000,
    estado: 'inactivo',
    empleadoId: null,
    fechaAsignacion: '',
    sucursal: 'San Luis Potosí',
    fotoUrl: 'https://images.unsplash.com/photo-1586191552066-b52bef5903b6?auto=format&fit=crop&q=80&w=800',
    seguro: {
      aseguradora: 'Qualitas',
      poliza: 'POL-445590',
      cobertura: 'Amplia',
      inicio: '2025-09-01',
      vencimiento: '2026-09-01',
      costo: 38000,
      estado: 'vigente',
    },
    proximoMantenimientoFecha: '2026-09-01',
    proximoMantenimientoKm: 192000,
    gastos: gastos(142000, 52000, 18000, 8000, 26000, 4000, 19000, 800, 2000),
    telemetria: {
      dispositivo: 'GPS-6620',
      estado: 'detenido',
      lat: 19.6018,
      lng: -99.045,
      velocidad: 0,
      ultimoReporte: 'Hace 5 h',
    },
    mantenimientos: [
      { id: 'm8', tipo: 'preventivo', fecha: '2026-01-20', km: 180000, taller: 'Diésel Total', descripcion: 'Servicio general', costo: 15000 },
    ],
    incidencias: [],
    viajes: [],
    cargas: [
      { id: 'f7', fecha: '2026-05-30', litros: 180, costoLitro: 25.5, km: 188500, gasolinera: 'Pemex Ecatepec' },
    ],
    documentos: [{ nombre: 'Póliza de seguro 2025-2026', tipo: 'Seguro', fecha: '2025-09-01' }],
  },
]

export const alerts: Alert[] = [
  { id: 'a1', tipo: 'Seguro vencido', severidad: 'alta', vehiculoId: 'v4', mensaje: 'La póliza de la Camioneta Ruta 04 está vencida desde el 20/12/2025.', fecha: 'Hace 2 días' },
  { id: 'a2', tipo: 'Seguro vencido', severidad: 'alta', vehiculoId: 'v5', mensaje: 'La póliza de Moto Mensajería 05 venció el 01/06/2026.', fecha: 'Hace 4 días' },
  { id: 'a3', tipo: 'Incidencia abierta', severidad: 'alta', vehiculoId: 'v4', mensaje: 'Accidente sin resolver en Camioneta Ruta 04.', fecha: 'Hace 1 día' },
  { id: 'a4', tipo: 'Mantenimiento próximo', severidad: 'media', vehiculoId: 'v3', mensaje: 'Tráiler Distribución 03 requiere servicio el 05/07/2026.', fecha: 'Hoy' },
  { id: 'a5', tipo: 'Seguro por vencer', severidad: 'media', vehiculoId: 'v2', mensaje: 'La póliza de Ventas Sedán 02 vence el 18/07/2026.', fecha: 'Hoy' },
  { id: 'a6', tipo: 'GPS sin señal', severidad: 'media', vehiculoId: 'v5', mensaje: 'Moto Mensajería 05 sin reporte de telemetría hace 3 h.', fecha: 'Hace 3 h' },
  { id: 'a7', tipo: 'Vehículo sin conductor', severidad: 'baja', vehiculoId: 'v6', mensaje: 'Caja Seca 06 no tiene empleado asignado.', fecha: 'Hace 1 semana' },
  { id: 'a8', tipo: 'Licencia por vencer', severidad: 'media', vehiculoId: 'v4', mensaje: 'La licencia de Ana Sofía Delgado vence el 18/01/2026.', fecha: 'Hoy' },
]

export const monthlyExpenses = [
  { mes: 'Ene', gasolina: 62000, mantenimiento: 28000, otros: 14000 },
  { mes: 'Feb', gasolina: 58000, mantenimiento: 41000, otros: 12000 },
  { mes: 'Mar', gasolina: 71000, mantenimiento: 33000, otros: 18000 },
  { mes: 'Abr', gasolina: 66000, mantenimiento: 22000, otros: 15000 },
  { mes: 'May', gasolina: 74000, mantenimiento: 38000, otros: 21000 },
  { mes: 'Jun', gasolina: 69000, mantenimiento: 46000, otros: 17000 },
]

// Helpers -------------------------------------------------------------------

export const currency = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

export const numberFmt = (n: number) => new Intl.NumberFormat('es-MX').format(n)

export function totalGastos(v: Vehicle): number {
  return Object.values(v.gastos).reduce((a, b) => a + b, 0)
}

export function getEmployee(id: string | null): Employee | undefined {
  return employees.find((e) => e.id === id)
}

export function getVehicle(id: string): Vehicle | undefined {
  return vehicles.find((v) => v.id === id)
}

export const vehicleStatusLabel: Record<VehicleStatus, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
  mantenimiento: 'En mantenimiento',
  fuera_servicio: 'Fuera de servicio',
  vendido: 'Vendido',
  baja: 'Baja',
}

export const telemetryLabel: Record<TelemetryStatus, string> = {
  en_movimiento: 'En ruta',
  detenido: 'Detenido',
  apagado: 'Apagado',
  sin_senal: 'Sin señal',
}

export const insuranceLabel: Record<InsuranceStatus, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
}

export const expenseLabel: Record<ExpenseCategory, string> = {
  gasolina: 'Gasolina',
  mantenimiento: 'Mantenimiento',
  reparacion: 'Reparación mecánica',
  aceite: 'Aceite',
  neumaticos: 'Neumáticos',
  aditamentos: 'Aditamentos',
  casetas: 'Casetas',
  multas: 'Multas',
  otros: 'Otros',
}
