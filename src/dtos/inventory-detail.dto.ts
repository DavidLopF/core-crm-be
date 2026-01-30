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
