import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ExcelRow {
  PRODUCT_PICTURE?: string;
  SIZE?: string;
  DESCRIPTION?: string;
  MATERIAL?: string;
  COLORFIGURE?: string;
  COLOR?: string;
  CAJA?: number;
  'CAJA POR CAJA'?: number;
  'ORDEN DE COMPRA'?: string;
  'Código Proveedor'?: string;
  [key: string]: any;
}

async function main() {
  console.log('🌱 Iniciando seed de productos desde Excel...');

  const excelFilePath = path.join(__dirname, '../data/productos.xlsx');

  if (!fs.existsSync(excelFilePath)) {
    console.error(`❌ No se encontró el archivo: ${excelFilePath}`);
    console.log('Por favor, coloca tu archivo Excel en: /data/productos.xlsx');
    process.exit(1);
  }

  console.log(`📖 Leyendo archivo: ${excelFilePath}`);

  const workbook = XLSX.readFile(excelFilePath);
  const sheetName = workbook.SheetNames[0]; // Primera hoja
  const worksheet = workbook.Sheets[sheetName];
  
  // Convertir a JSON sin encabezados para acceder a todas las filas
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`📊 Total de filas en Excel: ${rawData.length}`);
  
  // La primera fila (índice 0) tiene los encabezados reales
  const headers = rawData[0];
  console.log('📋 Encabezados detectados:', headers.filter((h: any) => h).join(', '));
  
  // Los datos empiezan desde la fila 2 (índice 1)
  const dataRows = rawData.slice(1); // Desde la fila 2 en adelante
  
  // Convertir las filas de datos a objetos usando los encabezados
  const rows: ExcelRow[] = dataRows.map(row => {
    const obj: any = {};
    headers.forEach((header: string, index: number) => {
      if (header) { // Solo si el encabezado existe
        obj[header] = row[index];
      }
    });
    return obj;
  }).filter(row => {
    // Filtrar filas vacías (que no tengan SKU o descripción)
    return row['Código Productos'] || row['DESCRIPTION'];
  });

  console.log(`✅ Filas válidas para procesar: ${rows.length}`);


  let defaultCategory = await prisma.category.findFirst({
    where: { code: 'ACCESORIOS' }
  });

  if (!defaultCategory) {
    console.log('📁 Creando categoría por defecto: ACCESORIOS');
    defaultCategory = await prisma.category.create({
      data: {
        code: 'ACCESORIOS',
        name: 'Accesorios',
        description: 'Accesorios diversos',
        sortOrder: 1,
        isActive: true,
      }
    });
  }

  // Crear o obtener almacén por defecto
  let defaultWarehouse = await prisma.warehouse.findFirst({
    where: { name: 'Almacén Principal' }
  });

  if (!defaultWarehouse) {
    console.log('🏢 Creando almacén por defecto');
    defaultWarehouse = await prisma.warehouse.create({
      data: {
        name: 'Almacén Principal',
        isActive: true,
      }
    });
  }

  console.log('🔄 Procesando productos...');

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const [index, row] of rows.entries()) {
    try {
      // Leer valores usando los nombres de columnas del Excel
      const sku = row['Código Productos'] || `PROD-${index + 1}`;
      const description = row['DESCRIPTION'] || 'Sin descripción';
      const material = row['MATERIAL'] || '';
      const color = row['COLOR'] || '';
      const colorPicture = row['COLORPICTURE'] || '';
      const size = row['SIZE'] || '';
      const productPicture = row['PRODUCT PICTURE'] || '';
      const cajasQty = parseFloat(String(row['CAJA'] || 0)) || 0;
      const unitsPerBox = parseInt(String(row['CANTIDA X CAJA'] || 1)) || 1;
      const packagingUnit = row['UNIDAD DE EMPAQUE'] || '';
      
      // Validar que tenga al menos SKU y descripción
      if (!sku || sku === `PROD-${index + 1}` || !description || description === 'Sin descripción') {
        console.log(`⏭️  Saltando fila ${index + 1}: Faltan datos mínimos (SKU o descripción)`);
        skippedCount++;
        continue;
      }

      // Crear nombre del producto combinando descripción, material y color
      let productName = description;
      if (material) productName += ` - ${material}`;
      if (color) productName += ` - ${color}`;

      // Verificar si ya existe este SKU
      const existingVariant = await prisma.productVariant.findUnique({
        where: { sku: String(sku) }
      });

      if (existingVariant) {
        console.log(`⏭️  Saltando SKU duplicado: ${sku}`);
        skippedCount++;
        continue;
      }
      
      // Calcular precio: si CAJA es el número de cajas, podrías necesitar ajustar esto
      // Por ahora usamos cajasQty como precio base
      const defaultPrice = cajasQty > 0 ? cajasQty : 0;

      // Crear producto y variante
      const product = await prisma.product.create({
        data: {
          name: productName,
          description: `Material: ${material}
Color: ${color}
Tamaño: ${size}
Unidades por caja: ${unitsPerBox}
Empaque: ${packagingUnit}
${colorPicture ? `Color/Figura: ${colorPicture}` : ''}`,
          categoryId: defaultCategory.id,
          defaultPrice: defaultPrice,
          currency: 'MXN',
          isActive: true,
          variants: {
            create: {
              sku: String(sku),
              barcode: String(sku), // Usar el mismo SKU como código de barras
              variantName: size ? `${size}` : undefined,
              isActive: true,
              stocks: {
                create: {
                  warehouseId: defaultWarehouse.id,
                  qtyOnHand: 0,
                  qtyReserved: 0,
                }
              }
            }
          }
        },
        include: {
          variants: true
        }
      });

      createdCount++;
      console.log(`✅ [${createdCount}] Producto creado: ${productName} (SKU: ${sku})`);

    } catch (error: any) {
      errorCount++;
      console.error(`❌ Error en fila ${index + 1}:`, error.message);
      // Continuar con la siguiente fila en caso de error
      continue;
    }
  }

  console.log('\n📈 Resumen:');
  console.log(`✅ Productos creados: ${createdCount}`);
  console.log(`⏭️  Productos saltados (duplicados): ${skippedCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log('\n✨ Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error al ejecutar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
