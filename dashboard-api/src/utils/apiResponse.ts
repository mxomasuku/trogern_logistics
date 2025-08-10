
import { ApiResponse } from "../interfaces/interfaces"

export function success<T>(data: T): ApiResponse<T> {
  return { isSuccessful: true, data, error: null };
}

export function failure(code: string, message: string, details?: any): ApiResponse<null> {
  return {
    isSuccessful: false,
    data: null,
    error: { code, message, details },
  };
}