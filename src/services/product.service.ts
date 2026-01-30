import { prisma } from "../config/prisma";
import { ProductDetailDto, ProductListItemDto, CategoryDto } from "../dtos";

class ProductService {
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
   * Obtener todos los productos activos (lista simple)
   */
  async getAllProducts(): Promise<ProductListItemDto[]> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        defaultPrice: true,
        currency: true,
      },
      orderBy: { name: "asc" },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      defaultPrice: Number(p.defaultPrice),
      currency: p.currency,
    }));
  }
}

export default new ProductService();
