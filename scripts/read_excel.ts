import * as xlsx from 'xlsx';

const filePath = 'C:\\Users\\tonyg\\Downloads\\archivo control vehicular.xlsx';
const workbook = xlsx.readFile(filePath);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(sheet);

console.log('Sheet Name:', sheetName);
console.log('Total Rows:', data.length);
console.log('First Row (Columns):');
console.log(JSON.stringify(data[0], null, 2));

console.log('Second Row:');
console.log(JSON.stringify(data[1], null, 2));
