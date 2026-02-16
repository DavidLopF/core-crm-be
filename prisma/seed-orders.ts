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

async function seedOrders() {
  console.log('🛒 Iniciando seed de órdenes...\n');

  // Limpiar órdenes existentes
  console.log('🗑️  Limpiando órdenes existentes...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});

  // Obtener datos necesarios
  const clients = await prisma.client.findMany({ where: { isActive: true } });
  const statuses = await prisma.orderStatus.findMany({ orderBy: { sortOrder: 'asc' } });
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true },
    include: { product: true },
  });

  if (clients.length === 0) {
    console.error('❌ No hay clientes en el sistema. Ejecuta primero el seed principal.');
    return;
  }

  if (statuses.length === 0) {
    console.error('❌ No hay estados de pedido en el sistema. Ejecuta primero el seed principal.');
    return;
  }

  if (variants.length === 0) {
    console.error('❌ No hay variantes de producto en el sistema. Ejecuta primero el seed principal.');
    return;
  }

  console.log(`📊 Datos disponibles:`);
  console.log(`   - Clientes: ${clients.length}`);
  console.log(`   - Estados: ${statuses.length}`);
  console.log(`   - Variantes de producto: ${variants.length}\n`);

  // Mapear estados por código
  const statusMap = statuses.reduce((acc, status) => {
    acc[status.code] = status;
    return acc;
  }, {} as Record<string, typeof statuses[0]>);

  // Función helper para obtener variantes aleatorias
  const getRandomVariants = (count: number) => {
    const shuffled = [...variants].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  };

  // Función helper para calcular total de items
  const calculateOrderTotal = (items: { qty: number; unitPrice: number }[]) => {
    return items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  };

  // ========================================
  // PEDIDO 1: Cotizado - Comercial López
  // ========================================
  console.log('📝 Creando Orden 1 (Cotizado)...');
  const orderItems1 = [
    { variant: variants.find(v => v.id === 1), qty: 10, unitPrice: 1.0 },   // Aguja Magica
    { variant: variants.find(v => v.id === 2), qty: 50, unitPrice: 5.0 },   // Imán Redondo 15x5mm
    { variant: variants.find(v => v.id === 9), qty: 5, unitPrice: 1.0 },    // Galón Metalizado 25mm
    { variant: variants.find(v => v.id === 22), qty: 20, unitPrice: 2.0 },  // Argolla Lavero Dorado
  ].filter(item => item.variant);

  const total1 = calculateOrderTotal(orderItems1.map(i => ({ qty: i.qty, unitPrice: i.unitPrice })));

  const order1 = await prisma.order.create({
    data: {
      code: 'PED-2026-0001',
      clientId: clients[0].id,
      statusId: statusMap['COTIZADO']?.id || statuses[0].id,
      currency: 'MXN',
      subtotal: total1,
      total: total1,
      notes: 'Pedido inicial para nueva tienda en CDMX',
      items: {
        create: orderItems1.map(item => ({
          variantId: item.variant!.id,
          qty: item.qty,
          unitPrice: item.unitPrice,
          listPrice: item.variant!.product.defaultPrice,
          currency: 'MXN',
          lineTotal: item.qty * item.unitPrice,
          description: item.variant!.product.name,
        })),
      },
    },
  });
  console.log(`   ✅ Orden ${order1.code} creada - Total: $${total1} MXN`);

  // ========================================
  // PEDIDO 2: Transmitido - Distribuidora García
  // ========================================
  console.log('📝 Creando Orden 2 (Transmitido)...');
  const orderItems2 = [
    { variant: variants.find(v => v.id === 3), qty: 30, unitPrice: 5.0 },   // Imán Redondo 18x4mm
    { variant: variants.find(v => v.id === 4), qty: 100, unitPrice: 4.5 },  // Imán Redondo 12x3mm (con descuento)
    { variant: variants.find(v => v.id === 24), qty: 15, unitPrice: 1.0 },  // Fleco 5mm dorado
    { variant: variants.find(v => v.id === 25), qty: 15, unitPrice: 1.0 },  // Fleco 10mm dorado
    { variant: variants.find(v => v.id === 30), qty: 25, unitPrice: 2.0 },  // Borla 8cm dorado
  ].filter(item => item.variant);

  const total2 = calculateOrderTotal(orderItems2.map(i => ({ qty: i.qty, unitPrice: i.unitPrice })));

  const order2 = await prisma.order.create({
    data: {
      code: 'PED-2026-0002',
      clientId: clients[1]?.id || clients[0].id,
      statusId: statusMap['TRANSMITIDO']?.id || statuses[1]?.id || statuses[0].id,
      currency: 'MXN',
      subtotal: total2,
      total: total2,
      notes: 'Pedido urgente - Cliente frecuente con descuento especial',
      items: {
        create: orderItems2.map(item => ({
          variantId: item.variant!.id,
          qty: item.qty,
          unitPrice: item.unitPrice,
          listPrice: item.variant!.product.defaultPrice,
          currency: 'MXN',
          lineTotal: item.qty * item.unitPrice,
          description: item.variant!.product.name,
        })),
      },
    },
  });
  console.log(`   ✅ Orden ${order2.code} creada - Total: $${total2} MXN`);

  // ========================================
  // PEDIDO 3: En Curso - Supermercados El Ahorro
  // ========================================
  console.log('📝 Creando Orden 3 (En Curso)...');
  const orderItems3 = [
    { variant: variants.find(v => v.id === 31), qty: 200, unitPrice: 0.9 },  // Ojos plásticos 5mm
    { variant: variants.find(v => v.id === 32), qty: 200, unitPrice: 0.9 },  // Ojos plásticos 6mm
    { variant: variants.find(v => v.id === 33), qty: 150, unitPrice: 0.9 },  // Ojos plásticos 7mm
    { variant: variants.find(v => v.id === 34), qty: 150, unitPrice: 0.9 },  // Ojos plásticos 8mm
    { variant: variants.find(v => v.id === 38), qty: 50, unitPrice: 1.0 },   // Cordón de yute 1mm
    { variant: variants.find(v => v.id === 39), qty: 50, unitPrice: 1.0 },   // Cordón de yute 2mm
  ].filter(item => item.variant);

  const total3 = calculateOrderTotal(orderItems3.map(i => ({ qty: i.qty, unitPrice: i.unitPrice })));

  const order3 = await prisma.order.create({
    data: {
      code: 'PED-2026-0003',
      clientId: clients[2]?.id || clients[0].id,
      statusId: statusMap['EN_CURSO']?.id || statuses[2]?.id || statuses[0].id,
      currency: 'MXN',
      subtotal: total3,
      total: total3,
      notes: 'Pedido mayorista - Preparando en almacén',
      items: {
        create: orderItems3.map(item => ({
          variantId: item.variant!.id,
          qty: item.qty,
          unitPrice: item.unitPrice,
          listPrice: item.variant!.product.defaultPrice,
          currency: 'MXN',
          lineTotal: item.qty * item.unitPrice,
          description: item.variant!.product.name,
        })),
      },
    },
  });
  console.log(`   ✅ Orden ${order3.code} creada - Total: $${total3} MXN`);

  // ========================================
  // PEDIDO 4: Enviado - Tiendas Martínez
  // ========================================
  console.log('📝 Creando Orden 4 (Enviado)...');
  const orderItems4 = [
    { variant: variants.find(v => v.id === 44), qty: 20, unitPrice: 1.0 },   // Cordón Chino negro
    { variant: variants.find(v => v.id === 45), qty: 20, unitPrice: 1.0 },   // Cordón Chino rojo
    { variant: variants.find(v => v.id === 46), qty: 20, unitPrice: 1.0 },   // Cordón Chino blanco
    { variant: variants.find(v => v.id === 47), qty: 10, unitPrice: 1.0 },   // Cuenta Madera Café 18x20mm
    { variant: variants.find(v => v.id === 48), qty: 10, unitPrice: 1.0 },   // Cuenta Madera Café 24x25mm
    { variant: variants.find(v => v.id === 56), qty: 15, unitPrice: 1.0 },   // Argolla Madera Café 4cm
  ].filter(item => item.variant);

  const total4 = calculateOrderTotal(orderItems4.map(i => ({ qty: i.qty, unitPrice: i.unitPrice })));

  const order4 = await prisma.order.create({
    data: {
      code: 'PED-2026-0004',
      clientId: clients[3]?.id || clients[0].id,
      statusId: statusMap['ENVIADO']?.id || statuses[3]?.id || statuses[0].id,
      currency: 'MXN',
      subtotal: total4,
      total: total4,
      notes: 'Enviado por paquetería - Guía: MX123456789',
      items: {
        create: orderItems4.map(item => ({
          variantId: item.variant!.id,
          qty: item.qty,
          unitPrice: item.unitPrice,
          listPrice: item.variant!.product.defaultPrice,
          currency: 'MXN',
          lineTotal: item.qty * item.unitPrice,
          description: item.variant!.product.name,
        })),
      },
    },
  });
  console.log(`   ✅ Orden ${order4.code} creada - Total: $${total4} MXN`);

  // ========================================
  // PEDIDO 5: Cancelado - Abarrotes Don Pedro
  // ========================================
  console.log('📝 Creando Orden 5 (Cancelado)...');
  const orderItems5 = [
    { variant: variants.find(v => v.id === 53), qty: 30, unitPrice: 2.0 },   // Cinta Yute 3.8cm
    { variant: variants.find(v => v.id === 54), qty: 10, unitPrice: 2.0 },   // Cinta Yute 50cm
  ].filter(item => item.variant);

  const total5 = calculateOrderTotal(orderItems5.map(i => ({ qty: i.qty, unitPrice: i.unitPrice })));

  const order5 = await prisma.order.create({
    data: {
      code: 'PED-2026-0005',
      clientId: clients[4]?.id || clients[0].id,
      statusId: statusMap['CANCELADO']?.id || statuses[4]?.id || statuses[0].id,
      currency: 'MXN',
      subtotal: total5,
      total: total5,
      notes: 'Cancelado por el cliente - Cambio de proveedor',
      items: {
        create: orderItems5.map(item => ({
          variantId: item.variant!.id,
          qty: item.qty,
          unitPrice: item.unitPrice,
          listPrice: item.variant!.product.defaultPrice,
          currency: 'MXN',
          lineTotal: item.qty * item.unitPrice,
          description: item.variant!.product.name,
        })),
      },
    },
  });
  console.log(`   ✅ Orden ${order5.code} creada - Total: $${total5} MXN`);

  // ========================================
  // PEDIDO 6: Cotizado - Pedido grande con variedad
  // ========================================
  console.log('📝 Creando Orden 6 (Cotizado - Grande)...');
  const orderItems6 = [
    { variant: variants.find(v => v.id === 5), qty: 40, unitPrice: 5.0 },    // Imán Redondo 20x3mm
    { variant: variants.find(v => v.id === 6), qty: 25, unitPrice: 5.0 },    // Imán Redondo 24x4mm
    { variant: variants.find(v => v.id === 7), qty: 60, unitPrice: 5.0 },    // Imán Redondo 18x3mm
    { variant: variants.find(v => v.id === 8), qty: 80, unitPrice: 5.0 },    // Imán Redondo 15x3mm
    { variant: variants.find(v => v.id === 10), qty: 10, unitPrice: 1.0 },   // Galón Metalizado 40mm
    { variant: variants.find(v => v.id === 12), qty: 20, unitPrice: 1.0 },   // Galón Metalizado 20mm
    { variant: variants.find(v => v.id === 13), qty: 20, unitPrice: 1.0 },   // Galón Metalizado 15mm
    { variant: variants.find(v => v.id === 62), qty: 100, unitPrice: 1.0 },  // Broche Perico Dorado
    { variant: variants.find(v => v.id === 63), qty: 100, unitPrice: 1.0 },  // Broche Perico Plata
  ].filter(item => item.variant);

  const total6 = calculateOrderTotal(orderItems6.map(i => ({ qty: i.qty, unitPrice: i.unitPrice })));

  const order6 = await prisma.order.create({
    data: {
      code: 'PED-2026-0006',
      clientId: clients[0].id,
      statusId: statusMap['COTIZADO']?.id || statuses[0].id,
      currency: 'MXN',
      subtotal: total6,
      total: total6,
      notes: 'Cotización para evento especial - Esperando aprobación',
      items: {
        create: orderItems6.map(item => ({
          variantId: item.variant!.id,
          qty: item.qty,
          unitPrice: item.unitPrice,
          listPrice: item.variant!.product.defaultPrice,
          currency: 'MXN',
          lineTotal: item.qty * item.unitPrice,
          description: item.variant!.product.name,
        })),
      },
    },
  });
  console.log(`   ✅ Orden ${order6.code} creada - Total: $${total6} MXN`);

  // ========================================
  // PEDIDO 7: En Curso - Materiales para manualidades
  // ========================================
  console.log('📝 Creando Orden 7 (En Curso)...');
  const orderItems7 = [
    { variant: variants.find(v => v.id === 26), qty: 10, unitPrice: 1.0 },   // Fleco 5cm Rojo
    { variant: variants.find(v => v.id === 27), qty: 10, unitPrice: 2.0 },   // Fleco 10cm Rojo
    { variant: variants.find(v => v.id === 28), qty: 10, unitPrice: 1.0 },   // Fleco 5cm Blanco
    { variant: variants.find(v => v.id === 29), qty: 10, unitPrice: 1.5 },   // Fleco 10cm Blanco
    { variant: variants.find(v => v.id === 40), qty: 30, unitPrice: 1.0 },   // Cordón de yute 3mm
    { variant: variants.find(v => v.id === 41), qty: 20, unitPrice: 2.0 },   // Cordón de yute 4mm
    { variant: variants.find(v => v.id === 42), qty: 20, unitPrice: 2.0 },   // Cordón de yute 5mm
  ].filter(item => item.variant);

  const total7 = calculateOrderTotal(orderItems7.map(i => ({ qty: i.qty, unitPrice: i.unitPrice })));

  const order7 = await prisma.order.create({
    data: {
      code: 'PED-2026-0007',
      clientId: clients[1]?.id || clients[0].id,
      statusId: statusMap['EN_CURSO']?.id || statuses[2]?.id || statuses[0].id,
      currency: 'MXN',
      subtotal: total7,
      total: total7,
      notes: 'Materiales para taller de manualidades - Entrega parcial permitida',
      items: {
        create: orderItems7.map(item => ({
          variantId: item.variant!.id,
          qty: item.qty,
          unitPrice: item.unitPrice,
          listPrice: item.variant!.product.defaultPrice,
          currency: 'MXN',
          lineTotal: item.qty * item.unitPrice,
          description: item.variant!.product.name,
        })),
      },
    },
  });
  console.log(`   ✅ Orden ${order7.code} creada - Total: $${total7} MXN`);

  // ========================================
  // PEDIDO 8: Transmitido - Cuentas y argollas
  // ========================================
  console.log('📝 Creando Orden 8 (Transmitido)...');
  const orderItems8 = [
    { variant: variants.find(v => v.id === 49), qty: 5, unitPrice: 1.0 },    // Cuenta Madera Café Claro 18x20mm
    { variant: variants.find(v => v.id === 50), qty: 5, unitPrice: 1.0 },    // Cuenta Madera Café Claro 24x25mm
    { variant: variants.find(v => v.id === 51), qty: 5, unitPrice: 1.0 },    // Cuenta Madera Beige 18x20mm
    { variant: variants.find(v => v.id === 52), qty: 5, unitPrice: 1.0 },    // Cuenta Madera Beige 24x25mm
    { variant: variants.find(v => v.id === 57), qty: 10, unitPrice: 1.0 },   // Argolla Madera Café 6cm
    { variant: variants.find(v => v.id === 58), qty: 10, unitPrice: 1.0 },   // Argolla Madera Café 8cm
    { variant: variants.find(v => v.id === 59), qty: 15, unitPrice: 1.0 },   // Argolla Madera Beige 4cm
    { variant: variants.find(v => v.id === 60), qty: 10, unitPrice: 1.0 },   // Argolla Madera Beige 6cm
    { variant: variants.find(v => v.id === 61), qty: 10, unitPrice: 1.0 },   // Argolla Madera Beige 8cm
  ].filter(item => item.variant);

  const total8 = calculateOrderTotal(orderItems8.map(i => ({ qty: i.qty, unitPrice: i.unitPrice })));

  const order8 = await prisma.order.create({
    data: {
      code: 'PED-2026-0008',
      clientId: clients[2]?.id || clients[0].id,
      statusId: statusMap['TRANSMITIDO']?.id || statuses[1]?.id || statuses[0].id,
      currency: 'MXN',
      subtotal: total8,
      total: total8,
      notes: 'Para tienda de artesanías - Entrega en sucursal',
      items: {
        create: orderItems8.map(item => ({
          variantId: item.variant!.id,
          qty: item.qty,
          unitPrice: item.unitPrice,
          listPrice: item.variant!.product.defaultPrice,
          currency: 'MXN',
          lineTotal: item.qty * item.unitPrice,
          description: item.variant!.product.name,
        })),
      },
    },
  });
  console.log(`   ✅ Orden ${order8.code} creada - Total: $${total8} MXN`);

  // ========================================
  // PEDIDO 9: Enviado - Argollas para engarce
  // ========================================
  console.log('📝 Creando Orden 9 (Enviado)...');
  const orderItems9 = [
    { variant: variants.find(v => v.id === 64), qty: 50, unitPrice: 1.0 },   // Argolla engarce Dorado
    { variant: variants.find(v => v.id === 65), qty: 50, unitPrice: 1.0 },   // Argolla engarce Níquel
    { variant: variants.find(v => v.id === 23), qty: 30, unitPrice: 2.0 },   // Argolla Lavero Plata
  ].filter(item => item.variant);

  const total9 = calculateOrderTotal(orderItems9.map(i => ({ qty: i.qty, unitPrice: i.unitPrice })));

  const order9 = await prisma.order.create({
    data: {
      code: 'PED-2026-0009',
      clientId: clients[3]?.id || clients[0].id,
      statusId: statusMap['ENVIADO']?.id || statuses[3]?.id || statuses[0].id,
      currency: 'MXN',
      subtotal: total9,
      total: total9,
      notes: 'Entregado - Guía: MX987654321 - Firmado por recepción',
      items: {
        create: orderItems9.map(item => ({
          variantId: item.variant!.id,
          qty: item.qty,
          unitPrice: item.unitPrice,
          listPrice: item.variant!.product.defaultPrice,
          currency: 'MXN',
          lineTotal: item.qty * item.unitPrice,
          description: item.variant!.product.name,
        })),
      },
    },
  });
  console.log(`   ✅ Orden ${order9.code} creada - Total: $${total9} MXN`);

  // ========================================
  // PEDIDO 10: Cotizado - Ojos plásticos variados
  // ========================================
  console.log('📝 Creando Orden 10 (Cotizado)...');
  const orderItems10 = [
    { variant: variants.find(v => v.id === 35), qty: 100, unitPrice: 1.0 },  // Ojos plásticos 10mm
    { variant: variants.find(v => v.id === 36), qty: 100, unitPrice: 1.0 },  // Ojos plásticos 12mm
    { variant: variants.find(v => v.id === 37), qty: 80, unitPrice: 1.0 },   // Ojos plásticos 14mm
    { variant: variants.find(v => v.id === 43), qty: 25, unitPrice: 2.0 },   // Cordón de yute 6mm
  ].filter(item => item.variant);

  const total10 = calculateOrderTotal(orderItems10.map(i => ({ qty: i.qty, unitPrice: i.unitPrice })));

  const order10 = await prisma.order.create({
    data: {
      code: 'PED-2026-0010',
      clientId: clients[4]?.id || clients[0].id,
      statusId: statusMap['COTIZADO']?.id || statuses[0].id,
      currency: 'MXN',
      subtotal: total10,
      total: total10,
      notes: 'Cotización para fabricante de peluches - Precio a negociar',
      items: {
        create: orderItems10.map(item => ({
          variantId: item.variant!.id,
          qty: item.qty,
          unitPrice: item.unitPrice,
          listPrice: item.variant!.product.defaultPrice,
          currency: 'MXN',
          lineTotal: item.qty * item.unitPrice,
          description: item.variant!.product.name,
        })),
      },
    },
  });
  console.log(`   ✅ Orden ${order10.code} creada - Total: $${total10} MXN`);

  // ========================================
  // RESUMEN
  // ========================================
  const totalOrders = await prisma.order.count();
  const totalItems = await prisma.orderItem.count();
  const ordersByStatus = await prisma.order.groupBy({
    by: ['statusId'],
    _count: true,
  });

  console.log('\n📊 RESUMEN DE ÓRDENES CREADAS:');
  console.log('='.repeat(50));
  console.log(`✅ Total de órdenes: ${totalOrders}`);
  console.log(`✅ Total de items: ${totalItems}`);
  console.log('\n📋 Órdenes por estado:');
  
  for (const group of ordersByStatus) {
    const status = statuses.find(s => s.id === group.statusId);
    console.log(`   - ${status?.label || 'Desconocido'}: ${group._count}`);
  }
  
  const grandTotal = total1 + total2 + total3 + total4 + total5 + total6 + total7 + total8 + total9 + total10;
  console.log(`\n💰 Valor total de todas las órdenes: $${grandTotal.toFixed(2)} MXN`);
  console.log('='.repeat(50));
  console.log('\n✨ Seed de órdenes completado exitosamente!\n');
}

seedOrders()
  .catch((e) => {
    console.error('❌ Error durante el seed de órdenes:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
