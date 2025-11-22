export interface ApiMessageResponse {
  success: boolean;
  message: string;
}

export interface ApiResponse<T> extends ApiMessageResponse {
  data: T;
}

export interface ApiErrorResponse extends ApiMessageResponse {
  code: number;
  details?: string;
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  hasMore?: boolean;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta;
}
