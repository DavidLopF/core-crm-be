import { Router, Request, Response } from 'express';
import ProductService from '../services/product.service';
import { ApiResponse, ListResponse, ErrorResponse } from '../types';
import { ProductDetailDto, ProductListItemDto, CategoryDto } from '../dtos';

const router = Router();

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

/**
 * GET /api/products
 * Obtener lista simple de todos los productos
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await ProductService.getAllProducts();

    const response: ListResponse<ProductListItemDto> = {
      success: true,
      data: products,
      count: products.length,
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

export default router;