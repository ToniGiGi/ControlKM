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

async function main() {
  const filePath = "C:\\Users\\tonyg\\Downloads\\archivo control vehicular.xlsx"
  const workbook = xlsx.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const data = xlsx.utils.sheet_to_json(sheet)

  for (const row of data as any[]) {
    try {
      const numPoliza1 = row['Número de póliza de seguro'] // Col F
      const numPoliza2 = row['Numero de Poliza'] // Col N
      const aseguradora = row['Nombre de la aseguradora'] // Col O
      
      const poliza = numPoliza2 || numPoliza1
      if (!poliza || poliza === '-') continue;

      if (aseguradora) {
        // Update all insurances that match this poliza
        await prisma.insurance.updateMany({
          where: { poliza: poliza.toString() },
          data: { aseguradora: aseguradora.toString() }
        })
        console.log(`Updated poliza ${poliza} with aseguradora ${aseguradora}`)
      }
    } catch (e) {
      console.error(`Error updating row:`, e)
    }
  }

  console.log("Update completed!")
}

main().catch(console.error).finally(() => prisma.$disconnect())
