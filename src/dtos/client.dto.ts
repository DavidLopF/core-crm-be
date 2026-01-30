/**
 * DTO para lista simple de clientes
 */
export interface ClientListItemDto {
  id: number;
  name: string;
}

/**
 * DTO para historial de precios
 */
export interface PriceHistoryDto {
  orderId: number;
  orderCode: string;
  orderDate: Date;
  orderStatus: string;
  variantId: number;
  variantName: string | null;
  sku: string;
  quantity: number;
  unitPrice: number;
  listPrice: number | null;
  discount: number;
  discountPercent: number;
  lineTotal: number;
  currency: string | null;
}
