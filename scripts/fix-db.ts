import fs from 'fs'

const content = fs.readFileSync('app/actions/db.ts', 'utf-8')
const lines = content.split('\n')

// We know everything up to line 582 is correct.
// Line 582 is the end of recientesGastos.forEach inside getAlerts()
const goodLines = lines.slice(0, 582)

// Now we append the rest of getAlerts and then getMonthlyExpenses
const restOfFile = `
  const recientesMantenimientos = await prisma.maintenance.findMany({
    where: { estado: 'PENDIENTE' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { vehiculo: true }
  });

  recientesMantenimientos.forEach(m => {
    generatedAlerts.push({
      id: \`mantenimiento-pendiente-\${m.id}\`,
      vehiculoId: m.vehiculoId,
      tipo: 'Mantenimiento por Aprobar',
      mensaje: \`Nuevo mantenimiento \${m.tipo} por $\${m.costo.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})} para \${m.vehiculo?.nombreInterno || m.vehiculo?.marca}\`,
      severidad: 'media',
      href: '/mantenimientos',
      fecha: m.createdAt
    });
  });

  return generatedAlerts;
}

export async function getMonthlyExpenses() {
  const expenses = await prisma.expense.findMany();
  
  const fuelRequests = await prisma.fuelRequest.findMany({
    where: { estado: 'APROBADA' }
  });

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dataMap = new Map();
  
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    let d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    let monthName = months[d.getMonth()];
    dataMap.set(\`\${d.getFullYear()}-\${d.getMonth()}\`, {
      name: monthName,
      Gasolina: 0,
      Mantenimiento: 0,
      Otros: 0,
      sortKey: d.getTime()
    });
  }

  expenses.forEach(e => {
    const d = e.fecha;
    const key = \`\${d.getFullYear()}-\${d.getMonth()}\`;
    if (dataMap.has(key)) {
      const entry = dataMap.get(key);
      if (e.categoria === 'GASOLINA') entry.Gasolina += e.monto;
      else if (e.categoria === 'MANTENIMIENTO') entry.Mantenimiento += e.monto;
      else entry.Otros += e.monto;
    }
  });

  fuelRequests.forEach(fr => {
    const d = fr.createdAt; // or fechaSolicitud
    const key = \`\${d.getFullYear()}-\${d.getMonth()}\`;
    if (dataMap.has(key)) {
      const entry = dataMap.get(key);
      entry.Gasolina += (fr.costoGasolina || 0);
      entry.Otros += (fr.costoCasetas || 0) + (fr.costoComidas || 0);
    }
  });

  const result = Array.from(dataMap.values()).sort((a, b) => a.sortKey - b.sortKey).map(item => {
    const { sortKey, ...rest } = item;
    return rest;
  });

  return result;
}
`

fs.writeFileSync('app/actions/db.ts', goodLines.join('\n') + restOfFile)
console.log('Fixed db.ts!')
