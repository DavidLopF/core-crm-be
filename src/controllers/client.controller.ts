import { Router, Request, Response } from 'express';
import ClientService from '../services/client.service';
import { ListResponse, ErrorResponse } from '../types';
import { ClientListItemDto, PriceHistoryDto } from '../dtos';

const router = Router();

/**
 * GET /api/clients
 * Obtener lista de clientes (solo id y nombre)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const clients = await ClientService.getAllClients();

    const response: ListResponse<ClientListItemDto> = {
      success: true,
      data: clients,
      count: clients.length,
    };
    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al obtener clientes',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * GET /api/clients/:clientId/price-history/:productId
 * Obtener historial de precios de un producto para un cliente específico
 */
router.get('/:clientId/price-history/:productId', async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const productId = parseInt(req.params.productId);

    if (isNaN(clientId) || isNaN(productId)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'IDs inválidos',
      };
      return res.status(400).json(errorResponse);
    }

    const priceHistory = await ClientService.getClientPriceHistory(clientId, productId);

    const response: ListResponse<PriceHistoryDto> = {
      success: true,
      data: priceHistory,
      count: priceHistory.length,
    };
    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al obtener historial de precios',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(errorResponse);
  }
});

export default router;
