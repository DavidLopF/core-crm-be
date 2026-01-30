/**
 * Tipo genérico para respuestas con paginación
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Metadata de paginación
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Tipo genérico para respuestas simples
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Tipo genérico para respuestas de lista
 */
export interface ListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
}

/**
 * Tipo para respuestas de error
 */
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}
