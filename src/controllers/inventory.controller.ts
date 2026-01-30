import { Router, Request, Response } from 'express';
import InventoryService from '../services/inventory.service';
import { ApiResponse, ErrorResponse } from '../types';
import { InventorySummaryDto, InventoryItemDto } from '../dtos';

const router = Router();

/**
 * GET /api/inventory/summary
 * Obtener estadísticas del inventario (métricas para las tarjetas superiores)
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const summary = await InventoryService.getInventorySummary();
    
    const response: ApiResponse<InventorySummaryDto> = {
      success: true,
      data: summary,
    };
    
    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al obtener resumen del inventario',
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
    const { search, stockStatus, page, limit } = req.query;

    const result = await InventoryService.getInventoryList({
      search: search as string,
      stockStatus: stockStatus as 'all' | 'in-stock' | 'low-stock' | 'out-of-stock',
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    });

    res.json(result);
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
