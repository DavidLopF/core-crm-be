import { Router, Request, Response } from 'express';
import {OrderService} from '../services'
import { ApiResponse, ErrorResponse } from '../types';
import { InventorySummaryDto, InventoryItemDto } from '../dtos';
import { printError } from '../shared/utils/logger';

const router = Router();

router.put('/change-status/:orderId', async (req: Request, res: Response) => {
  try{
    const response = await OrderService.changeOrderStatus(
      parseInt(req.params.orderId), 
      req.body.newStatusCode, 
      req.body.userId
    );

    const apiResponse: ApiResponse<null> = {
      success: true,
      message: 'Status de la orden cambiado exitosamente',
      data: null,
    };

    res.status(200).json(apiResponse);

  }catch(error){
    printError('Error en PUT /api/orders/change-status/:orderId', error);
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al cambiar el status de la orden',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(errorResponse);
  }
}); 


/**
 * GET /api/inventory
 * Obtener lista completa del inventario con filtros opcionales
 * Query params:
 *   - search: buscar por nombre o descripción
 *   - stockStatus: all | in-stock | low-stock | out-of-stock
 *   - page: número de página (default: 1)
 *   - limit: cantidad por página (default: 10)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, page, limit } = req.query;

    const result = await OrderService.getOrderList({
      search: search as string,
    });

    const response: ApiResponse<any[]> = {
      success: true,
      message: 'Inventario obtenido exitosamente',
      data: result.data,
    };

    res.status(200).json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al obtener inventario',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(errorResponse);
  }
});

export default router;
