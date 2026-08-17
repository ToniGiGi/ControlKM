const { createClient } = require('@libsql/client');
const crypto = require('crypto');

async function main() {
  const client = createClient({ url: 'file:dev.db' });
  const id = crypto.randomUUID();
  try {
    await client.execute({
      sql: "INSERT INTO User (id, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
      args: [id, 'admin@qrq.com', 'password123', 'SUPER_ADMIN', new Date().toISOString(), new Date().toISOString()]
    });
    console.log("Admin user created successfully!");
  } catch(e) {
    console.error(e);
  }
}
main();
