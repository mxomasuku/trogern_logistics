// HIGHLIGHT: new split file for API envelope types

export interface ApiResponse<T = any> {
  isSuccessful: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}