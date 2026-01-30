import { prisma } from '../config/prisma';

class InventoryService {
  /**
   * Obtener resumen del inventario (métricas)
   */
  async getInventorySummary() {
    // Total de productos activos
    const totalProducts = await prisma.product.count({
      where: { isActive: true },
    });

    // Stock total (suma de todas las variantes en todos los almacenes)
    const stockTotal = await prisma.inventoryStock.aggregate({
      _sum: {
        qtyOnHand: true,
      },
    });

    // Stock bajo (productos con menos de 20 unidades disponibles)
    const stockBajo = await prisma.inventoryStock.count({
      where: {
        qtyOnHand: {
          lt: 20,
        },
      },
    });

    // Valor del inventario (stock * precio por producto)
    const inventoryValue = await prisma.$queryRaw<Array<{ total: number }>>`
      SELECT COALESCE(SUM(p."defaultPrice" * s."qtyOnHand"), 0) as total
      FROM "Product" p
      INNER JOIN "ProductVariant" pv ON pv."productId" = p.id
      INNER JOIN "InventoryStock" s ON s."variantId" = pv.id
      WHERE p."isActive" = true AND pv."isActive" = true
    `;

    return {
      totalProducts,
      stockTotal: stockTotal._sum.qtyOnHand || 0,
      stockBajo,
      valorInventario: Number(inventoryValue[0]?.total || 0),
    };
  }

  /**
   * Obtener lista de productos con inventario
   */
  async getInventoryList(filters?: {
    search?: string;
    category?: string;
    stockStatus?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    // Construir el where para contar y consultar
    const whereClause: any = {
      isActive: true,
      ...(filters?.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    // Contar total de productos
    const totalProducts = await prisma.product.count({
      where: whereClause,
    });

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        variants: {
          where: { isActive: true },
          include: {
            stocks: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Transformar datos para el frontend
    const inventoryItems = products.flatMap((product) =>
      product.variants.map((variant) => {
        // Sumar stock de todos los almacenes para esta variante
        const totalStock = variant.stocks.reduce(
          (sum, stock) => sum + stock.qtyOnHand,
          0
        );

        // Determinar estado del stock
        let stockStatus: 'En Stock' | 'Stock Bajo' | 'Sin Stock' = 'En Stock';
        if (totalStock === 0) {
          stockStatus = 'Sin Stock';
        } else if (totalStock < 20) {
          stockStatus = 'Stock Bajo';
        }

        return {
          id: variant.id,
          productId: product.id,
          name: product.name,
          description: product.description,
          variantName: variant.variantName,
          sku: variant.sku,
          barcode: variant.barcode,
          category: 'Sin categoría', // Puedes agregar categorías al schema después
          stock: totalStock,
          stockStatus,
          price: Number(product.defaultPrice),
          currency: product.currency,
          isActive: variant.isActive,
          warehouses: variant.stocks.map((stock) => ({
            warehouseName: stock.warehouse.name,
            qtyOnHand: stock.qtyOnHand,
            qtyReserved: stock.qtyReserved,
          })),
        };
      })
    );

    // Aplicar filtro de estado de stock si existe
    let filteredItems = inventoryItems;
    if (filters?.stockStatus && filters.stockStatus !== 'all') {
      filteredItems = inventoryItems.filter((item) => {
        if (filters.stockStatus === 'in-stock') return item.stock > 20;
        if (filters.stockStatus === 'low-stock')
          return item.stock > 0 && item.stock <= 20;
        if (filters.stockStatus === 'out-of-stock') return item.stock === 0;
        return true;
      });
    }

    const totalVariants = filteredItems.length;
    const totalPages = Math.ceil(totalVariants / limit);

    return {
      data: filteredItems,
      pagination: {
        page,
        limit,
        total: totalVariants,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Obtener detalle de inventario por variante
   */
  async getInventoryDetail(variantId: number) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: true,
        stocks: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    if (!variant) {
      return null;
    }

    const totalStock = variant.stocks.reduce(
      (sum, stock) => sum + stock.qtyOnHand,
      0
    );

    return {
      id: variant.id,
      product: {
        id: variant.product.id,
        name: variant.product.name,
        description: variant.product.description,
        defaultPrice: Number(variant.product.defaultPrice),
        currency: variant.product.currency,
      },
      variant: {
        sku: variant.sku,
        barcode: variant.barcode,
        variantName: variant.variantName,
      },
      totalStock,
      stockByWarehouse: variant.stocks.map((stock) => ({
        warehouseId: stock.warehouse.id,
        warehouseName: stock.warehouse.name,
        qtyOnHand: stock.qtyOnHand,
        qtyReserved: stock.qtyReserved,
        qtyAvailable: stock.qtyOnHand - stock.qtyReserved,
      })),
    };
  }

  /**
   * Actualizar stock de una variante en un almacén
   */
  async updateStock(data: {
    variantId: number;
    warehouseId: number;
    qtyOnHand?: number;
    qtyReserved?: number;
  }) {
    return await prisma.inventoryStock.upsert({
      where: {
        variantId_warehouseId: {
          variantId: data.variantId,
          warehouseId: data.warehouseId,
        },
      },
      update: {
        ...(data.qtyOnHand !== undefined && { qtyOnHand: data.qtyOnHand }),
        ...(data.qtyReserved !== undefined && { qtyReserved: data.qtyReserved }),
      },
      create: {
        variantId: data.variantId,
        warehouseId: data.warehouseId,
        qtyOnHand: data.qtyOnHand || 0,
        qtyReserved: data.qtyReserved || 0,
      },
    });
  }

  /**
   * Obtener productos con stock bajo
   */
  async getLowStockProducts(threshold: number = 20) {
    const result = await this.getInventoryList();
    return result.data.filter((item) => item.stock > 0 && item.stock <= threshold);
  }
}

// Exportar instancia única (Singleton)
export default new InventoryService();
