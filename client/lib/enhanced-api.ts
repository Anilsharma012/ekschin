// Enhanced API client with proper error handling and fallback support

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  fallback?: boolean;
}

interface ApiConfig {
  timeout?: number;
  retries?: number;
  baseURL?: string;
}

class EnhancedApiClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;

  constructor(config: ApiConfig = {}) {
    this.baseURL = config.baseURL || this.getBaseURL();
    this.timeout = config.timeout || 10000; // 10 seconds
    this.retries = config.retries || 2;
  }

  private getBaseURL(): string {
    if (typeof window === 'undefined') return '';
    
    const { protocol, hostname, port } = window.location;
    
    // Development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${port}`;
    }
    
    // Production - use same origin
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async requestWithRetry(
    url: string, 
    options: RequestInit,
    attempt: number = 0
  ): Promise<Response> {
    try {
      const response = await this.fetchWithTimeout(url, options);
      
      // If we get a server error and have retries left, try again
      if (response.status >= 500 && attempt < this.retries) {
        console.log(`API call failed with ${response.status}, retrying... (${attempt + 1}/${this.retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        return this.requestWithRetry(url, options, attempt + 1);
      }
      
      return response;
    } catch (error) {
      if (attempt < this.retries) {
        console.log(`Network error, retrying... (${attempt + 1}/${this.retries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        return this.requestWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  async get<T = any>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}/api/${endpoint}`;
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await this.requestWithRetry(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        // Handle specific status codes
        if (response.status === 503) {
          return {
            success: false,
            error: 'Service temporarily unavailable',
            fallback: true
          };
        }
        
        if (response.status === 401) {
          return {
            success: false,
            error: 'Unauthorized - please login again'
          };
        }

        if (response.status === 403) {
          return {
            success: false,
            error: 'Access denied'
          };
        }

        // Try to get error message from response
        try {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || errorData.message || `HTTP ${response.status}`
          };
        } catch {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }
      }

      const data = await response.json();
      return data;

    } catch (error: any) {
      console.error(`API GET ${endpoint} failed:`, error);
      
      // Network errors
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout'
        };
      }
      
      if (error.message?.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Network error - please check your connection'
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async post<T = any>(endpoint: string, data: any, token?: string): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}/api/${endpoint}`;
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await this.requestWithRetry(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 503) {
          return {
            success: false,
            error: 'Service temporarily unavailable',
            fallback: true
          };
        }
        
        try {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || errorData.message || `HTTP ${response.status}`
          };
        } catch {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }
      }

      const responseData = await response.json();
      return responseData;

    } catch (error: any) {
      console.error(`API POST ${endpoint} failed:`, error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout'
        };
      }
      
      if (error.message?.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Network error - please check your connection'
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async put<T = any>(endpoint: string, data: any, token?: string): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}/api/${endpoint}`;
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await this.requestWithRetry(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 503) {
          return {
            success: false,
            error: 'Service temporarily unavailable',
            fallback: true
          };
        }
        
        try {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || errorData.message || `HTTP ${response.status}`
          };
        } catch {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }
      }

      const responseData = await response.json();
      return responseData;

    } catch (error: any) {
      console.error(`API PUT ${endpoint} failed:`, error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout'
        };
      }
      
      if (error.message?.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Network error - please check your connection'
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async delete<T = any>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}/api/${endpoint}`;
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await this.requestWithRetry(url, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        if (response.status === 503) {
          return {
            success: false,
            error: 'Service temporarily unavailable',
            fallback: true
          };
        }
        
        try {
          const errorData = await response.json();
          return {
            success: false,
            error: errorData.error || errorData.message || `HTTP ${response.status}`
          };
        } catch {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
        }
      }

      const responseData = await response.json();
      return responseData;

    } catch (error: any) {
      console.error(`API DELETE ${endpoint} failed:`, error);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout'
        };
      }
      
      if (error.message?.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Network error - please check your connection'
        };
      }

      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }
}

// Create and export enhanced API instance
export const enhancedApi = new EnhancedApiClient();

// Export the class for custom instances
export { EnhancedApiClient };

// Backward compatibility exports
export const api = enhancedApi;
export default enhancedApi;
