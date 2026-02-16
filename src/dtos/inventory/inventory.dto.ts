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
}

/**
 * DTO para detalle de inventario por variante
 */
export interface InventoryDetailDto {
  id: number;
  product: {
    id: number;
    name: string;
    description: string | null;
    defaultPrice: number;
    currency: string | null;
  };
  variant: {
    sku: string;
    barcode: string | null;
    variantName: string | null;
  };
  totalStock: number;
  stockByWarehouse: {
    warehouseId: number;
    warehouseName: string;
    qtyOnHand: number;
    qtyReserved: number;
    qtyAvailable: number;
  }[];
}

/**
 * DTO para actualizar stock
 */
export interface UpdateStockDto {
  variantId: number;
  warehouseId: number;
  qtyOnHand?: number;
  qtyReserved?: number;
}

/**
 * DTO para resultado de actualización de stock
 */
export interface StockUpdateResultDto {
  id: number;
  variantId: number;
  warehouseId: number;
  qtyOnHand: number;
  qtyReserved: number;
  updatedAt: Date;
}
