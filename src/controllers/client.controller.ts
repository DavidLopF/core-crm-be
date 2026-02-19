import { Router, Request, Response } from 'express';
import ClientService from '../services/client.service';
import { PaginatedResponse, ErrorResponse, ListResponse } from '../types';
import { ClientListItemDto, PriceHistoryDto, ClientDto } from '../dtos';
import { Logger } from 'winston';
import { printError } from '../shared/utils/logger';

const router = Router();

/**
 * GET /api/clients
 * Obtener lista de clientes (solo id y nombre)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Parse query params
    const page = req.query.page ? parseInt(String(req.query.page)) : 1;
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
    const search = req.query.search ? String(req.query.search) : undefined;
    const filters = {
      active: req.query.active ? String(req.query.active) === 'true' : undefined,
      inactive: req.query.inactive ? String(req.query.inactive) === 'true' : undefined,
    }
    const { data, total } = await ClientService.getClients(page, limit, search, filters);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    const response: PaginatedResponse<ClientDto> = {
      success: true,
      data,
      pagination,
    };

    res.json(response);
  } catch (error) {
    printError('Error en GET /api/clients', error);
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al obtener clientes',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(errorResponse);
  }
});




 
/**
 * GET /api/clients/statistics
 * Obtener estadísticas generales de clientes
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await ClientService.getClientStatistics();
    const response = {
      success: true,
      data: stats,
    };
    res.status(200).json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al obtener estadísticas de clientes',
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


/**
 * GET /api/clients/:clientId
 * Obtener detalles de un cliente específico
 */
router.get('/:clientId', async (req: Request, res: Response) => {
  try {
    const clientId = parseInt(req.params.clientId);

    if (isNaN(clientId)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'ID de cliente inválido',
      };
      return res.status(400).json(errorResponse);
    }

    const client = await ClientService.getClientById(clientId);

    if (!client) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Cliente no encontrado',
      };
      return res.status(404).json(errorResponse);
    }

    const response = {
      success: true,
      data: client,
    };
    res.json(response);
  } catch (error) { 
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al obtener cliente',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(errorResponse);
  }
});
export default router;
