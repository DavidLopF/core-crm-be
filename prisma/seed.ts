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

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (opcional, comentar si no deseas limpiar)
  console.log('🗑️  Limpiando datos existentes...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.inventoryStock.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.orderStatus.deleteMany({});

  // ======================================
  // 1. CREAR CLIENTES
  // ======================================
  console.log('👥 Creando clientes...');
  
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Comercial López S.A. de C.V.',
        document: 'RFC-COLO850101ABC',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Distribuidora García y Asociados',
        document: 'RFC-DIGA900215DEF',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Supermercados El Ahorro',
        document: 'RFC-SUEA950320GHI',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Tiendas Martínez',
        document: 'RFC-TIMA880712JKL',
        isActive: true,
      },
    }),
    prisma.client.create({
      data: {
        name: 'Abarrotes Don Pedro',
        document: 'RFC-ABDP920530MNO',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${clients.length} clientes creados`);

  // ======================================
  // 2. CREAR CATEGORÍAS
  // ======================================
  console.log('🏷️  Creando categorías...');
  
  const categorias = await Promise.all([
    prisma.category.create({
      data: {
        code: 'ELECTRONICA',
        name: 'Electrónica',
        description: 'Productos electrónicos y tecnología',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        code: 'ROPA',
        name: 'Ropa',
        description: 'Ropa y textiles',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        code: 'CALZADO',
        name: 'Calzado',
        description: 'Zapatos y calzado en general',
        sortOrder: 3,
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        code: 'ACCESORIOS',
        name: 'Accesorios',
        description: 'Accesorios diversos',
        sortOrder: 4,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${categorias.length} categorías creadas`);

  // ======================================
  // 2.5. IMPORTAR PRODUCTOS DESDE EXCEL
  // ======================================
  console.log('\n📦 Importando productos desde Excel...');
  
  const excelFilePath = path.join(__dirname, '../data/productos.xlsx');
  
  if (fs.existsSync(excelFilePath)) {
    console.log(`📖 Leyendo archivo: ${excelFilePath}`);
    
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // La primera fila tiene los encabezados
    const headers = rawData[0];
    
    // Los datos empiezan desde la fila 2
    const dataRows = rawData.slice(1);
    
    // Convertir las filas de datos a objetos
    const productRows = dataRows.map(row => {
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        if (header) {
          obj[header] = row[index];
        }
      });
      return obj;
    }).filter(row => {
      // Filtrar filas vacías
      return row['Código Productos'] || row['DESCRIPTION'];
    });
    
    console.log(`✅ Filas válidas para procesar: ${productRows.length}`);
    
    // Buscar categoría ACCESORIOS
    const categoriaAccesorios = categorias.find(c => c.code === 'ACCESORIOS');
    
    let productsCreated = 0;
    let productsSkipped = 0;
    
    for (const row of productRows) {
      try {
        const sku = row['Código Productos'] || `PROD-${productsCreated + 1}`;
        const description = row['DESCRIPTION'] || 'Sin descripción';
        const material = row['MATERIAL'] || '';
        const color = row['COLOR'] || '';
        const size = row['SIZE'] || '';
        const cajasQty = parseFloat(String(row['CAJA'] || 0)) || 0;
        const unitsPerBox = parseInt(String(row['CANTIDA X CAJA'] || 1)) || 1;
        const packagingUnit = row['UNIDAD DE EMPAQUE'] || '';
        
        // Validar datos mínimos
        if (!sku || !description || description === 'Sin descripción') {
          productsSkipped++;
          continue;
        }
        
        // Verificar si ya existe
        const existingVariant = await prisma.productVariant.findUnique({
          where: { sku: String(sku) }
        });
        
        if (existingVariant) {
          productsSkipped++;
          continue;
        }
        
        // Crear nombre del producto
        let productName = description;
        if (material) productName += ` - ${material}`;
        if (color) productName += ` - ${color}`;
        
        // Crear producto y variante
        await prisma.product.create({
          data: {
            name: productName,
            description: `Material: ${material}
Color: ${color}
Tamaño: ${size}
Unidades por caja: ${unitsPerBox}
Empaque: ${packagingUnit}`,
            categoryId: categoriaAccesorios?.id || null,
            defaultPrice: cajasQty > 0 ? cajasQty : 0,
            currency: 'MXN',
            isActive: true,
            variants: {
              create: {
                sku: String(sku),
                barcode: String(sku),
                variantName: size ? `${size}` : undefined,
                isActive: true,
              }
            }
          }
        });
        
        productsCreated++;
      } catch (error: any) {
        console.error(`⚠️  Error en producto: ${error.message}`);
        productsSkipped++;
      }
    }
    
    console.log(`✅ Productos importados desde Excel: ${productsCreated}`);
    console.log(`⏭️  Productos saltados: ${productsSkipped}`);
  } else {
    console.log('⚠️  No se encontró archivo Excel en /data/productos.xlsx');
    console.log('   Se omitirá la importación de productos desde Excel');
  }

  

  // ======================================
  // 3. CREAR ALMACENES
  // ======================================
  console.log('🏭 Creando almacenes...');
  
  const almacenPrincipal = await prisma.warehouse.create({
    data: {
      name: 'Almacén Principal CDMX',
      isActive: true,
    },
  });

  const almacenSecundario = await prisma.warehouse.create({
    data: {
      name: 'Almacén Monterrey',
      isActive: true,
    },
  });

  console.log('✅ 2 almacenes creados');

  // ======================================
  // 4. CREAR INVENTARIO
  // ======================================
  console.log('📊 Creando inventario inicial...');
  
  // Obtener todas las variantes
  const allVariants = await prisma.productVariant.findMany();

  // Crear stock para cada variante en ambos almacenes
  for (const variant of allVariants) {
    await prisma.inventoryStock.create({
      data: {
        variantId: variant.id,
        warehouseId: almacenPrincipal.id,
        qtyOnHand: Math.floor(Math.random() * 100) + 20, // Entre 20 y 120 unidades
        qtyReserved: Math.floor(Math.random() * 10), // Entre 0 y 10 unidades reservadas
      },
    });

    await prisma.inventoryStock.create({
      data: {
        variantId: variant.id,
        warehouseId: almacenSecundario.id,
        qtyOnHand: Math.floor(Math.random() * 50) + 10, // Entre 10 y 60 unidades
        qtyReserved: Math.floor(Math.random() * 5), // Entre 0 y 5 unidades reservadas
      },
    });
  }

  console.log('✅ Inventario creado para todas las variantes');

  // ======================================
  // 5. CREAR ESTADOS DE PEDIDOS
  // ======================================
  console.log('📋 Creando estados de pedidos...');
  
  const estados = await Promise.all([
    prisma.orderStatus.create({
      data: {
        code: 'COTIZADO',
        label: 'Cotizado',
        sortOrder: 1,
        isActive: true,
      },
    }),
    prisma.orderStatus.create({
      data: {
        code: 'TRANSMITIDO',
        label: 'Transmitido',
        sortOrder: 2,
        isActive: true,
      },
    }),
    prisma.orderStatus.create({
      data: {
        code: 'EN_CURSO',
        label: 'En Curso',
        sortOrder: 3,
        isActive: true,
      },
    }),
    prisma.orderStatus.create({
      data: {
        code: 'ENVIADO',
        label: 'Enviado',
        sortOrder: 4,
        isActive: true,
      },
    }),
    prisma.orderStatus.create({
      data: {
        code: 'CANCELADO',
        label: 'Cancelado',
        sortOrder: 5,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Estados de pedidos creados');

  // ======================================
  // 6. CREAR PEDIDOS (COMENTADO - DESCOMENTAR CUANDO TENGAS PRODUCTOS ESPECÍFICOS)
  // ======================================
  console.log('⏭️  Creación de pedidos omitida (activar manualmente si es necesario)');
  
  /*
  // NOTA: Esta sección está comentada porque hace referencia a productos específicos
  // que no están en el Excel. Si deseas crear pedidos de ejemplo, debes:
  // 1. Obtener las variantes reales desde la BD
  // 2. Usar los SKUs correctos de tu Excel
  
  console.log('🛒 Creando pedidos con historial de precios por cliente...');

  // Ejemplo de cómo obtener variantes para crear pedidos:
  const variantesEjemplo = await prisma.productVariant.findMany({
    take: 5,
    include: { product: true }
  });

  if (variantesEjemplo.length >= 3) {
    const order1 = await prisma.order.create({
      data: {
        code: 'PED-2025-001',
        clientId: clients[0].id,
        statusId: estados[0].id,
        currency: 'MXN',
        notes: 'Pedido de ejemplo',
        items: {
          create: [
            {
              variantId: variantesEjemplo[0].id,
              qty: 5,
              unitPrice: 100,
              listPrice: 120,
              currency: 'MXN',
              lineTotal: 500,
              description: variantesEjemplo[0].product.name,
            },
          ],
        },
      },
    });
    
    await prisma.order.update({
      where: { id: order1.id },
      data: { subtotal: 500, total: 500 },
    });
  }
  */

  // ======================================
  // RESUMEN
  // ======================================
  console.log('\n📊 RESUMEN DEL SEED:');
  console.log('='.repeat(50));
  console.log(`✅ Clientes: ${clients.length}`);
  console.log(`✅ Categorías: ${categorias.length}`);
  
  const totalProducts = await prisma.product.count();
  const totalVariants = await prisma.productVariant.count();
  console.log(`✅ Productos: ${totalProducts}`);
  console.log(`✅ Variantes: ${totalVariants}`);
  console.log(`✅ Almacenes: 2`);
  console.log(`✅ Stock creado para: ${totalVariants * 2} combinaciones`);
  console.log(`✅ Estados de pedidos: ${estados.length}`);
  console.log('='.repeat(50));
  console.log('\n✨ Seed completado exitosamente!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
