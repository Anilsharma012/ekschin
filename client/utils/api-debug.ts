// API debugging utilities for monitoring and troubleshooting

export const debugApiCall = (endpoint: string, response: any, error?: any) => {
  const debugInfo = {
    endpoint,
    timestamp: new Date().toISOString(),
    status: response?.status || 'unknown',
    ok: response?.ok || false,
    error: error ? {
      name: error.name,
      message: error.message,
      type: error.constructor?.name
    } : null,
    fromFallback: response?.fromFallback || false
  };

  // Store in session storage for debugging
  const debugHistory = JSON.parse(sessionStorage.getItem('api-debug-history') || '[]');
  debugHistory.unshift(debugInfo);
  
  // Keep only last 50 entries
  if (debugHistory.length > 50) {
    debugHistory.splice(50);
  }
  
  sessionStorage.setItem('api-debug-history', JSON.stringify(debugHistory));
  
  // Log to console
  if (error) {
    console.debug('🔍 API Debug - Error:', debugInfo);
  } else {
    console.debug('🔍 API Debug - Success:', debugInfo);
  }
};

export const getApiDebugHistory = () => {
  return JSON.parse(sessionStorage.getItem('api-debug-history') || '[]');
};

export const clearApiDebugHistory = () => {
  sessionStorage.removeItem('api-debug-history');
};

// Monitor for common error patterns
export const monitorApiHealth = () => {
  const history = getApiDebugHistory();
  const recentErrors = history.filter(entry => 
    entry.error && 
    new Date(entry.timestamp).getTime() > Date.now() - 60000 // Last minute
  );
  
  const errorRate = recentErrors.length / Math.max(history.length, 1);
  
  if (errorRate > 0.5) {
    console.warn('⚠️ High API error rate detected:', {
      errorRate: `${Math.round(errorRate * 100)}%`,
      recentErrors: recentErrors.length,
      totalCalls: history.length
    });
  }
  
  return {
    errorRate,
    recentErrors: recentErrors.length,
    totalCalls: history.length,
    isHealthy: errorRate < 0.3
  };
};
