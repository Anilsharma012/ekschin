// Enhanced API utility with better error handling and fallback mechanisms

const detectEnvironment = () => {
  if (typeof window === "undefined") return "server";

  const { protocol, hostname, port } = window.location;

  // Development environment
  if (hostname === "localhost" || hostname === "127.0.0.1" || port === "8080") {
    return "development";
  }

  // Fly.dev deployment
  if (hostname.includes(".fly.dev")) {
    return "fly";
  }

  // Netlify deployment
  if (hostname.includes(".netlify.app")) {
    return "netlify";
  }

  // Other production
  return "production";
};

// API Configuration with better defaults
const getApiBaseUrl = () => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  const environment = detectEnvironment();

  switch (environment) {
    case "development":
      // In development, use the same origin to avoid CORS issues
      return `${window.location.protocol}//${window.location.host}`;
    case "fly":
      return `${window.location.protocol}//${window.location.host}`;
    case "netlify":
      return "/.netlify/functions";
    default:
      return "";
  }
};

const API_BASE_URL = getApiBaseUrl();
const environment = detectEnvironment();

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: 15000, // Increased timeout to handle database initialization
  retryAttempts: 3,
  retryDelay: 2000, // Increased delay to allow server to stabilize
  environment,
};

// Circuit breaker to prevent excessive requests when server is down
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 30000; // 30 seconds

  isOpen(): boolean {
    return this.failureCount >= this.threshold &&
           (Date.now() - this.lastFailureTime) < this.timeout;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }

  getRemainingTime(): number {
    if (!this.isOpen()) return 0;
    return this.timeout - (Date.now() - this.lastFailureTime);
  }
}

const circuitBreaker = new CircuitBreaker();

// Helper function to create API URLs
export const createApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  if (API_CONFIG.baseUrl) {
    const fullUrl = `${API_CONFIG.baseUrl}/api/${cleanEndpoint.replace("api/", "")}`;
    return fullUrl;
  }

  return `/api/${cleanEndpoint.replace("api/", "")}`;
};

// Check if server is ready by pinging health endpoint
const checkServerReadiness = async (): Promise<boolean> => {
  try {
    const healthUrl = createApiUrl("health");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

// Enhanced fetch with retry and fallback
export const safeApiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<{
  data: any;
  status: number;
  ok: boolean;
  fromFallback?: boolean;
}> => {
  // Check circuit breaker
  if (circuitBreaker.isOpen()) {
    const remainingTime = Math.ceil(circuitBreaker.getRemainingTime() / 1000);
    console.warn(`🚫 Circuit breaker open, server unavailable. Retrying in ${remainingTime}s`);

    return {
      data: getFallbackData(endpoint),
      status: 503,
      ok: false,
      fromFallback: true,
    };
  }

  const url = createApiUrl(endpoint);
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;

  // Create a promise that resolves to timeout error
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout after ${API_CONFIG.timeout}ms`));
    }, API_CONFIG.timeout);
  });

  try {
    console.log(
      `🔄 API Request [${retryCount + 1}/${API_CONFIG.retryAttempts + 1}]: ${url}`,
    );

    // Use Promise.race to handle timeout more gracefully
    const fetchPromise = fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // Record success for circuit breaker
    circuitBreaker.recordSuccess();

    let responseData;
    try {
      if (response.headers.get("content-type")?.includes("application/json")) {
        responseData = await response.json();
      } else {
        const responseText = await response.text();
        if (responseText && responseText.trim()) {
          try {
            responseData = JSON.parse(responseText);
          } catch {
            responseData = { error: "Invalid JSON format", raw: responseText };
          }
        } else {
          responseData = { message: "Empty response" };
        }
      }
    } catch (readError) {
      responseData = response.ok
        ? { success: true, message: "Operation completed successfully" }
        : {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
    }

    return {
      data: responseData,
      status: response.status,
      ok: response.ok,
    };
  } catch (error: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // Better error serialization
    const errorDetails = {
      message: error.message || 'Unknown error',
      name: error.name || 'Error',
      type: error.constructor?.name || 'UnknownError',
      code: error.code,
      status: error.status,
      stack: error.stack?.split("\n")[0]
    };

    const isRetryableError =
      error.name === "AbortError" ||
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("NetworkError") ||
      error.message?.includes("timeout") ||
      error.message?.includes("Database not initialized") ||
      error.message?.includes("ECONNREFUSED") ||
      error.code === "NETWORK_ERROR";

    // For database initialization errors, use longer delays
    const isDatabaseError = error.message?.includes("Database not initialized");
    const retryDelay = isDatabaseError ? API_CONFIG.retryDelay * 2 : API_CONFIG.retryDelay;

    // Retry logic
    if (isRetryableError && retryCount < API_CONFIG.retryAttempts) {
      console.warn(
        `🔄 Retrying request (${retryCount + 1}/${API_CONFIG.retryAttempts}) in ${retryDelay * (retryCount + 1)}ms...`,
        isDatabaseError ? "(Database initializing)" : "",
        errorDetails
      );

      await new Promise((resolve) =>
        setTimeout(resolve, retryDelay * (retryCount + 1)),
      );
      return safeApiRequest(endpoint, options, retryCount + 1);
    }

    // Return fallback data after all retries failed
    console.error(
      `❌ API request failed after ${retryCount + 1} attempts for ${endpoint}:`,
      errorDetails,
      `URL: ${url}`
    );

    return {
      data: getFallbackData(endpoint),
      status: 0,
      ok: false,
      fromFallback: true,
    };
  }
};

// Fallback data for common endpoints
const getFallbackData = (endpoint: string) => {
  const cleanEndpoint = endpoint.toLowerCase();

  if (cleanEndpoint.includes("properties")) {
    return {
      success: true,
      data: [],
      message: "No properties available (offline mode)",
      fromFallback: true,
    };
  }

  if (cleanEndpoint.includes("categories")) {
    return {
      success: true,
      data: [
        {
          _id: "fallback-1",
          name: "Residential",
          slug: "residential",
          icon: "building",
          active: true,
          order: 1,
        },
        {
          _id: "fallback-2",
          name: "Commercial",
          slug: "commercial",
          icon: "office",
          active: true,
          order: 2,
        },
        {
          _id: "fallback-3",
          name: "Plots",
          slug: "plots",
          icon: "map",
          active: true,
          order: 3,
        },
      ],
      message: "Using offline categories",
      fromFallback: true,
    };
  }

  if (cleanEndpoint.includes("packages")) {
    return {
      success: true,
      data: [],
      message: "No packages available (offline mode)",
      fromFallback: true,
    };
  }

  if (cleanEndpoint.includes("homepage-sliders")) {
    return {
      success: true,
      data: [], // Return empty array since we removed Rohtak section
      message: "No sliders configured",
      fromFallback: true,
    };
  }

  return {
    success: false,
    error: "Service temporarily unavailable",
    message: "Please try again later",
    fromFallback: true,
  };
};

// Enhanced API object with better error handling
export const enhancedApi = {
  get: async (endpoint: string, token?: string) => {
    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const result = await safeApiRequest(endpoint, {
      method: "GET",
      headers,
    });

    if (result.fromFallback) {
      console.warn(`🔄 Using fallback data for ${endpoint}`);
    }

    return result;
  },

  post: async (endpoint: string, data: any, token?: string) => {
    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return safeApiRequest(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
  },

  put: async (endpoint: string, data: any, token?: string) => {
    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return safeApiRequest(endpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });
  },

  delete: async (endpoint: string, token?: string) => {
    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return safeApiRequest(endpoint, {
      method: "DELETE",
      headers,
    });
  },
};

// Backward compatibility - enhanced version of existing api object
export const api = enhancedApi;

export default enhancedApi;
