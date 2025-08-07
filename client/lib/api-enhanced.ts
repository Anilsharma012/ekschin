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

// Helper function to create API URLs
export const createApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  if (API_CONFIG.baseUrl) {
    const fullUrl = `${API_CONFIG.baseUrl}/api/${cleanEndpoint.replace("api/", "")}`;
    return fullUrl;
  }

  return `/api/${cleanEndpoint.replace("api/", "")}`;
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
  const url = createApiUrl(endpoint);
  const controller = new AbortController();

  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    console.log(
      `🔄 API Request [${retryCount + 1}/${API_CONFIG.retryAttempts + 1}]: ${url}`,
    );

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);

    const isRetryableError =
      error.name === "AbortError" ||
      error.message?.includes("Failed to fetch") ||
      error.message?.includes("NetworkError") ||
      error.message?.includes("timeout");

    // Retry logic
    if (isRetryableError && retryCount < API_CONFIG.retryAttempts) {
      console.warn(
        `🔄 Retrying request (${retryCount + 1}/${API_CONFIG.retryAttempts}) in ${API_CONFIG.retryDelay}ms...`,
      );

      await new Promise((resolve) =>
        setTimeout(resolve, API_CONFIG.retryDelay * (retryCount + 1)),
      );
      return safeApiRequest(endpoint, options, retryCount + 1);
    }

    // Return fallback data after all retries failed
    console.error(
      `❌ API request failed after ${retryCount + 1} attempts for ${endpoint}:`,
      {
        error: error.message,
        name: error.name,
        stack: error.stack?.split("\n")[0],
        url,
      },
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
