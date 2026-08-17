const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const employees = await pool.query('SELECT id, email, "userId" FROM "Employee" WHERE "userId" IS NOT NULL AND email IS NOT NULL');
  
  for (const emp of employees.rows) {
    if (emp.email) {
      await pool.query('UPDATE "User" SET email = $1, password = $2 WHERE id = $3', [emp.email, 'password123', emp.userId]);
      console.log(`Usuario actualizado: ${emp.email} (password: password123)`);
    }
  }
  console.log("¡Todos los usuarios han sido actualizados exitosamente!");
  process.exit(0);
}

main().catch(console.error);
