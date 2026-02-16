import { reconstructFieldPath } from 'express-validator/lib/field-selection';
import { prisma } from '../config/prisma';
import {
  InventorySummaryDto,
  InventoryItemDto,
  InventoryQueryParams,
  InventoryDetailDto,
  UpdateStockDto,
  StockUpdateResultDto,
} from '../dtos';
import { PaginatedResponse } from '../types';

class OrderService {

public async changeOrderStatus(orderId: number, newStatusCode: number, userId: number) {
  try{

    const actualyOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { status: true } 
    });
    
    switch (newStatusCode) {
      case  2:
        if (actualyOrder?.status.code !== 'COTIZADO') {
          throw new Error('La orden debe estar en estado COTIZADO para cambiar a TRANSMITIDO');
        }
        break;
      case 3:
        if (actualyOrder?.status.code !== 'TRANSMITIDO') {
          throw new Error('La orden debe estar en estado TRANSMITIDO para cambiar a otro estado');
        }
        break;  
      case 4:
        if (actualyOrder?.status.code !== 'COTIZADO') {
          throw new Error('La orden debe estar en estado COTIZADO o TRANSMITIDO para cambiar a EN_CURSO');
        }
        break;
      case 5:
        if (actualyOrder?.status.code !== 'EN_CURSO') {
          throw new Error('La orden debe estar en estado EN_CURSO para cambiar a COMPLETADO');
        }
        break;
      default:
        throw new Error('Código de estado no válido');
     }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        statusId: newStatusCode,
        updatedByUserId: userId,
        updatedAt: new Date(),
      },  
      
    });

    if (!updatedOrder) {
      throw new Error('No se pudo actualizar el estado de la orden'); 
    }

    return {message: 'Estado de la orden actualizado correctamente', order: updatedOrder};

  }catch(error){
    throw new Error(
      'Error al cambiar el estado de la orden: ' +
      (error instanceof Error ? error.message : 'Unknown error')
    );  

  }
}



public async getOrderList(filters?: InventoryQueryParams) {
  try {
    // 1. Traer todos los status con sus órdenes anidadas
    const statuses = await prisma.orderStatus.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        orders: {
          include: {
            client: true,
            items: {
              include: {
                variant: {
                  select: {
                    id: true,
                    sku: true,
                    variantName: true,
                  },
                },
              },
            },
          },
          where: {
            isDeleted: false,
          }
        },
      },
    });

    // 2. Mapear al formato deseado
    const data = statuses.map(status => ({
      statusId:   status.id,
      statusCode: status.code,    // COTIZADO, TRANSMITIDO...
      statusLabel: status.label,
      orderCount: status.orders.length,
      orders: status.orders.map(order => ({
        id:        order.id,
        code:      order.code,
        client:    order.client,
        total:     order.total,
        currency:  order.currency,
        createdAt: order.createdAt,
        items:     order.items,
      })),
    }));

    return { data };
  } catch (error) {
    throw new Error(
      'Error al obtener lista de inventario: ' +
      (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}

  
}

// Exportar instancia única (Singleton)
export default new OrderService();
