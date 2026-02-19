import { prisma } from "../config/prisma";
import { ClientListItemDto, PriceHistoryDto, ClientDto } from "../dtos";

class ClientService {

  public async getClientById(clientId: number): Promise<any | null> {
    try{
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          document: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!client) {
        return null;
      }

      const hystoricalPrices = await this.getClientPriceHistory(client.id, 0);

      const totalSpent = await this.getTotalSpent(client.id);
      const totalOrders = await prisma.order.count({
        where: {
          clientId: client.id,
          status: {
            code: {
              notIn: ["COTIZADO", "CANCELADO"],
            },
          },
        },
      });

      return {
        ...client,
        totalSpent,
        totalOrders,
        hystoricalPrices,
      };
    }catch(error){
      throw new Error("Error to get client by id: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  }

  public async getClientStatistics(): Promise<any> {
    try {
      const totalClients = await prisma.client.count();
      const activeClients = await prisma.client.count({
        where: { isActive: true },
      });
      const inactiveClients = totalClients - activeClients;
      const newClientsLastMonth = await prisma.client.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          },
        },
      });
      const totalIncome = await prisma.orderItem.aggregate({
        _sum: {
          lineTotal: true,
        },
        where: {
          order: {
            status: {
              code: {
                notIn: ["COTIZADO", "CANCELADO"],
              },
            },
          },
        },
      });
      return {
        totalClients,
        activeClients,
        inactiveClients,
        newClientsLastMonth,
        totalIncome: totalIncome._sum.lineTotal
          ? Number(totalIncome._sum.lineTotal)
          : 0,
      };
    } catch (error) {
      throw new Error(
        "Error to get client statistics: " +
          (error instanceof Error ? error.message : "Unknown error"),
      );
    }
  }

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
      orderBy: { name: "asc" },
    });
  }

  /**
   * Obtener clientes paginados con búsqueda opcional
   * @param page número de página (1-based)
   * @param limit tamaño de página
   * @param search texto para filtrar por nombre/document
   */
  public async getClients(
    page = 1,
    limit = 10,
    search?: string,
    filters?: { active?: boolean; inactive?: boolean },
  ): Promise<{ data: ClientDto[]; total: number }> {
    const take = Math.max(1, Math.min(limit, 100));
    const skip = Math.max(0, (Math.max(1, page) - 1) * take);

    const where: any = {};

    if (filters) {
      if (filters.active) {
        where.isActive = true;
      }
      if (filters.inactive) {
        where.isActive = false;
      }
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { document: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          document: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      data: await Promise.all(
        data.map(async (client) => ({
          ...client,
          totalSpent: await this.getTotalSpent(client.id),
          totalOrders: await prisma.order.count({
            where: {
              clientId: client.id,
              status: {
                code: {
                  notIn: ["COTIZADO", "CANCELADO"],
                },
              },
            },
          }),
        })),
      ),
      total,
    };
  }

  private async getTotalSpent(clientId: number): Promise<number> {
    try {
      const result = await prisma.orderItem.aggregate({
        where: {
          order: {
            clientId,
            status: {
              code: {
                notIn: ["COTIZADO", "CANCELADO"],
              },
            },
          },
        },
        _sum: {
          lineTotal: true,
        },
      });
      return result._sum.lineTotal ? Number(result._sum.lineTotal) : 0;
    } catch (error) {
      throw new Error("Error to calculate total spent for client " + clientId);
    }
  }

  /**
   * Obtener historial de precios de un producto para un cliente específico
   */
  async getClientPriceHistory(
    clientId: number,
    productId: number,
  ): Promise<PriceHistoryDto[]> {
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
      orderBy: { createdAt: "desc" },
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
      })),
    );

    return priceHistory;
  }
}

export default new ClientService();
