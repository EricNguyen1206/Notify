export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiMessageResponse {
  success: boolean;
  message: string;
}

export interface PaginationMeta {
  limit: number;
  before?: number;
  hasMore: boolean;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta;
}

export interface ApiErrorResponse {
  code: number;
  message: string;
  details?: string;
}

