const { Pool } = require('pg');
const fs = require('fs');

async function main() {
  const oldUrl = "postgresql://neondb_owner:npg_GZ2OwWfmYLx3@ep-twilight-bonus-aj68ru2g.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require";
  const pool = new Pool({ connectionString: oldUrl });

  try {
    console.log("Conectando a base de datos antigua...");
    const vehicles = await pool.query('SELECT * FROM "Vehicle"');
    fs.writeFileSync('old_vehicles.json', JSON.stringify(vehicles.rows, null, 2));
    console.log(`Vehiculos extraidos: ${vehicles.rowCount}`);

    const employees = await pool.query('SELECT * FROM "Employee"');
    fs.writeFileSync('old_employees.json', JSON.stringify(employees.rows, null, 2));
    console.log(`Empleados extraidos: ${employees.rowCount}`);

  } catch (error) {
    console.error("Error extrayendo datos:", error);
  } finally {
    await pool.end();
  }
}

main();
