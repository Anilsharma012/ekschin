import { useState, useEffect } from "react";

interface ServiceStatus {
  isOnline: boolean;
  apiAvailable: boolean;
  websocketAvailable: boolean;
  lastChecked: Date;
}

export const useServiceAvailability = () => {
  const [status, setStatus] = useState<ServiceStatus>({
    isOnline: navigator.onLine,
    apiAvailable: true,
    websocketAvailable: true,
    lastChecked: new Date(),
  });

  const checkApiAvailability = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("/api/ping", {
        signal: controller.signal,
        cache: "no-cache",
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const checkWebSocketAvailability = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/websocket/test", {
        cache: "no-cache",
      });

      if (response.ok) {
        const data = await response.json();
        return data.success && data.websocket?.pushNotifications?.connected;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const checkAllServices = async () => {
    const isOnline = navigator.onLine;

    if (!isOnline) {
      setStatus({
        isOnline: false,
        apiAvailable: false,
        websocketAvailable: false,
        lastChecked: new Date(),
      });
      return;
    }

    const [apiAvailable, websocketAvailable] = await Promise.all([
      checkApiAvailability(),
      checkWebSocketAvailability(),
    ]);

    setStatus({
      isOnline,
      apiAvailable,
      websocketAvailable,
      lastChecked: new Date(),
    });
  };

  useEffect(() => {
    // Initial check
    checkAllServices();

    // Check periodically (every 30 seconds)
    const interval = setInterval(checkAllServices, 30000);

    // Listen for online/offline events
    const handleOnline = () => {
      setStatus((prev) => ({ ...prev, isOnline: true }));
      checkAllServices();
    };

    const handleOffline = () => {
      setStatus({
        isOnline: false,
        apiAvailable: false,
        websocketAvailable: false,
        lastChecked: new Date(),
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    ...status,
    refresh: checkAllServices,
    isFullyAvailable: status.isOnline && status.apiAvailable,
    hasPartialService:
      status.isOnline && (status.apiAvailable || status.websocketAvailable),
  };
};
