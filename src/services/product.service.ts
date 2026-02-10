import { prisma } from "../config/prisma";
import { ProductDetailDto, ProductListItemDto, CategoryDto, ProductFiltersDto, PaginatedProductsDto } from "../dtos";

class ProductService {

  /**
   * Obtener las estadisticas generales de productos (total, stock total, stock bajo, produuctos activos/inactivos)
   */
  async getProductStats() {
    const totalProducts = await prisma.product.count();

    const stockStats = await prisma.inventoryStock.aggregate({
      _sum: {
        qtyOnHand: true,
        qtyReserved: true,
      },
    });

    const activeProducts = await prisma.product.count({
      where: { isActive: true },
    });

    const inactiveProducts = totalProducts - activeProducts;

    return {
      totalProducts,
      totalStockOnHand: stockStats._sum.qtyOnHand || 0,
      totalStockReserved: stockStats._sum.qtyReserved || 0,
      activeProducts,
      inactiveProducts,
    };
  }

  /**
   * Obtener las categorías de productos
   */
  async getAllCategories(): Promise<CategoryDto[]> {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return categories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    }));
  }

  /**
   * Obtener detalle completo de un producto con sus variantes y stock
   */
  async getProductDetail(productId: number): Promise<ProductDetailDto | null> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
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
    });

    if (!product) {
      return null;
    }

    // Calcular stock total del producto (suma de todas las variantes)
    const totalStock = product.variants.reduce((sum, variant) => {
      const variantStock = variant.stocks.reduce(
        (vSum, stock) => vSum + stock.qtyOnHand,
        0,
      );
      return sum + variantStock;
    }, 0);

    // Formatear variantes con su stock
    const variantsWithStock = product.variants.map((variant) => {
      const totalVariantStock = variant.stocks.reduce(
        (sum, stock) => sum + stock.qtyOnHand,
        0,
      );

      const totalReserved = variant.stocks.reduce(
        (sum, stock) => sum + stock.qtyReserved,
        0,
      );

      return {
        id: variant.id,
        sku: variant.sku,
        barcode: variant.barcode,
        variantName: variant.variantName,
        stock: totalVariantStock,
        reserved: totalReserved,
        available: totalVariantStock - totalReserved,
        status: (totalVariantStock > 0 ? "Disponible" : "Sin Stock") as
          | "Disponible"
          | "Sin Stock",
        warehouses: variant.stocks.map((stock) => ({
          warehouseId: stock.warehouse.id,
          warehouseName: stock.warehouse.name,
          qtyOnHand: stock.qtyOnHand,
          qtyReserved: stock.qtyReserved,
          qtyAvailable: stock.qtyOnHand - stock.qtyReserved,
        })),
      };
    });

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.variants[0]?.sku || "N/A", // SKU del primer variante
      category: product.category?.name || "Sin categoría",
      price: Number(product.defaultPrice),
      cost: Number(product.defaultPrice) * 0.5, // Puedes agregar campo de costo después
      currency: product.currency,
      totalStock,
      status: product.isActive ? "Activo" : "Inactivo",
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      variants: variantsWithStock,
    };
  }

  /**
   * Obtener productos con paginación y filtros
   */
  async getProducts(filters: ProductFiltersDto): Promise<PaginatedProductsDto> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      sku,
      isActive,
      minPrice,
      maxPrice,
      hasStock,
    } = filters;

    // Construir condiciones de filtrado
    const where: any = {};

    // Filtro de estado activo/inactivo
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Búsqueda por nombre o descripción
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por categoría
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filtro por rango de precio
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.defaultPrice = {};
      if (minPrice !== undefined) {
        where.defaultPrice.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        where.defaultPrice.lte = maxPrice;
      }
    }

    // Filtro por SKU (buscar en variantes)
    if (sku) {
      where.variants = {
        some: {
          sku: { contains: sku, mode: 'insensitive' },
        },
      };
    }

    // Filtro por disponibilidad de stock
    if (hasStock !== undefined) {
      if (hasStock) {
        where.variants = {
          some: {
            stocks: {
              some: {
                qtyOnHand: { gt: 0 },
              },
            },
          },
        };
      }
    }

    // Calcular paginación
    const skip = (page - 1) * limit;
    const take = limit;

    // Ejecutar consulta con paginación
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          category: true,
          variants: {
            where: { isActive: true },
            include: {
              stocks: {
                select: {
                  qtyOnHand: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Formatear datos
    const data: ProductListItemDto[] = products.map((product) => {
      // Calcular stock total del producto
      const totalStock = product.variants.reduce((sum, variant) => {
        const variantStock = variant.stocks.reduce(
          (vSum, stock) => vSum + stock.qtyOnHand,
          0
        );
        return sum + variantStock;
      }, 0);

      return {
        id: product.id,
        name: product.name,
        sku: product.variants[0]?.sku || 'N/A',
        category: product.category?.name || null,
        categoryId: product.categoryId,
        defaultPrice: Number(product.defaultPrice),
        currency: product.currency,
        totalStock,
        status: product.isActive ? 'Activo' : 'Inactivo',
      };
    });

    // Calcular metadata de paginación
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Obtener todos los productos activos (lista simple) - DEPRECATED
   * @deprecated Usar getProducts() con filtros en su lugar
   */
  async getAllProducts(): Promise<ProductListItemDto[]> {
    const result = await this.getProducts({ isActive: true, limit: 1000 });
    return result.data;
  }
}

export default new ProductService();
