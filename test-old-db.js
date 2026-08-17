const { PrismaClient } = require('@prisma/client');

async function main() {
  // Connect to OLD database
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_GZ2OwWfmYLx3@ep-twilight-bonus-aj68ru2g.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
  const prismaOld = new PrismaClient();

  try {
    console.log("Attempting to connect to old database...");
    const vehicles = await prismaOld.vehiculo.findMany();
    console.log(`Found ${vehicles.length} vehicles in old database.`);
    
    const employees = await prismaOld.empleado.findMany();
    console.log(`Found ${employees.length} employees in old database.`);
  } catch (error) {
    console.error("Failed to fetch from old DB. It might be completely blocked by Neon:", error.message);
  } finally {
    await prismaOld.$disconnect();
  }
}

main();
