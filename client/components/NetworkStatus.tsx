import React, { useState, useEffect, useRef } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  X 
} from 'lucide-react';

interface NetworkStatus {
  isOnline: boolean;
  serverReachable: boolean;
  lastChecked: Date;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
}

const NetworkStatusComponent: React.FC = () => {
  // Feature flag to disable network status if needed
  const NETWORK_STATUS_ENABLED = process.env.NODE_ENV === 'development' ||
    import.meta.env.VITE_ENABLE_NETWORK_STATUS !== 'false';

  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    serverReachable: false,
    lastChecked: new Date(),
    connectionQuality: 'good'
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Early return if disabled
  if (!NETWORK_STATUS_ENABLED) {
    return null;
  }

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkConnection = async () => {
    // Prevent multiple concurrent checks
    if (isChecking || !isMountedRef.current) return;

    setIsChecking(true);

    try {
      const startTime = Date.now();

      // Simple fetch with basic error handling - no AbortController
      let response: Response | null = null;
      let fetchError: Error | null = null;

      // Simplified fetch with minimal error-prone logic
      try {
        // Only check health endpoint, no fallback to reduce complexity
        const fetchPromise = fetch('/api/health', {
          method: 'GET',
          cache: 'no-cache',
          headers: {
            'Accept': 'application/json'
          }
        });

        // Race with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), 8000);
        });

        response = await Promise.race([fetchPromise, timeoutPromise]);

        // Validate response
        if (response && typeof response.ok !== 'undefined') {
          // Response is valid
          fetchError = null;
        } else {
          fetchError = new Error('Invalid response received');
        }

      } catch (error: any) {
        fetchError = error;
        response = null;

        // Don't attempt fallback to reduce complexity and potential errors
        // Just mark as unreachable and continue
      }

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;

      const latency = Date.now() - startTime;
      let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline' = 'poor';
      let serverReachable = false;

      if (!navigator.onLine) {
        quality = 'offline';
      } else if (response && response.ok) {
        serverReachable = true;
        if (latency < 300) {
          quality = 'excellent';
        } else if (latency < 800) {
          quality = 'good';
        } else if (latency < 2000) {
          quality = 'fair';
        } else {
          quality = 'poor';
        }
      } else {
        // Server not reachable or error occurred
        quality = navigator.onLine ? 'poor' : 'offline';
      }

      setStatus({
        isOnline: navigator.onLine,
        serverReachable,
        lastChecked: new Date(),
        connectionQuality: quality
      });

    } catch (error: any) {
      // Only update state if component is mounted
      if (isMountedRef.current) {
        setStatus({
          isOnline: navigator.onLine,
          serverReachable: false,
          lastChecked: new Date(),
          connectionQuality: navigator.onLine ? 'poor' : 'offline'
        });
      }

      // Only log meaningful errors
      if (!error.message.includes('timeout') && !error.message.includes('abort')) {
        console.warn('Network check failed:', error.message);
      }
    } finally {
      // Only update checking state if component is mounted
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  };

  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;

    // Set up event listeners for network status
    const handleOnline = () => {
      if (!isMountedRef.current) return;

      setStatus(prev => ({ ...prev, isOnline: true }));
      setIsVisible(true);

      // Check connection after network comes back online
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      checkTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          checkConnection();
        }
      }, 1000);

      // Hide status after showing online notification
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsVisible(false);
        }
      }, 4000);
    };

    const handleOffline = () => {
      if (!isMountedRef.current) return;

      setStatus(prev => ({
        ...prev,
        isOnline: false,
        serverReachable: false,
        connectionQuality: 'offline'
      }));
      setIsVisible(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection check with delay
    const initialCheck = setTimeout(() => {
      if (isMountedRef.current) {
        checkConnection();
      }
    }, 2000);

    // Periodic health check - less frequent to reduce errors
    const healthInterval = setInterval(() => {
      if (isMountedRef.current && navigator.onLine) {
        checkConnection();
      }
    }, 120000); // Check every 2 minutes when online

    // Show status indicator for poor connections
    const statusCheck = setTimeout(() => {
      if (isMountedRef.current && (!status.isOnline || !status.serverReachable || status.connectionQuality === 'poor')) {
        setIsVisible(true);
      }
    }, 3000);

    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;

      // Clear all timeouts and intervals
      clearTimeout(initialCheck);
      clearTimeout(statusCheck);
      clearInterval(healthInterval);

      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }

      // Remove event listeners
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    if (!status.serverReachable) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }

    switch (status.connectionQuality) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fair':
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (!status.isOnline) {
      return 'Offline';
    }
    
    if (!status.serverReachable) {
      return 'Server Unreachable';
    }

    switch (status.connectionQuality) {
      case 'excellent':
        return 'Excellent Connection';
      case 'good':
        return 'Good Connection';
      case 'fair':
        return 'Fair Connection';
      case 'poor':
        return 'Poor Connection';
      default:
        return 'Unknown Status';
    }
  };

  const getStatusColor = () => {
    if (!status.isOnline || status.connectionQuality === 'offline') {
      return 'bg-red-100 border-red-200 text-red-800';
    }
    
    if (!status.serverReachable || status.connectionQuality === 'poor') {
      return 'bg-orange-100 border-orange-200 text-orange-800';
    }

    if (status.connectionQuality === 'fair') {
      return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    }

    return 'bg-green-100 border-green-200 text-green-800';
  };

  // Only show status for poor connections or offline - hide for good/excellent connections
  if (!isVisible || status.connectionQuality === 'excellent' || status.connectionQuality === 'good') {
    return null;
  }

  // Safe wrapper to prevent any rendering errors
  try {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <Card className={`border ${getStatusColor()}`}>
          <CardContent className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <div>
                <p className="text-sm font-medium">{getStatusText()}</p>
                <p className="text-xs opacity-75">
                  Last checked: {status.lastChecked?.toLocaleTimeString() || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  try {
                    checkConnection();
                  } catch (error) {
                    console.warn('Manual connection check failed:', error);
                  }
                }}
                disabled={isChecking}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (renderError) {
    // If rendering fails for any reason, return null to prevent app crash
    console.warn('NetworkStatus render error:', renderError);
    return null;
  }
};

export default NetworkStatusComponent;
