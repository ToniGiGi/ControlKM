import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { employees, vehicles } from '../lib/mock-data'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create Super Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@fleetcore.com' },
    update: {},
    create: {
      email: 'admin@fleetcore.com',
      password: 'password123', // In a real app, this should be hashed
      role: 'SUPER_ADMIN',
    },
  })

  // Create Employees and their Users
  for (const emp of employees) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        password: 'password123',
        role: emp.puesto.includes('Conductor') ? 'CONDUCTOR' : 'ADMINISTRADOR',
      },
    })

    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {
        fotoUrl: emp.fotoUrl,
      },
      create: {
        userId: user.id,
        nombre: emp.nombre,
        email: emp.email,
        telefono: emp.telefono,
        puesto: emp.puesto,
        area: emp.area,
        sucursal: emp.sucursal,
        licencia: emp.licencia,
        vencimientoLicencia: emp.vencimientoLicencia ? new Date(emp.vencimientoLicencia) : null,
        estado: emp.estado.toUpperCase(),
        fotoUrl: emp.fotoUrl,
      },
    })
  }

  // Create Vehicles and relations
  for (const v of vehicles) {
    const employee = v.empleadoId
      ? await prisma.employee.findFirst({ where: { email: employees.find(e => e.id === v.empleadoId)?.email } })
      : null

    const vehicle = await prisma.vehicle.upsert({
      where: { placas: v.placas },
      update: {
        fotoUrl: v.fotoUrl,
      },
      create: {
        nombreInterno: v.nombreInterno,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        tipoUnidad: v.tipoUnidad,
        placas: v.placas,
        vin: v.vin,
        numeroEconomico: v.numeroEconomico,
        color: v.color,
        combustible: v.combustible,
        capacidadTanque: v.capacidadTanque,
        kmInicial: v.kmInicial,
        kmActual: v.kmActual,
        estado: v.estado.toUpperCase() as any,
        empleadoId: employee?.id,
        fechaAsignacion: v.fechaAsignacion ? new Date(v.fechaAsignacion) : null,
        sucursal: v.sucursal,
        fotoUrl: v.fotoUrl,
        proximoMantenimientoFecha: v.proximoMantenimientoFecha ? new Date(v.proximoMantenimientoFecha) : null,
        proximoMantenimientoKm: v.proximoMantenimientoKm,
      },
    })

    // Insurance
    if (v.seguro) {
      await prisma.insurance.create({
        data: {
          vehiculoId: vehicle.id,
          aseguradora: v.seguro.aseguradora,
          poliza: v.seguro.poliza,
          cobertura: v.seguro.cobertura,
          inicio: new Date(v.seguro.inicio),
          vencimiento: new Date(v.seguro.vencimiento),
          costo: v.seguro.costo,
          estado: v.seguro.estado.toUpperCase() as any,
        }
      })
    }

    // Maintenances
    for (const m of v.mantenimientos) {
      await prisma.maintenance.create({
        data: {
          vehiculoId: vehicle.id,
          tipo: m.tipo.toUpperCase() as any,
          fecha: new Date(m.fecha),
          km: m.km,
          taller: m.taller,
          descripcion: m.descripcion,
          costo: m.costo,
        }
      })
    }

    // Incidents
    for (const i of v.incidencias) {
      await prisma.incident.create({
        data: {
          vehiculoId: vehicle.id,
          tipo: i.tipo,
          fecha: new Date(i.fecha),
          gravedad: i.gravedad.toUpperCase() as any,
          descripcion: i.descripcion,
          estado: i.estado.toUpperCase() as any,
          costo: i.costo,
        }
      })
    }

    // Trips
    for (const t of v.viajes) {
      await prisma.trip.create({
        data: {
          vehiculoId: vehicle.id,
          origen: t.origen,
          destino: t.destino,
          fecha: new Date(t.fecha),
          km: t.km,
          motivo: t.motivo,
        }
      })
    }

    // Fuel logs
    for (const f of v.cargas) {
      await prisma.fuelLog.create({
        data: {
          vehiculoId: vehicle.id,
          fecha: new Date(f.fecha),
          litros: f.litros,
          costoLitro: f.costoLitro,
          km: f.km,
          gasolinera: f.gasolinera,
        }
      })
    }
    
    // Expenses (from the single object in mock data)
    for (const [categoria, monto] of Object.entries(v.gastos)) {
      if (monto > 0) {
        await prisma.expense.create({
          data: {
            vehiculoId: vehicle.id,
            categoria: categoria.toUpperCase(),
            monto: monto,
            fecha: new Date(),
          }
        })
      }
    }
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
