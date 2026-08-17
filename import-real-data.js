const { Pool } = require('pg');

// Helper: convert Excel serial date to JS Date
function excelDateToJSDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  return new Date(utc_value * 1000).toISOString();
}

// Helper: determine insurance status based on expiry
function getInsuranceStatus(expirySerial) {
  if (!expirySerial) return 'VENCIDO';
  const expiry = new Date(excelDateToJSDate(expirySerial));
  const now = new Date();
  const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'VENCIDO';
  if (diffDays < 30) return 'POR_VENCER';
  return 'VIGENTE';
}

const data = [
  { responsable: "Sergio Alvarado", departamento: "Dirección", alias: "Civic", marca: "Honda", modelo: "Civic", anio: 2019, poliza: "AUN-245164-13", inicioSeguro: 46099, finSeguro: 46464, ultimoServicio: 46143, kmUltimo: 154000, kmProximo: 164000, aseguradora: "EL POTOSI", prima: 15780.34 },
  { responsable: "Carlos Rosales Ramos", departamento: "Comercial", alias: "Gol Carlos", marca: "Volkswagen", modelo: "Gol", anio: 2018, poliza: "20114 20287930", inicioSeguro: 46062, finSeguro: 46427, ultimoServicio: 46143, kmUltimo: 180000, kmProximo: 190000, aseguradora: "INBURSA", prima: 11550.92 },
  { responsable: "Juan Diego Rodríguez Jiménez", departamento: "Ingeniería", alias: "i10 blanco Diego", marca: "Hyundai", modelo: "Grand i10", anio: 2022, poliza: "20114 20294806", inicioSeguro: 45885, finSeguro: 46250, ultimoServicio: 46082, kmUltimo: 167000, kmProximo: 177000, aseguradora: "INBURSA", prima: 13603.30 },
  { responsable: "Jorge Luis Chapoy Bartolo", departamento: "Logística", alias: "i10 Chapoy", marca: "Hyundai", modelo: "Grand i10", anio: 2023, poliza: "20112 20418175", inicioSeguro: 46124, finSeguro: 46489, ultimoServicio: 46054, kmUltimo: 117549, kmProximo: 127549, aseguradora: "INBURSA", prima: 0 },
  { responsable: "Raúl Bolaños Olvera", departamento: "Ingeniería", alias: "ING Ducato", marca: "Fiat", modelo: "Ducato", anio: 2019, poliza: "3270129344", inicioSeguro: 46034, finSeguro: 46399, ultimoServicio: 46143, kmUltimo: 147000, kmProximo: 157000, aseguradora: "EL POTOSI", prima: 19802.22 },
  { responsable: "Raúl Díaz Gamboa", departamento: "Comercial", alias: "King Raúl", marca: "BYD", modelo: "King", anio: 2025, poliza: "845C580A0L", inicioSeguro: 45762, finSeguro: 46127, ultimoServicio: null, kmUltimo: null, kmProximo: null, aseguradora: "BBVA", prima: 12856.80 },
  { responsable: "Saúl González Olvera", departamento: "Comercial", alias: "March Saul", marca: "Nissan", modelo: "March", anio: 2018, poliza: "92128 20004166", inicioSeguro: 46006, finSeguro: 46371, ultimoServicio: 46183, kmUltimo: 282000, kmProximo: 292000, aseguradora: "INBURSA", prima: 10104.76 },
  { responsable: "Javiera Garciasela Agramonte", departamento: "Comercial", alias: "Mobi negro Xavi", marca: "Fiat", modelo: "Mobi", anio: 2023, poliza: "20112 20418969", inicioSeguro: 46180, finSeguro: 46545, ultimoServicio: 45901, kmUltimo: 54863, kmProximo: 64863, aseguradora: "INBURSA", prima: 41203.99 },
  { responsable: "Yoav Salvador Barrón Barcenas", departamento: "Comercial", alias: "Mobi Yoav", marca: "Fiat", modelo: "Mobi", anio: 2023, poliza: "20112 20418941", inicioSeguro: 46179, finSeguro: 46544, ultimoServicio: null, kmUltimo: null, kmProximo: null, aseguradora: "INBURSA", prima: 40409.74 },
  { responsable: "José Alberto Guadarrama García", departamento: "Comercial", alias: "Polo", marca: "Volkswagen", modelo: "Polo", anio: 2021, poliza: "20114 20299375", inicioSeguro: 46163, finSeguro: 46528, ultimoServicio: 45992, kmUltimo: 141000, kmProximo: 151000, aseguradora: "INBURSA", prima: 10230.04 },
  { responsable: "Arturo Martínez Plasencia", departamento: "Logística", alias: "RAM Arturo", marca: "Ram", modelo: "Promaster Rapid", anio: 2023, poliza: "20112 2019922", inicioSeguro: 45127, finSeguro: 46588, ultimoServicio: null, kmUltimo: null, kmProximo: null, aseguradora: "INBURSA", prima: 52602.64 },
  { responsable: "Pedro Jimenez Vazquez", departamento: "Logística", alias: "Ranita Pedro", marca: "BYD", modelo: "Dolphin", anio: 2025, poliza: "815C58048W", inicioSeguro: 46054, finSeguro: 46419, ultimoServicio: null, kmUltimo: null, kmProximo: null, aseguradora: "BBVA", prima: 11022.77 },
  { responsable: "Manuel Arturo Colorado Sánchez", departamento: "Comercial", alias: "Sei2 Manuel", marca: "JAC", modelo: "Sei2", anio: 2026, poliza: "846S4700GW", inicioSeguro: 46163, finSeguro: 47624, ultimoServicio: null, kmUltimo: null, kmProximo: 10000, aseguradora: "BBVA", prima: 0 },
  { responsable: "Raúl Bolaños Olvera", departamento: "Ingeniería", alias: "Sunray ING", marca: "JAC", modelo: "Sunray", anio: 2026, poliza: "846S4700GX", inicioSeguro: 46163, finSeguro: 47624, ultimoServicio: null, kmUltimo: null, kmProximo: 10000, aseguradora: "BBVA", prima: 0 },
  { responsable: "Kevin Missael Herrera Frías", departamento: "Logística", alias: "Sunray Mensajeria QRO", marca: "JAC", modelo: "Sunray", anio: 2026, poliza: "846S4700H1", inicioSeguro: 46163, finSeguro: 47624, ultimoServicio: null, kmUltimo: null, kmProximo: 10000, aseguradora: "BBVA", prima: 0 },
  { responsable: "Eliseo Vinaja Hernández", departamento: "Logística", alias: "Tornado Eliseo", marca: "Tornado", modelo: "Pick Up", anio: 2016, poliza: "92128 20004228", inicioSeguro: 46009, finSeguro: 46374, ultimoServicio: 46048, kmUltimo: 288472, kmProximo: 298472, aseguradora: "INBURSA", prima: 11370.68 },
];

async function main() {
  const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_O0Nbk6elFSfz@ep-still-breeze-ay49ou5v-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  });

  try {
    console.log("Conectando a la nueva base de datos...");

    // Step 1: Delete existing seed data (vehicles, employees, users except admin)
    console.log("Limpiando datos anteriores...");
    await pool.query('DELETE FROM "Insurance"');
    await pool.query('DELETE FROM "Maintenance"');
    await pool.query('DELETE FROM "Incident"');
    await pool.query('DELETE FROM "Trip"');
    await pool.query('DELETE FROM "FuelLog"');
    await pool.query('DELETE FROM "Expense"');
    await pool.query('DELETE FROM "FuelRequest"');
    await pool.query('UPDATE "Vehicle" SET "empleadoId" = NULL');
    await pool.query('DELETE FROM "Vehicle"');
    await pool.query('DELETE FROM "Employee"');
    await pool.query(`DELETE FROM "User" WHERE email != 'admin@fleetcore.com'`);
    console.log("Datos anteriores eliminados.");

    // Step 2: Get unique employees (by name)
    const uniqueEmployees = {};
    for (const row of data) {
      if (!uniqueEmployees[row.responsable]) {
        uniqueEmployees[row.responsable] = { nombre: row.responsable, departamento: row.departamento };
      }
    }

    const employeeIds = {};

    // Step 3: Create employees and their users
    console.log("Creando empleados...");
    for (const [nombre, emp] of Object.entries(uniqueEmployees)) {
      // Generate email from name
      const email = nombre.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, ".")
        .replace(/[^a-z.]/g, "") + "@fleetcore.mx";

      // Create user
      const userResult = await pool.query(
        `INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, 'password123', 'CONDUCTOR', NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET "updatedAt" = NOW()
         RETURNING id`,
        [email]
      );
      const userId = userResult.rows[0].id;

      // Create employee
      const empResult = await pool.query(
        `INSERT INTO "Employee" (id, "userId", nombre, email, puesto, area, estado, "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'ACTIVO', NOW(), NOW())
         ON CONFLICT ("userId") DO UPDATE SET "updatedAt" = NOW()
         RETURNING id`,
        [userId, nombre, email, emp.departamento, emp.departamento]
      );
      employeeIds[nombre] = empResult.rows[0].id;
      console.log(`  ✅ Empleado creado: ${nombre}`);
    }

    // Step 4: Create vehicles with insurance
    console.log("\nCreando vehículos...");
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const empleadoId = employeeIds[row.responsable];

      const kmActual = row.kmUltimo || 0;
      const insuranceStatus = getInsuranceStatus(row.finSeguro);

      // Create vehicle
      const vehicleResult = await pool.query(
        `INSERT INTO "Vehicle" (
          id, "nombreInterno", marca, modelo, anio, "tipoUnidad", placas,
          "kmInicial", "kmActual", estado, "empleadoId", sucursal,
          "proximoMantenimientoKm", "createdAt", "updatedAt", "telemetryStatus", "orden"
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, $6,
          $7, $8, 'ACTIVO', $9, $10, $11, NOW(), NOW(), 'apagado', $12
        ) RETURNING id`,
        [
          row.alias,
          row.marca,
          row.modelo,
          row.anio,
          'Automóvil',
          `FC-${String(i + 1).padStart(3, '0')}-${row.anio}`,
          row.kmUltimo || 0,
          kmActual,
          empleadoId,
          row.departamento,
          row.kmProximo || null,
          i
        ]
      );
      const vehicleId = vehicleResult.rows[0].id;

      // Create insurance record
      if (row.poliza && row.inicioSeguro && row.finSeguro) {
        await pool.query(
          `INSERT INTO "Insurance" (id, "vehiculoId", aseguradora, poliza, inicio, vencimiento, costo, estado, "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            vehicleId,
            row.aseguradora,
            String(row.poliza),
            excelDateToJSDate(row.inicioSeguro),
            excelDateToJSDate(row.finSeguro),
            row.prima || 0,
            insuranceStatus
          ]
        );
      }

      // Create last maintenance record if available
      if (row.ultimoServicio && row.kmUltimo) {
        await pool.query(
          `INSERT INTO "Maintenance" (id, "vehiculoId", tipo, fecha, km, descripcion, costo, "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, 'PREVENTIVO', $2, $3, 'Último servicio registrado', 0, NOW(), NOW())`,
          [vehicleId, excelDateToJSDate(row.ultimoServicio), row.kmUltimo]
        );
      }

      console.log(`  ✅ Vehículo creado: ${row.alias} (${row.marca} ${row.modelo} ${row.anio})`);
    }

    console.log("\n🎉 ¡Importación completada exitosamente!");
    console.log(`✅ ${Object.keys(uniqueEmployees).length} empleados importados`);
    console.log(`✅ ${data.length} vehículos importados`);

  } catch (err) {
    console.error("Error durante la importación:", err);
  } finally {
    await pool.end();
  }
}

main();
