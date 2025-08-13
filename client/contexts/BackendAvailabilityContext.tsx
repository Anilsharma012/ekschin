import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BackendAvailabilityState {
  isBackendAvailable: boolean;
  isApiAvailable: boolean;
  isWebSocketAvailable: boolean;
  isProduction: boolean;
  lastHealthCheck: Date | null;
  checkInProgress: boolean;
}

interface BackendAvailabilityContextValue extends BackendAvailabilityState {
  checkBackendHealth: () => Promise<void>;
  markApiUnavailable: () => void;
  markWebSocketUnavailable: () => void;
}

const BackendAvailabilityContext = createContext<BackendAvailabilityContextValue | null>(null);

export const useBackendAvailability = () => {
  const context = useContext(BackendAvailabilityContext);
  if (!context) {
    throw new Error('useBackendAvailability must be used within BackendAvailabilityProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export const BackendAvailabilityProvider: React.FC<Props> = ({ children }) => {
  const [state, setState] = useState<BackendAvailabilityState>({
    isBackendAvailable: true,
    isApiAvailable: true,
    isWebSocketAvailable: true,
    isProduction: window.location.hostname.includes('.fly.dev') || window.location.hostname.includes('netlify.app'),
    lastHealthCheck: null,
    checkInProgress: false
  });

  const checkBackendHealth = async () => {
    if (state.checkInProgress) return;

    setState(prev => ({ ...prev, checkInProgress: true }));

    try {
      // Quick API health check
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const apiResponse = await fetch('/api/ping', {
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      const isApiAvailable = apiResponse.ok;

      // Quick WebSocket health check
      let isWebSocketAvailable = false;
      try {
        const wsResponse = await fetch('/api/websocket/test', {
          cache: 'no-cache'
        });
        if (wsResponse.ok) {
          const wsData = await wsResponse.json();
          isWebSocketAvailable = wsData.success || false;
        }
      } catch {
        isWebSocketAvailable = false;
      }

      const isBackendAvailable = isApiAvailable || isWebSocketAvailable;

      setState(prev => ({
        ...prev,
        isBackendAvailable,
        isApiAvailable,
        isWebSocketAvailable,
        lastHealthCheck: new Date(),
        checkInProgress: false
      }));

      // In production, if backend is completely unavailable, reduce check frequency
      if (state.isProduction && !isBackendAvailable) {
        console.log('🔴 Backend completely unavailable in production, switching to offline mode');
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isBackendAvailable: false,
        isApiAvailable: false,
        isWebSocketAvailable: false,
        lastHealthCheck: new Date(),
        checkInProgress: false
      }));

      // Don't spam console in production
      if (!state.isProduction) {
        console.error('Backend health check failed:', error);
      }
    }
  };

  const markApiUnavailable = () => {
    setState(prev => ({
      ...prev,
      isApiAvailable: false,
      isBackendAvailable: prev.isWebSocketAvailable
    }));
  };

  const markWebSocketUnavailable = () => {
    setState(prev => ({
      ...prev,
      isWebSocketAvailable: false,
      isBackendAvailable: prev.isApiAvailable
    }));
  };

  useEffect(() => {
    // Initial health check
    checkBackendHealth();

    // Set up periodic health checks
    // In production with failed backend, check less frequently
    const checkInterval = state.isProduction && !state.isBackendAvailable ? 60000 : 30000;
    
    const interval = setInterval(checkBackendHealth, checkInterval);

    // Listen for online/offline events
    const handleOnline = () => {
      setTimeout(checkBackendHealth, 1000); // Delay to allow connection to stabilize
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isBackendAvailable: false,
        isApiAvailable: false,
        isWebSocketAvailable: false
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.isProduction, state.isBackendAvailable]);

  const contextValue: BackendAvailabilityContextValue = {
    ...state,
    checkBackendHealth,
    markApiUnavailable,
    markWebSocketUnavailable
  };

  return (
    <BackendAvailabilityContext.Provider value={contextValue}>
      {children}
    </BackendAvailabilityContext.Provider>
  );
};
