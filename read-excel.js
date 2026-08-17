const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('C:\\Users\\tonyg\\Downloads\\archivo control vehicular.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { defval: null });

console.log('Columnas encontradas:', Object.keys(data[0] || {}));
console.log('Total de filas:', data.length);
console.log('Primeras 3 filas:', JSON.stringify(data.slice(0, 3), null, 2));

fs.writeFileSync('excel_data.json', JSON.stringify(data, null, 2));
console.log('Datos guardados en excel_data.json');
