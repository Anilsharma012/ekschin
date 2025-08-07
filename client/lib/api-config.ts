/**
 * Centralized API Configuration with Automatic Environment Detection
 * 
 * This module provides automatic environment detection and base URL configuration
 * for all API requests. It handles development, production, and various deployment
 * platforms seamlessly without manual configuration.
 */

// Environment detection with comprehensive coverage
export const detectEnvironment = (): string => {
  // Server-side rendering check
  if (typeof window === "undefined") {
    return "server";
  }

  const { protocol, hostname, port } = window.location;

  // Development environment detection
  if (
    hostname === "localhost" || 
    hostname === "127.0.0.1" || 
    hostname === "0.0.0.0" ||
    port === "5173" || // Vite default
    port === "3000" || // React default
    port === "8080"    // This project's port
  ) {
    return "development";
  }

  // Platform-specific detection
  if (hostname.includes(".netlify.app") || hostname.includes(".netlify.com")) {
    return "netlify";
  }

  if (hostname.includes(".vercel.app") || hostname.includes(".vercel.com")) {
    return "vercel";
  }

  if (hostname.includes(".fly.dev") || hostname.includes(".fly.io")) {
    return "fly";
  }

  if (hostname.includes(".railway.app")) {
    return "railway";
  }

  if (hostname.includes(".render.com")) {
    return "render";
  }

  if (hostname.includes(".herokuapp.com")) {
    return "heroku";
  }

  // Production environment
  return "production";
};

// Automatic API base URL detection
export const getApiBaseUrl = (): string => {
  // Priority 1: Environment variable override
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log("🔧 Using configured VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Priority 2: Auto-detection based on environment
  const environment = detectEnvironment();
  
  if (typeof window === "undefined") {
    // Server-side: use environment variable or default
    return process.env.API_BASE_URL || "http://localhost:8080";
  }

  const { protocol, hostname, port } = window.location;
  
  console.log("🌍 Environment detected:", environment);
  console.log("📍 Current location:", { protocol, hostname, port });

  switch (environment) {
    case "development":
      // Development: Use relative URLs for same-origin requests
      // Vite dev server proxy will handle API routes
      return "";

    case "netlify":
      // Netlify: Use Netlify Functions or same origin
      if (import.meta.env.VITE_USE_NETLIFY_FUNCTIONS === "true") {
        return "/.netlify/functions";
      }
      return `${protocol}//${hostname}`;

    case "vercel":
      // Vercel: Use serverless functions or same origin
      return `${protocol}//${hostname}`;

    case "fly":
    case "railway":
    case "render":
    case "heroku":
      // Platform deployments: same origin
      return `${protocol}//${hostname}`;

    case "production":
    default:
      // Production: Check for different backend URL
      if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
      }
      // Default to same origin
      return `${protocol}//${hostname}`;
  }
};

// API Configuration object
export const API_CONFIG = {
  get baseUrl() {
    return getApiBaseUrl();
  },
  get environment() {
    return detectEnvironment();
  },
  timeout: 10000, // 10 seconds
  retryAttempts: 2,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Helper function to create complete API URLs
export const createApiUrl = (endpoint: string): string => {
  // Remove leading slash and 'api/' prefix if present
  const cleanEndpoint = endpoint
    .replace(/^\/+/, '')  // Remove leading slashes
    .replace(/^api\//, ''); // Remove 'api/' prefix

  const baseUrl = API_CONFIG.baseUrl;
  
  // Construct the full URL
  const fullUrl = baseUrl 
    ? `${baseUrl}/api/${cleanEndpoint}`
    : `/api/${cleanEndpoint}`;

  console.log("🔗 API URL:", {
    endpoint,
    cleanEndpoint,
    baseUrl,
    fullUrl,
    environment: API_CONFIG.environment
  });

  return fullUrl;
};

// Environment info for debugging
export const getEnvironmentInfo = () => {
  if (typeof window === "undefined") {
    return {
      environment: "server",
      baseUrl: API_CONFIG.baseUrl,
      userAgent: "server",
      location: "server"
    };
  }

  return {
    environment: API_CONFIG.environment,
    baseUrl: API_CONFIG.baseUrl,
    location: {
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      href: window.location.href
    },
    userAgent: navigator.userAgent.substring(0, 100),
    envVars: {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
      VITE_USE_NETLIFY_FUNCTIONS: import.meta.env.VITE_USE_NETLIFY_FUNCTIONS,
      NODE_ENV: import.meta.env.NODE_ENV,
      MODE: import.meta.env.MODE
    }
  };
};
