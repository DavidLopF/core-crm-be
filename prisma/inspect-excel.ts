import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Script auxiliar para inspeccionar las columnas del archivo Excel
 * Uso: ts-node prisma/inspect-excel.ts
 */

const excelFilePath = path.join(__dirname, '../data/productos.xlsx');

if (!fs.existsSync(excelFilePath)) {
  console.error(`❌ No se encontró el archivo: ${excelFilePath}`);
  console.log('Por favor, coloca tu archivo Excel en: /data/productos.xlsx');
  process.exit(1);
}

console.log(`📖 Leyendo archivo: ${excelFilePath}\n`);

// Leer el archivo Excel
const workbook = XLSX.readFile(excelFilePath);

console.log('📊 Hojas disponibles:');
workbook.SheetNames.forEach((name, index) => {
  console.log(`  ${index + 1}. ${name}`);
});

console.log('\n📋 Analizando primera hoja...\n');

const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

console.log('📄 Información del worksheet:');
console.log('  Rango:', worksheet['!ref']);

// Obtener el rango del worksheet
const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
console.log(`  Filas: ${range.s.r} a ${range.e.r} (total: ${range.e.r - range.s.r + 1})`);
console.log(`  Columnas: ${range.s.c} a ${range.e.c} (total: ${range.e.c - range.s.c + 1})`);

// Mostrar algunas celdas específicas
console.log('\n📌 Primeras celdas del worksheet:');
for (let row = range.s.r; row <= Math.min(range.s.r + 4, range.e.r); row++) {
  console.log(`\n=== Fila ${row + 1} ===`);
  for (let col = range.s.c; col <= Math.min(range.s.c + 12, range.e.c); col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[cellAddress];
    if (cell && cell.v !== undefined && cell.v !== '') {
      console.log(`  ${cellAddress}: ${cell.v}`);
    }
  }
}

// Convertir a JSON con diferentes opciones
console.log('\n\n� Intentando con defRange (desde B1):');
const rowsFromB: any[] = XLSX.utils.sheet_to_json(worksheet, { 
  header: 1,
  range: 'B1',
  defval: null
});

console.log(`Total de filas: ${rowsFromB.length}`);
if (rowsFromB.length > 0) {
  console.log('\nPrimeras 3 filas:');
  rowsFromB.slice(0, 3).forEach((row, index) => {
    console.log(`Fila ${index + 1}:`, row);
  });
}

console.log('\n✅ Inspección completada!');
