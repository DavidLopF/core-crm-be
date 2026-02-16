import { Router, Request, Response } from 'express';
import ProductService from '../services/product.service';
import { ApiResponse, ListResponse, ErrorResponse } from '../types';
import { 
  ProductDetailDto, 
  ProductListItemDto, 
  CategoryDto, 
  ProductFiltersDto, 
  PaginatedProductsDto,
  CreateProductDto,
  CreateProductResponseDto,
  UpdateProductDto,
  UpdateProductResponseDto
} from '../dtos';

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

/**
 * POST /api/products
 * Crear un nuevo producto con variantes y stock
 * 
 * Body:
 * {
 *   "name": "Nombre del producto",
 *   "description": "Descripción opcional",
 *   "sku": "SKU-001",
 *   "imageUrl": "https://ejemplo.com/imagen.jpg",
 *   "categoryId": 1,
 *   "price": 199.99,
 *   "cost": 99.99,
 *   "currency": "MXN",
 *   "variants": [
 *     {
 *       "sku": "SKU-001-M",
 *       "variantType": "Talla",
 *       "variantValue": "M",
 *       "initialStock": 100,
 *       "warehouseId": 1
 *     }
 *   ]
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const productData: CreateProductDto = req.body;

    // Normalizar campos (aceptar price o defaultPrice)
    const price = productData.price ?? productData.defaultPrice;

    // Validaciones básicas
    if (!productData.name || productData.name.trim() === '') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'El nombre del producto es requerido',
      };
      return res.status(400).json(errorResponse);
    }

    if (!productData.sku || productData.sku.trim() === '') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'El SKU del producto es requerido',
      };
      return res.status(400).json(errorResponse);
    }

    if (!productData.categoryId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'La categoría es requerida',
      };
      return res.status(400).json(errorResponse);
    }

    if (price === undefined || price < 0) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'El precio debe ser un número válido mayor o igual a 0',
      };
      return res.status(400).json(errorResponse);
    }

    if (!productData.variants || productData.variants.length === 0) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Debe agregar al menos una variación del producto',
      };
      return res.status(400).json(errorResponse);
    }

    // Normalizar variantes y validar
    const normalizedVariants = productData.variants.map((variant, i) => {
      // Determinar el nombre de la variante
      let variantName = variant.variantName;
      if (!variantName && variant.variantType && variant.variantValue) {
        variantName = `${variant.variantType}: ${variant.variantValue}`;
      }

      // Determinar el stock inicial
      const initialStock = variant.initialStock ?? variant.stock ?? 0;

      // Generar SKU si no se proporciona
      const variantSku = variant.sku || `${productData.sku}-${i + 1}`;

      return {
        sku: variantSku,
        barcode: variant.barcode,
        variantType: variant.variantType || 'Default',
        variantValue: variant.variantValue || variantName || `Variante ${i + 1}`,
        variantName,
        initialStock,
        warehouseId: variant.warehouseId,
      };
    });

    // Validar cada variante normalizada
    for (let i = 0; i < normalizedVariants.length; i++) {
      const variant = normalizedVariants[i];
      
      if (variant.initialStock < 0) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: `La variante ${i + 1} requiere un stock inicial válido (>= 0)`,
        };
        return res.status(400).json(errorResponse);
      }
    }

    // Preparar datos normalizados para el servicio
    const normalizedProductData = {
      ...productData,
      price: price,
      variants: normalizedVariants,
    };

    // Crear el producto
    const result = await ProductService.createProduct(normalizedProductData);

    const response: ApiResponse<CreateProductResponseDto> = {
      success: true,
      data: result,
    };
    res.status(201).json(response);

  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al crear el producto',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    // Si es un error de validación de negocio (SKU duplicado, categoría no encontrada, etc.)
    if (error instanceof Error && (
      error.message.includes('ya existe') || 
      error.message.includes('no encontrada') ||
      error.message.includes('No hay almacenes')
    )) {
      return res.status(400).json(errorResponse);
    }
    
    res.status(500).json(errorResponse);
  }
});

/**
 * PUT /api/products/:id
 * Actualizar un producto existente con sus variantes y stock
 * 
 * Body:
 * {
 *   "name": "Nombre actualizado",
 *   "description": "Descripción actualizada",
 *   "categoryId": 1,
 *   "price": 200,
 *   "cost": 100,
 *   "currency": "MXN",
 *   "isActive": true,
 *   "variants": [
 *     {
 *       "id": 1,              // Variante existente - se actualiza
 *       "variantName": "Color: Rojo",
 *       "stock": 150
 *     },
 *     {
 *       "variantName": "Color: Azul",  // Sin id - se crea nueva variante
 *       "stock": 50,
 *       "sku": "SKU-001-AZUL"
 *     }
 *   ]
 * }
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'ID de producto inválido',
      };
      return res.status(400).json(errorResponse);
    }

    const updateData: UpdateProductDto = req.body;

    // Normalizar precio (aceptar price o defaultPrice)
    if (updateData.price === undefined && updateData.defaultPrice !== undefined) {
      updateData.price = updateData.defaultPrice;
    }

    // Validaciones básicas
    if (updateData.name !== undefined && updateData.name.trim() === '') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'El nombre del producto no puede estar vacío',
      };
      return res.status(400).json(errorResponse);
    }

    if (updateData.price !== undefined && updateData.price < 0) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'El precio debe ser un número válido mayor o igual a 0',
      };
      return res.status(400).json(errorResponse);
    }

    // Validar variantes si se envían
    if (updateData.variants && updateData.variants.length > 0) {
      for (let i = 0; i < updateData.variants.length; i++) {
        const variant = updateData.variants[i];
        const stock = variant.stock ?? variant.initialStock;

        if (stock !== undefined && stock < 0) {
          const errorResponse: ErrorResponse = {
            success: false,
            message: `La variante ${i + 1} tiene un stock inválido (debe ser >= 0)`,
          };
          return res.status(400).json(errorResponse);
        }
      }
    }

    // Actualizar el producto
    const result = await ProductService.updateProduct(productId, updateData);

    const response: ApiResponse<UpdateProductResponseDto> = {
      success: true,
      data: result,
    };
    res.status(200).json(response);

  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Error al actualizar el producto',
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    // Errores de validación de negocio
    if (error instanceof Error && (
      error.message.includes('no encontrado') ||
      error.message.includes('no encontrada') ||
      error.message.includes('no pertenece') ||
      error.message.includes('ya está en uso') ||
      error.message.includes('No hay almacenes')
    )) {
      return res.status(400).json(errorResponse);
    }

    res.status(500).json(errorResponse);
  }
});

export default router;