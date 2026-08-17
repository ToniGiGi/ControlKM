import * as xlsx from 'xlsx'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import 'dotenv/config'

const libsql = createClient({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})
const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })

function parseDateExcel(excelDate: any): Date | null {
  if (!excelDate) return null;
  if (typeof excelDate === 'number') {
    // Excel dates are days since Dec 30, 1899
    const d = new Date((excelDate - (25567 + 2)) * 86400 * 1000)
    // Actually the standard formula for JS Date from Excel date is:
    return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
  }
  if (typeof excelDate === 'string') {
    const parts = excelDate.split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`); // DD/MM/YYYY
    }
  }
  return null;
}

async function main() {
  const filePath = "C:\\Users\\tonyg\\Downloads\\archivo control vehicular.xlsx"
  const workbook = xlsx.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = xlsx.utils.sheet_to_json(sheet)

  for (const row of data as any[]) {
    try {
      const nombreEmpleado = row['Nombre del responsable']
      const departamento = row['Departamento']
      const aliasAuto = row['Alias auto']
      const marcaModelo = row['Marca']
      const anio = row['Modelo']
      const numPoliza = row['Número de póliza de seguro']
      const inicioSeguroRaw = row['Fecha de inicio del seguro']
      const finSeguroRaw = row['Fecha de vencimiento del seguro']
      const ultimaFechaServicioRaw = row['Última fecha de servicio']
      const kmUltimo = row['Kilometraje último servicio']
      const kmProximo = row['Kilometraje próximo serv']

      if (!aliasAuto) continue;

      // 1. Create or find employee
      let empleado = null
      if (nombreEmpleado && nombreEmpleado !== '-') {
        empleado = await prisma.employee.findFirst({ where: { nombre: nombreEmpleado } })
        if (!empleado) {
          empleado = await prisma.employee.create({
            data: {
              nombre: nombreEmpleado,
              puesto: departamento,
              estado: 'ACTIVO',
            }
          })
        }
      }

      // 2. Create vehicle
      // Split "Honda Civic" into Marca="Honda", Modelo="Civic"
      const partesMarca = (marcaModelo || 'Desconocido').split(' ')
      const marca = partesMarca[0]
      const modelo = partesMarca.slice(1).join(' ') || marca

      let vehiculo = await prisma.vehicle.findFirst({ where: { nombreInterno: aliasAuto } })
      
      if (!vehiculo) {
        vehiculo = await prisma.vehicle.create({
          data: {
            nombreInterno: aliasAuto,
            marca: marca,
            modelo: modelo,
            anio: typeof anio === 'number' ? anio : parseInt(anio) || 2020,
            tipoUnidad: 'SEDAN', // default
            placas: `SIN-PLACAS-${Date.now()}-${Math.floor(Math.random()*1000)}`, // Placas is unique and required
            kmActual: typeof kmUltimo === 'number' ? kmUltimo : parseInt(kmUltimo) || 0,
            empleadoId: empleado?.id || null,
            proximoMantenimientoKm: typeof kmProximo === 'number' ? kmProximo : parseInt(kmProximo) || null
          }
        })
      }

      // 3. Create Insurance
      if (numPoliza && numPoliza !== '-') {
        const inicio = parseDateExcel(inicioSeguroRaw) || new Date()
        const fin = parseDateExcel(finSeguroRaw) || new Date()
        
        await prisma.insurance.create({
          data: {
            vehiculoId: vehiculo.id,
            aseguradora: 'Desconocida', // The excel doesn't have Aseguradora
            poliza: numPoliza.toString(),
            inicio: inicio,
            vencimiento: fin,
            estado: fin > new Date() ? 'VIGENTE' : 'VENCIDO'
          }
        })
      }

      // 4. Create Maintenance
      if (ultimaFechaServicioRaw && ultimaFechaServicioRaw !== '-') {
        const fecha = parseDateExcel(ultimaFechaServicioRaw) || new Date()
        await prisma.maintenance.create({
          data: {
            vehiculoId: vehiculo.id,
            tipo: 'PREVENTIVO',
            fecha: fecha,
            km: typeof kmUltimo === 'number' ? kmUltimo : parseInt(kmUltimo) || vehiculo.kmActual,
            descripcion: 'Servicio registrado desde Excel',
            costo: 0,
            estado: 'COMPLETADO'
          }
        })
      }

      console.log(`Imported vehicle: ${aliasAuto}`)

    } catch (e) {
      console.error(`Error importing row:`, e)
    }
  }

  console.log("Import completed!")
}

main().catch(console.error).finally(() => prisma.$disconnect())
