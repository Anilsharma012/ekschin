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
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    serverReachable: false,
    lastChecked: new Date(),
    connectionQuality: 'good'
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  const currentControllerRef = useRef<AbortController | null>(null);

  const checkConnection = async () => {
    // Prevent multiple concurrent checks
    if (isChecking || !isMountedRef.current) return;

    setIsChecking(true);

    // Cancel any existing request
    if (currentControllerRef.current) {
      currentControllerRef.current.abort();
    }

    const controller = new AbortController();
    currentControllerRef.current = controller;

    let timeoutId: NodeJS.Timeout;

    try {
      const startTime = Date.now();

      // Use a shorter timeout for better UX
      timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          controller.abort();
        }
      }, 3000);

      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });

      // Clear timeout if request completed successfully
      clearTimeout(timeoutId);

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;

      const latency = Date.now() - startTime;

      let quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline' = 'good';

      if (!navigator.onLine) {
        quality = 'offline';
      } else if (!response.ok) {
        quality = 'poor';
      } else if (latency < 200) {
        quality = 'excellent';
      } else if (latency < 500) {
        quality = 'good';
      } else if (latency < 1000) {
        quality = 'fair';
      } else {
        quality = 'poor';
      }

      setStatus({
        isOnline: navigator.onLine,
        serverReachable: response.ok,
        lastChecked: new Date(),
        connectionQuality: quality
      });

    } catch (error: any) {
      // Clear timeout on error
      if (timeoutId) clearTimeout(timeoutId);

      // Only update state if component is mounted and error isn't from abortion
      if (isMountedRef.current && error.name !== 'AbortError') {
        setStatus({
          isOnline: navigator.onLine,
          serverReachable: false,
          lastChecked: new Date(),
          connectionQuality: navigator.onLine ? 'poor' : 'offline'
        });
      }

      // Log non-abort errors for debugging
      if (error.name !== 'AbortError') {
        console.warn('Network check failed:', error.message);
      }
    } finally {
      // Clear the controller reference
      if (currentControllerRef.current === controller) {
        currentControllerRef.current = null;
      }

      // Only update checking state if component is mounted
      if (isMountedRef.current) {
        setIsChecking(false);
      }
    }
  };

  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;

    // Initial check after a small delay to ensure component is fully mounted
    const initialCheckTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        checkConnection();
      }
    }, 100);

    // Set up event listeners
    const handleOnline = () => {
      if (!isMountedRef.current) return;

      setStatus(prev => ({ ...prev, isOnline: true }));
      setIsVisible(true);

      // Debounce connection check
      setTimeout(() => {
        if (isMountedRef.current) {
          checkConnection();
        }
      }, 500);

      setTimeout(() => {
        if (isMountedRef.current) {
          setIsVisible(false);
        }
      }, 3000);
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

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check with longer interval to reduce load
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        checkConnection();
      }
    }, 60000); // Increased to 60 seconds

    // Show status if connection is poor (with delay to avoid flash)
    const statusCheckTimeout = setTimeout(() => {
      if (isMountedRef.current && (!status.isOnline || !status.serverReachable || status.connectionQuality === 'poor')) {
        setIsVisible(true);
      }
    }, 1000);

    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;

      // Cancel any pending requests
      if (currentControllerRef.current) {
        currentControllerRef.current.abort();
        currentControllerRef.current = null;
      }

      // Clear timeouts and intervals
      clearTimeout(initialCheckTimeout);
      clearTimeout(statusCheckTimeout);
      clearInterval(interval);

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

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card className={`border ${getStatusColor()}`}>
        <CardContent className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <div>
              <p className="text-sm font-medium">{getStatusText()}</p>
              <p className="text-xs opacity-75">
                Last checked: {status.lastChecked.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={checkConnection}
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
};

export default NetworkStatusComponent;
