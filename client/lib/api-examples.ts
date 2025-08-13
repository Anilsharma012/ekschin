/**
 * API Client Usage Examples
 * 
 * This file demonstrates how to use the centralized API client
 * in your React components and pages.
 */

import { api } from './api-client';
import type { ApiRequestOptions } from './api-client';

// ============================================================================
// BASIC USAGE EXAMPLES
// ============================================================================

// GET request
export const getProperties = async () => {
  try {
    const properties = await api.get('properties');
    return properties;
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    throw error;
  }
};

// POST request with data
export const createProperty = async (propertyData: any) => {
  try {
    const newProperty = await api.post('properties', propertyData);
    return newProperty;
  } catch (error) {
    console.error('Failed to create property:', error);
    throw error;
  }
};

// PUT request with authentication
export const updateProperty = async (propertyId: string, updates: any, token: string) => {
  try {
    const updatedProperty = await api.put(
      `properties/${propertyId}`, 
      updates, 
      { token }
    );
    return updatedProperty;
  } catch (error) {
    console.error('Failed to update property:', error);
    throw error;
  }
};

// DELETE request
export const deleteProperty = async (propertyId: string, token: string) => {
  try {
    await api.delete(`properties/${propertyId}`, { token });
  } catch (error) {
    console.error('Failed to delete property:', error);
    throw error;
  }
};

// ============================================================================
// AUTHENTICATION EXAMPLES
// ============================================================================

// Login
export const loginUser = async (credentials: { email: string; password: string }) => {
  try {
    const response = await api.post('auth/login', credentials);
    // Store token in localStorage or context
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Get user profile with authentication
export const getUserProfile = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const profile = await api.get('auth/profile', { token });
    return profile;
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};

// ============================================================================
// FILE UPLOAD EXAMPLES
// ============================================================================

// Upload property images
export const uploadPropertyImages = async (propertyId: string, files: FileList, token: string) => {
  try {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });
    formData.append('propertyId', propertyId);

    const response = await api.upload(`properties/${propertyId}/images`, formData, { token });
    return response;
  } catch (error) {
    console.error('Failed to upload images:', error);
    throw error;
  }
};

// ============================================================================
// ADVANCED OPTIONS EXAMPLES
// ============================================================================

// Request with custom timeout
export const getPropertiesWithTimeout = async () => {
  try {
    const properties = await api.get('properties', { timeout: 5000 }); // 5 seconds
    return properties;
  } catch (error) {
    console.error('Request timed out or failed:', error);
    throw error;
  }
};

// Request without retry
export const getCriticalData = async () => {
  try {
    const data = await api.get('critical-data', { skipRetry: true });
    return data;
  } catch (error) {
    console.error('Critical request failed:', error);
    throw error;
  }
};

// Request with custom headers
export const getDataWithCustomHeaders = async () => {
  try {
    const data = await api.get('special-endpoint', {
      headers: {
        'X-Custom-Header': 'custom-value',
        'Accept': 'application/vnd.api+json'
      }
    });
    return data;
  } catch (error) {
    console.error('Request with custom headers failed:', error);
    throw error;
  }
};

// ============================================================================
// ERROR HANDLING EXAMPLES
// ============================================================================

// Comprehensive error handling
export const robustApiCall = async () => {
  try {
    const data = await api.get('some-endpoint');
    return { success: true, data };
  } catch (error: any) {
    // Handle different types of errors
    if (error.status === 401) {
      // Unauthorized - redirect to login
      console.log('User not authenticated, redirecting to login');
      // Redirect logic here
      return { success: false, error: 'Authentication required' };
    } else if (error.status === 403) {
      // Forbidden - user doesn't have permission
      return { success: false, error: 'Access denied' };
    } else if (error.status === 404) {
      // Not found
      return { success: false, error: 'Resource not found' };
    } else if (error.status >= 500) {
      // Server error
      return { success: false, error: 'Server error, please try again later' };
    } else if (error.status === 0) {
      // Network error
      return { success: false, error: 'Network error, please check your connection' };
    } else {
      // Other errors
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }
};

// ============================================================================
// REACT COMPONENT EXAMPLES
// ============================================================================

// Example React component using the API client
/*
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

const PropertiesComponent = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const data = await api.get('properties');
        setProperties(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleCreate = async (propertyData) => {
    try {
      const newProperty = await api.post('properties', propertyData, {
        token: localStorage.getItem('authToken')
      });
      setProperties(prev => [...prev, newProperty]);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {properties.map(property => (
        <div key={property.id}>{property.title}</div>
      ))}
    </div>
  );
};
*/

// ============================================================================
// HEALTH CHECK AND DEBUGGING
// ============================================================================

// Check API health
export const checkApiHealth = async () => {
  try {
    const health = await api.ping();
    console.log('API Health:', health);
    return health;
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
};

// Get environment information
export const getApiInfo = () => {
  const info = api.info();
  console.log('API Environment Info:', info);
  return info;
};

// Debug API configuration
export const debugApi = async () => {
  console.group('🔍 API Debug Information');
  
  try {
    const envInfo = api.info();
    console.log('Environment:', envInfo);
    
    const health = await api.ping();
    console.log('Health Check:', health);
    
    console.log('✅ API is working correctly');
  } catch (error) {
    console.error('❌ API Debug Failed:', error);
  }
  
  console.groupEnd();
};
