import { Router, Request, Response } from 'express';
import ProductService from '../services/product.service';
import { ApiResponse, ListResponse, ErrorResponse } from '../types';
import { ProductDetailDto, ProductListItemDto, CategoryDto, ProductFiltersDto, PaginatedProductsDto } from '../dtos';

const router = Router();

/**
 * GET /api/products/statistics
 * Obtener estadísticas generales de productos (total, stock total, stock bajo)
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await ProductService.getProductStats();
    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };
    res.status(200).json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al obtener estadísticas de productos',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(errorResponse);
  }
});
 


/**
 * GET /api/products/categories
 * Obtener lista de categorías de productos 
 * NOTA: Este endpoint debe ir ANTES de /:id para evitar conflictos
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await ProductService.getAllCategories();
    
    const response: ListResponse<CategoryDto> = {        
      success: true,
      data: categories,
      count: categories.length,
    };
    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al obtener categorías de productos',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(errorResponse);
  }
});






/**
 * GET /api/products
 * Obtener lista de productos con paginación y filtros
 * 
 * Query params:
 * - page: número de página (default: 1)
 * - limit: registros por página (default: 10)
 * - search: búsqueda por nombre o descripción
 * - categoryId: filtrar por categoría
 * - sku: filtrar por SKU
 * - isActive: filtrar por estado (true/false)
 * - minPrice: precio mínimo
 * - maxPrice: precio máximo
 * - hasStock: filtrar productos con stock (true/false)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Parsear query params
    const filters: ProductFiltersDto = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      search: req.query.search as string,
      categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
      sku: req.query.sku as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      hasStock: req.query.hasStock === 'true' ? true : req.query.hasStock === 'false' ? false : undefined,
    };

    const result = await ProductService.getProducts(filters);

    const response: ApiResponse<PaginatedProductsDto> = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al obtener productos',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * GET /api/products/:id
 * Obtener detalle completo de un producto
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'ID de producto inválido',
      };
      return res.status(400).json(errorResponse);
    }

    const product = await ProductService.getProductDetail(productId);

    if (!product) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Producto no encontrado',
      };
      return res.status(404).json(errorResponse);
    }

    const response: ApiResponse<ProductDetailDto> = {
      success: true,
      data: product,
    };
    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al obtener detalle del producto',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(errorResponse);
  }
});

export default router;