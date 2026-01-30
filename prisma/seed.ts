import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

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
  // 3. CREAR PRODUCTOS Y VARIANTES
  // ======================================
  console.log('📦 Creando productos y variantes...');

  // Producto 1: Laptop
  const laptop = await prisma.product.create({
    data: {
      name: 'Laptop Dell XPS 15',
      description: 'Laptop profesional de alto rendimiento con pantalla 4K',
      categoryId: categorias[0].id, // Electrónica
      defaultPrice: 28999.99,
      currency: 'MXN',
      isActive: true,
      variants: {
        create: [
          {
            sku: 'DELL-XPS15-16GB-512',
            barcode: '7501234567890',
            variantName: '16GB RAM / 512GB SSD',
            isActive: true,
          },
          {
            sku: 'DELL-XPS15-32GB-1TB',
            barcode: '7501234567891',
            variantName: '32GB RAM / 1TB SSD',
            isActive: true,
          },
        ],
      },
    },
    include: { variants: true },
  });

  // Producto 2: Mouse
  const mouse = await prisma.product.create({
    data: {
      name: 'Mouse Logitech MX Master 3',
      description: 'Mouse ergonómico inalámbrico para profesionales',
      categoryId: categorias[3].id, // Accesorios
      defaultPrice: 1899.00,
      currency: 'MXN',
      isActive: true,
      variants: {
        create: [
          {
            sku: 'LOGI-MXM3-BLACK',
            barcode: '7501234567892',
            variantName: 'Negro',
            isActive: true,
          },
          {
            sku: 'LOGI-MXM3-GRAY',
            barcode: '7501234567893',
            variantName: 'Gris',
            isActive: true,
          },
        ],
      },
    },
    include: { variants: true },
  });

  // Producto 3: Teclado
  const teclado = await prisma.product.create({
    data: {
      name: 'Teclado Mecánico Keychron K2',
      description: 'Teclado mecánico compacto con switches intercambiables',
      categoryId: categorias[3].id, // Accesorios
      defaultPrice: 2499.00,
      currency: 'MXN',
      isActive: true,
      variants: {
        create: [
          {
            sku: 'KEY-K2-RED-RGB',
            barcode: '7501234567894',
            variantName: 'Red Switches / RGB',
            isActive: true,
          },
          {
            sku: 'KEY-K2-BLUE-RGB',
            barcode: '7501234567895',
            variantName: 'Blue Switches / RGB',
            isActive: true,
          },
          {
            sku: 'KEY-K2-BROWN-WHITE',
            barcode: '7501234567896',
            variantName: 'Brown Switches / White LED',
            isActive: true,
          },
        ],
      },
    },
    include: { variants: true },
  });

  // Producto 4: Monitor
  const monitor = await prisma.product.create({
    data: {
      name: 'Monitor LG UltraWide 34"',
      description: 'Monitor ultra ancho curvo para mayor productividad',
      categoryId: categorias[0].id, // Electrónica
      defaultPrice: 12999.00,
      currency: 'MXN',
      isActive: true,
      variants: {
        create: [
          {
            sku: 'LG-UW34-2K',
            barcode: '7501234567897',
            variantName: '2K 75Hz',
            isActive: true,
          },
          {
            sku: 'LG-UW34-4K',
            barcode: '7501234567898',
            variantName: '4K 60Hz',
            isActive: true,
          },
        ],
      },
    },
    include: { variants: true },
  });

  // Producto 5: Webcam
  const webcam = await prisma.product.create({
    data: {
      name: 'Webcam Logitech C920',
      description: 'Cámara web Full HD 1080p con micrófono integrado',
      categoryId: categorias[0].id, // Electrónica
      defaultPrice: 1299.00,
      currency: 'MXN',
      isActive: true,
      variants: {
        create: [
          {
            sku: 'LOGI-C920-STD',
            barcode: '7501234567899',
            variantName: 'Estándar',
            isActive: true,
          },
        ],
      },
    },
    include: { variants: true },
  });

  console.log('✅ 5 productos creados con sus variantes');

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
  // 6. CREAR PEDIDOS CON HISTORIAL DE PRECIOS
  // ======================================
  console.log('🛒 Creando pedidos con historial de precios por cliente...');

  // Pedido 1: Cliente Comercial López - Laptops con precio preferencial
  const order1 = await prisma.order.create({
    data: {
      code: 'PED-2025-001',
      clientId: clients[0].id,
      statusId: estados[0].id, // COTIZADO
      currency: 'MXN',
      notes: 'Cliente preferencial - descuento aplicado',
      items: {
        create: [
          {
            variantId: laptop.variants[0].id, // 16GB/512GB
            qty: 5,
            unitPrice: 26999.99, // Precio preferencial (descuento del precio default 28999.99)
            listPrice: 28999.99,
            currency: 'MXN',
            lineTotal: 134999.95,
            description: 'Laptop Dell XPS 15 - 16GB RAM / 512GB SSD',
          },
          {
            variantId: mouse.variants[0].id,
            qty: 5,
            unitPrice: 1699.00, // Precio preferencial
            listPrice: 1899.00,
            currency: 'MXN',
            lineTotal: 8495.00,
            description: 'Mouse Logitech MX Master 3 - Negro',
          },
        ],
      },
    },
  });

  // Actualizar totales del pedido 1
  await prisma.order.update({
    where: { id: order1.id },
    data: {
      subtotal: 143494.95,
      total: 143494.95,
    },
  });

  // Pedido 2: Distribuidora García - Pedido grande con mejores precios
  const order2 = await prisma.order.create({
    data: {
      code: 'PED-2025-002',
      clientId: clients[1].id,
      statusId: estados[1].id, // TRANSMITIDO
      currency: 'MXN',
      notes: 'Pedido mayorista - precio especial',
      items: {
        create: [
          {
            variantId: teclado.variants[0].id,
            qty: 20,
            unitPrice: 2199.00, // Precio mayorista
            listPrice: 2499.00,
            currency: 'MXN',
            lineTotal: 43980.00,
            description: 'Teclado Mecánico Keychron K2 - Red Switches / RGB',
          },
          {
            variantId: mouse.variants[1].id,
            qty: 20,
            unitPrice: 1649.00, // Precio mayorista
            listPrice: 1899.00,
            currency: 'MXN',
            lineTotal: 32980.00,
            description: 'Mouse Logitech MX Master 3 - Gris',
          },
          {
            variantId: webcam.variants[0].id,
            qty: 15,
            unitPrice: 1099.00, // Precio mayorista
            listPrice: 1299.00,
            currency: 'MXN',
            lineTotal: 16485.00,
            description: 'Webcam Logitech C920 - Estándar',
          },
        ],
      },
    },
  });

  await prisma.order.update({
    where: { id: order2.id },
    data: {
      subtotal: 93445.00,
      total: 93445.00,
    },
  });

  // Pedido 3: Supermercados El Ahorro - Monitores
  const order3 = await prisma.order.create({
    data: {
      code: 'PED-2025-003',
      clientId: clients[2].id,
      statusId: estados[2].id, // EN_CURSO
      currency: 'MXN',
      notes: 'Pedido para tiendas - entrega programada',
      items: {
        create: [
          {
            variantId: monitor.variants[0].id,
            qty: 10,
            unitPrice: 11999.00, // Precio con descuento
            listPrice: 12999.00,
            currency: 'MXN',
            lineTotal: 119990.00,
            description: 'Monitor LG UltraWide 34" - 2K 75Hz',
          },
          {
            variantId: laptop.variants[1].id,
            qty: 3,
            unitPrice: 35999.00, // Precio estándar (más alto que el default de 28999)
            listPrice: 35999.00,
            currency: 'MXN',
            lineTotal: 107997.00,
            description: 'Laptop Dell XPS 15 - 32GB RAM / 1TB SSD',
          },
        ],
      },
    },
  });

  await prisma.order.update({
    where: { id: order3.id },
    data: {
      subtotal: 227987.00,
      total: 227987.00,
    },
  });

  // Pedido 4: Tiendas Martínez - Mix de productos
  const order4 = await prisma.order.create({
    data: {
      code: 'PED-2025-004',
      clientId: clients[3].id,
      statusId: estados[0].id, // COTIZADO
      currency: 'MXN',
      notes: 'Primera compra - precio estándar',
      items: {
        create: [
          {
            variantId: teclado.variants[1].id,
            qty: 8,
            unitPrice: 2499.00, // Precio lista
            listPrice: 2499.00,
            currency: 'MXN',
            lineTotal: 19992.00,
            description: 'Teclado Mecánico Keychron K2 - Blue Switches / RGB',
          },
          {
            variantId: mouse.variants[0].id,
            qty: 8,
            unitPrice: 1899.00, // Precio lista
            listPrice: 1899.00,
            currency: 'MXN',
            lineTotal: 15192.00,
            description: 'Mouse Logitech MX Master 3 - Negro',
          },
          {
            variantId: webcam.variants[0].id,
            qty: 5,
            unitPrice: 1299.00, // Precio lista
            listPrice: 1299.00,
            currency: 'MXN',
            lineTotal: 6495.00,
            description: 'Webcam Logitech C920 - Estándar',
          },
        ],
      },
    },
  });

  await prisma.order.update({
    where: { id: order4.id },
    data: {
      subtotal: 41679.00,
      total: 41679.00,
    },
  });

  // Pedido 5: Abarrotes Don Pedro - Pedido pequeño
  const order5 = await prisma.order.create({
    data: {
      code: 'PED-2025-005',
      clientId: clients[4].id,
      statusId: estados[3].id, // ENVIADO
      currency: 'MXN',
      notes: 'Entrega urgente - precio estándar + cargo extra',
      items: {
        create: [
          {
            variantId: teclado.variants[2].id,
            qty: 3,
            unitPrice: 2599.00, // Precio con recargo por urgencia
            listPrice: 2499.00,
            currency: 'MXN',
            lineTotal: 7797.00,
            description: 'Teclado Mecánico Keychron K2 - Brown Switches / White LED',
          },
          {
            variantId: mouse.variants[1].id,
            qty: 3,
            unitPrice: 1949.00, // Precio con recargo
            listPrice: 1899.00,
            currency: 'MXN',
            lineTotal: 5847.00,
            description: 'Mouse Logitech MX Master 3 - Gris',
          },
        ],
      },
    },
  });

  await prisma.order.update({
    where: { id: order5.id },
    data: {
      subtotal: 13644.00,
      total: 13644.00,
    },
  });

  // Pedido 6: Pedido histórico de Comercial López (precio diferente)
  const order6 = await prisma.order.create({
    data: {
      code: 'PED-2024-099',
      clientId: clients[0].id,
      statusId: estados[3].id, // ENVIADO (pedido completado)
      currency: 'MXN',
      notes: 'Pedido del año pasado - historial de precios',
      createdAt: new Date('2024-12-15'),
      updatedAt: new Date('2024-12-20'),
      items: {
        create: [
          {
            variantId: laptop.variants[0].id,
            qty: 3,
            unitPrice: 27999.99, // Precio histórico diferente
            listPrice: 29999.99, // Lista histórica más alta
            currency: 'MXN',
            lineTotal: 83999.97,
            description: 'Laptop Dell XPS 15 - 16GB RAM / 512GB SSD',
          },
        ],
      },
    },
  });

  await prisma.order.update({
    where: { id: order6.id },
    data: {
      subtotal: 83999.97,
      total: 83999.97,
    },
  });

  console.log('✅ 6 pedidos creados con historial de precios por cliente');

  // ======================================
  // RESUMEN
  // ======================================
  console.log('\n📊 RESUMEN DEL SEED:');
  console.log('='.repeat(50));
  console.log(`✅ Clientes: ${clients.length}`);
  console.log(`✅ Categorías: ${categorias.length}`);
  console.log(`✅ Productos: 5`);
  console.log(`✅ Variantes: ${allVariants.length}`);
  console.log(`✅ Almacenes: 2`);
  console.log(`✅ Stock creado para: ${allVariants.length * 2} combinaciones`);
  console.log(`✅ Estados de pedidos: ${estados.length}`);
  console.log(`✅ Pedidos con historial de precios: 6`);
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
