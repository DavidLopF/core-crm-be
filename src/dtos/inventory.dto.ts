/**
 * DTO para el resumen de inventario
 */
export interface InventorySummaryDto {
  totalProducts: number;
  stockTotal: number;
  stockBajo: number;
  valorInventario: number;
}

/**
 * DTO para un item de inventario en la lista
 */
export interface InventoryItemDto {
  id: number;
  productId: number;
  name: string;
  description: string | null;
  variantName: string | null;
  sku: string;
  barcode: string | null;
  category: string;
  stock: number;
  stockStatus: 'En Stock' | 'Stock Bajo' | 'Sin Stock';
  price: number;
  currency: string | null;
  isActive: boolean;
  warehouses: WarehouseStockDto[];
}

/**
 * DTO para el stock en un almacén
 */
export interface WarehouseStockDto {
  warehouseName: string;
  qtyOnHand: number;
  qtyReserved: number;
}

/**
 * Query params para filtrar inventario
 */
export interface InventoryQueryParams {
  search?: string;
  stockStatus?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  page?: number;
  limit?: number;
}
