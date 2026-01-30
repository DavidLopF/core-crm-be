import { prisma } from '../config/prisma';
import { ClientListItemDto, PriceHistoryDto } from '../dtos';

class ClientService {
  /**
   * Obtener todos los clientes activos (solo id y nombre)
   */
  async getAllClients(): Promise<ClientListItemDto[]> {
    return await prisma.client.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Obtener historial de precios de un producto para un cliente específico
   */
  async getClientPriceHistory(clientId: number, productId: number): Promise<PriceHistoryDto[]> {
    const orders = await prisma.order.findMany({
      where: {
        clientId,
        items: {
          some: {
            variant: {
              productId,
            },
          },
        },
      },
      include: {
        items: {
          where: {
            variant: {
              productId,
            },
          },
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transformar a historial de precios
    const priceHistory = orders.flatMap((order) =>
      order.items.map((item) => ({
        orderId: order.id,
        orderCode: order.code,
        orderDate: order.createdAt,
        orderStatus: order.status.label,
        variantId: item.variant.id,
        variantName: item.variant.variantName,
        sku: item.variant.sku,
        quantity: item.qty,
        unitPrice: Number(item.unitPrice),
        listPrice: item.listPrice ? Number(item.listPrice) : null,
        discount: item.listPrice
          ? Number(item.listPrice) - Number(item.unitPrice)
          : 0,
        discountPercent: item.listPrice
          ? ((Number(item.listPrice) - Number(item.unitPrice)) /
              Number(item.listPrice)) *
            100
          : 0,
        lineTotal: Number(item.lineTotal),
        currency: item.currency,
      }))
    );

    return priceHistory;
  }
}

export default new ClientService();
