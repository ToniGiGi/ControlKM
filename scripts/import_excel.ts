import 'dotenv/config'
import * as xlsx from 'xlsx'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// The path to the user's Excel file
const filePath = 'C:\\Users\\tonyg\\Downloads\\archivo control vehicular.xlsx'

function parseExcelDate(excelDate: any): Date | null {
  if (!excelDate) return null;
  if (excelDate instanceof Date) return excelDate;
  if (typeof excelDate === 'number') {
    return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  }
  const parsed = new Date(excelDate);
  if (!isNaN(parsed.getTime())) return parsed;
  return null;
}

async function main() {
  console.log('Reading Excel file...')
  const workbook = xlsx.readFile(filePath, { cellDates: true })
  const sheetName = workbook.SheetNames[0]
  const data = xlsx.utils.sheet_to_json<any>(workbook.Sheets[sheetName])

  console.log(`Found ${data.length} rows. Wiping current database to insert real data...`)
  
  // Wipe existing data
  await prisma.expense.deleteMany()
  await prisma.fuelLog.deleteMany()
  await prisma.trip.deleteMany()
  await prisma.incident.deleteMany()
  await prisma.maintenance.deleteMany()
  await prisma.insurance.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.employee.deleteMany()
  // Keep admin user, delete others
  await prisma.user.deleteMany({ where: { email: { not: 'admin@fleetcore.com' } } })

  console.log('Inserting real data...')

  for (const row of data) {
    const responsable = row['Nombre del responsable']
    const departamento = row['Departamento']
    const alias = row['Alias auto']
    const marca = row['Marca']
    const modelo = row['Modelo']
    const poliza = row['Número de póliza de seguro'] || row['Numero de Poliza']
    const aseguradora = row['Nombre de la aseguradora']
    const fechaInicioSeguro = parseExcelDate(row['Fecha de inicio del seguro'] || row['Fecha de inicio'])
    const fechaFinSeguro = parseExcelDate(row['Fecha de vencimiento del seguro'] || row['Fecha de termino'])
    const costoSeguro = row['Importe de la prima']
    const kmUltimoServicio = parseInt(row['Kilometraje último servicio'])
    const kmProximoServicio = parseInt(row['Kilometraje próximo servicio'])
    const fechaUltimoServicio = parseExcelDate(row['Última fecha de servicio'])

    // 1. Create or connect Employee
    let employee = null
    if (responsable) {
      // Create a dummy email based on name
      const email = responsable.toLowerCase().replace(/\s+/g, '.') + '@empresa.com'
      
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          password: 'password123',
          role: 'CONDUCTOR',
        }
      })

      employee = await prisma.employee.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          nombre: responsable,
          email,
          area: departamento,
          puesto: 'Conductor',
        }
      })
    }

    // 2. Create Vehicle
    // Generate a dummy license plate if missing
    const placas = `GEN-${Math.floor(Math.random() * 900) + 100}`
    
    const vehicle = await prisma.vehicle.create({
      data: {
        nombreInterno: alias || marca,
        marca: marca ? String(marca).split(' ')[0] : 'Desconocida',
        modelo: marca ? String(marca) : 'Desconocido',
        anio: parseInt(modelo) || 2020,
        tipoUnidad: 'Automóvil',
        placas: placas,
        kmActual: parseInt(kmUltimoServicio) || 0,
        kmInicial: parseInt(kmUltimoServicio) || 0,
        empleadoId: employee?.id,
        proximoMantenimientoKm: parseInt(kmProximoServicio) || null,
      }
    })

    // 3. Create Insurance
    if (aseguradora && poliza && fechaInicioSeguro && fechaFinSeguro) {
      await prisma.insurance.create({
        data: {
          vehiculoId: vehicle.id,
          aseguradora: String(aseguradora),
          poliza: String(poliza),
          inicio: fechaInicioSeguro,
          vencimiento: fechaFinSeguro,
          costo: parseFloat(costoSeguro) || 0,
          estado: 'VIGENTE',
        }
      })
    }

    // 4. Create Maintenance (for the last service)
    if (!isNaN(kmUltimoServicio) && fechaUltimoServicio) {
      await prisma.maintenance.create({
        data: {
          vehiculoId: vehicle.id,
          tipo: 'PREVENTIVO',
          fecha: fechaUltimoServicio,
          km: kmUltimoServicio,
          descripcion: 'Último servicio registrado en Excel',
          costo: 0,
        }
      })
    }
  }

  console.log('Real data inserted successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
