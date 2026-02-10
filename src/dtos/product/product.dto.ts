/**
 * DTO para detalle completo de un producto
 */
export interface ProductDetailDto {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  category: string;
  price: number;
  cost: number;
  currency: string | null;
  totalStock: number;
  status: 'Activo' | 'Inactivo';
  createdAt: Date;
  updatedAt: Date;
  variants: ProductVariantDto[];
}

/**
 * DTO para una variante de producto
 */
export interface ProductVariantDto {
  id: number;
  sku: string;
  barcode: string | null;
  variantName: string | null;
  stock: number;
  reserved: number;
  available: number;
  status: 'Disponible' | 'Sin Stock';
  warehouses: ProductWarehouseStockDto[];
}

/**
 * DTO para stock de producto en almacén
 */
export interface ProductWarehouseStockDto {
  warehouseId: number;
  warehouseName: string;
  qtyOnHand: number;
  qtyReserved: number;
  qtyAvailable: number;
}

/**
 * DTO para lista simple de productos
 */
export interface ProductListItemDto {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  categoryId: number | null;
  defaultPrice: number;
  currency: string | null;
  totalStock: number;
  status: 'Activo' | 'Inactivo';
}

/**
 * Query params para filtrado y paginación de productos
 */
export interface ProductFiltersDto {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  sku?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  hasStock?: boolean;
}

/**
 * Respuesta paginada de productos
 */
export interface PaginatedProductsDto {
  data: ProductListItemDto[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * DTO para categoría de producto
 */
export interface CategoryDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}
