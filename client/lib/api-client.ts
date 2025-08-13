/**
 * Enhanced API Client with Automatic Environment Detection
 * 
 * This module provides a robust API client that automatically handles:
 * - Environment detection and base URL configuration
 * - CORS headers and credentials
 * - Request timeouts and retries
 * - Error handling and logging
 * - Authentication token management
 */

import { API_CONFIG, createApiUrl, getEnvironmentInfo } from './api-config';

// Request options interface
export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  token?: string;
  skipRetry?: boolean;
}

// Response interface
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  ok: boolean;
  headers: Headers;
  fromCache?: boolean;
  fromRetry?: boolean;
}

// Error interface
export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

// Create enhanced API error
const createApiError = (message: string, status?: number, details?: any): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.details = details;
  error.name = 'ApiError';
  return error;
};

// Enhanced fetch with timeout, retry, and proper error handling
export const apiRequest = async <T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> => {
  const {
    timeout = API_CONFIG.timeout,
    retries = API_CONFIG.retryAttempts,
    token,
    skipRetry = false,
    ...fetchOptions
  } = options;

  const url = createApiUrl(endpoint);
  
  // Prepare headers
  const headers = new Headers({
    ...API_CONFIG.headers,
    ...fetchOptions.headers
  });

  // Add authentication token if provided
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Add CORS headers for cross-origin requests
  if (API_CONFIG.environment !== 'development') {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  const requestOptions: RequestInit = {
    ...fetchOptions,
    headers,
    credentials: 'include', // Always include credentials for CORS
  };

  // Retry logic
  let lastError: ApiError | null = null;
  const maxAttempts = skipRetry ? 1 : retries + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`🚀 API Request [${attempt + 1}/${maxAttempts}]: ${requestOptions.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response based on content type
      let responseData: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType?.includes('text/')) {
        const textData = await response.text();
        responseData = (textData ? textData : null) as T;
      } else {
        // For binary data or unknown content types
        responseData = null as T;
      }

      // Handle HTTP errors
      if (!response.ok) {
        const errorMessage = (responseData as any)?.error || 
                           (responseData as any)?.message || 
                           `HTTP ${response.status}: ${response.statusText}`;
        
        console.error(`❌ API Error ${response.status}:`, errorMessage);
        
        // Determine if error is retryable
        const isRetryable = response.status >= 500 || 
                           response.status === 429 || // Rate limited
                           response.status === 408;   // Request timeout
        
        if (isRetryable && attempt < maxAttempts - 1 && !skipRetry) {
          console.warn(`🔄 Retrying request in ${API_CONFIG.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (attempt + 1)));
          continue;
        }

        throw createApiError(errorMessage, response.status, responseData);
      }

      console.log(`✅ API Success: ${response.status} ${response.statusText}`);

      return {
        data: responseData,
        status: response.status,
        ok: response.ok,
        headers: response.headers,
        fromRetry: attempt > 0
      };

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle different types of errors
      if (error.name === 'AbortError') {
        lastError = createApiError(`Request timeout after ${timeout}ms`, 408);
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        lastError = createApiError(`Network error: Unable to connect to ${url}`, 0, { originalError: error });
      } else if (error.name === 'ApiError') {
        lastError = error;
      } else {
        lastError = createApiError(`Unexpected error: ${error.message}`, 0, { originalError: error });
      }

      // Retry on network errors and timeouts
      const isRetryableError = error.name === 'AbortError' || 
                              error.name === 'TypeError' ||
                              (error.status && error.status >= 500);

      if (isRetryableError && attempt < maxAttempts - 1 && !skipRetry) {
        console.warn(`🔄 Retrying request (${attempt + 1}/${maxAttempts}) in ${API_CONFIG.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (attempt + 1)));
        continue;
      }

      // If this was the last attempt or error is not retryable, break
      break;
    }
  }

  // All attempts failed
  console.error(`❌ API request failed after ${maxAttempts} attempts:`, lastError);
  throw lastError;
};

// Convenience methods for common HTTP verbs
export const api = {
  // GET request
  get: async <T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
    const response = await apiRequest<T>(endpoint, { ...options, method: 'GET' });
    return response.data;
  },

  // POST request
  post: async <T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> => {
    const body = data ? JSON.stringify(data) : undefined;
    const response = await apiRequest<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body 
    });
    return response.data;
  },

  // PUT request
  put: async <T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> => {
    const body = data ? JSON.stringify(data) : undefined;
    const response = await apiRequest<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body 
    });
    return response.data;
  },

  // PATCH request
  patch: async <T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<T> => {
    const body = data ? JSON.stringify(data) : undefined;
    const response = await apiRequest<T>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body 
    });
    return response.data;
  },

  // DELETE request
  delete: async <T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
    const response = await apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
    return response.data;
  },

  // Upload file (multipart/form-data)
  upload: async <T = any>(
    endpoint: string, 
    formData: FormData, 
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    // Remove Content-Type header to let browser set it with boundary
    const { headers, ...restOptions } = options;
    const uploadHeaders = new Headers(headers);
    uploadHeaders.delete('Content-Type');

    const response = await apiRequest<T>(endpoint, {
      ...restOptions,
      method: 'POST',
      body: formData,
      headers: uploadHeaders
    });
    return response.data;
  },

  // Raw request (returns full response object)
  raw: apiRequest,

  // Health check
  ping: async (): Promise<any> => {
    return api.get('ping');
  },

  // Environment info
  info: getEnvironmentInfo
};

// Export for backward compatibility
export default api;

// Type exports
export type { ApiRequestOptions, ApiResponse, ApiError };
