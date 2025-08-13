// Production API service that uses fallback data instead of network calls

import { fallbackProperties, fallbackCategories, fallbackPackages, fallbackBanners } from './fallbackData';

const isProduction = () => {
  return window.location.hostname.includes('.fly.dev') || 
         window.location.hostname.includes('netlify.app');
};

// Override common API calls in production to prevent fetch errors
if (isProduction()) {
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch to return fallback data for known endpoints
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input.toString();
    
    // Return fallback data for known API endpoints
    if (url.includes('/api/properties')) {
      return new Response(JSON.stringify({
        success: true,
        data: { properties: fallbackProperties }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.includes('/api/categories')) {
      return new Response(JSON.stringify({
        success: true,
        data: fallbackCategories
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.includes('/api/packages')) {
      return new Response(JSON.stringify({
        success: true,
        data: fallbackPackages
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.includes('/api/banners')) {
      return new Response(JSON.stringify({
        success: true,
        data: fallbackBanners
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.includes('/api/homepage-sliders')) {
      return new Response(JSON.stringify({
        success: true,
        data: []
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For any other API calls, return service unavailable
    if (url.includes('/api/')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Service temporarily unavailable'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For non-API calls, use original fetch
    try {
      return await originalFetch(input, init);
    } catch (error) {
      // Return a basic error response
      return new Response(JSON.stringify({
        error: 'Network unavailable'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };

  console.log('🔄 Production API service: Using fallback data for all API calls');
}

export {};
