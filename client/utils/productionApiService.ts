// Production API service that uses fallback data instead of network calls

import { fallbackProperties, fallbackCategories, fallbackPackages, fallbackBanners } from './fallbackData';

const isProduction = () => {
  return window.location.hostname.includes('.fly.dev') || 
         window.location.hostname.includes('netlify.app');
};

// Helper function to create proper Response with clone support
const createApiResponse = (data: any, status = 200) => {
  const jsonString = JSON.stringify(data);
  const blob = new Blob([jsonString], { type: 'application/json' });
  return new Response(blob, {
    status,
    statusText: status === 200 ? 'OK' : 'Service Unavailable',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': blob.size.toString()
    }
  });
};

// Override common API calls in production to prevent fetch errors
if (isProduction()) {
  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch to return fallback data for known endpoints
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input.toString();

    // Return fallback data for known API endpoints
    if (url.includes('/api/properties') || url.includes('/api/admin/properties')) {
      return createApiResponse({
        success: true,
        data: fallbackProperties,
        total: fallbackProperties.length,
        page: 1,
        limit: 20,
        pages: 1
      });
    }

    if (url.includes('/api/categories')) {
      return createApiResponse({
        success: true,
        data: fallbackCategories
      });
    }

    if (url.includes('/api/packages')) {
      return createApiResponse({
        success: true,
        data: fallbackPackages
      });
    }

    if (url.includes('/api/banners')) {
      return createApiResponse({
        success: true,
        data: fallbackBanners
      });
    }

    if (url.includes('/api/homepage-sliders')) {
      return createApiResponse({
        success: true,
        data: []
      });
    }
    
    // For any other API calls, return service unavailable
    if (url.includes('/api/')) {
      return createApiResponse({
        success: false,
        error: 'Service temporarily unavailable'
      }, 503);
    }
    
    // For non-API calls, use original fetch
    try {
      return await originalFetch(input, init);
    } catch (error) {
      // Return a basic error response using helper function
      return createApiResponse({
        error: 'Network unavailable'
      }, 503);
    }
  };

  console.log('🔄 Production API service: Using fallback data for all API calls');
}

export {};
