const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: "postgresql://postgres:root@localhost:5432/postgres"
  });

  try {
    await client.connect();
    console.log("¡Conexión exitosa a PostgreSQL local!");
    
    // Create the fleetcore database if it doesn't exist
    const res = await client.query("SELECT datname FROM pg_database WHERE datname = 'fleetcore'");
    if (res.rowCount === 0) {
      await client.query('CREATE DATABASE fleetcore');
      console.log("Base de datos 'fleetcore' creada exitosamente.");
    } else {
      console.log("La base de datos 'fleetcore' ya existe.");
    }
  } catch (err) {
    console.error("Error conectando a PostgreSQL local:", err.message);
  } finally {
    await client.end();
  }
}

test();
