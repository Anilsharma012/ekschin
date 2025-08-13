import React, { useState, useEffect } from 'react';
import { X, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface OfflineModeNotificationProps {
  isBackendUnavailable: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
}

const OfflineModeNotification: React.FC<OfflineModeNotificationProps> = ({
  isBackendUnavailable,
  onDismiss,
  onRetry
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Show notification after 10 seconds if backend is still unavailable
    const timer = setTimeout(() => {
      if (isBackendUnavailable && !isDismissed) {
        setShowNotification(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isBackendUnavailable, isDismissed]);

  useEffect(() => {
    // Hide notification when backend becomes available
    if (!isBackendUnavailable) {
      setShowNotification(false);
      setIsDismissed(false);
    }
  }, [isBackendUnavailable]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowNotification(false);
    onDismiss?.();
  };

  const handleRetry = () => {
    onRetry?.();
  };

  if (!showNotification || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="border-orange-200 bg-orange-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-900 text-sm">
                  Limited Connectivity
                </h3>
                <p className="text-orange-800 text-xs mt-1">
                  Some features may be temporarily unavailable. The app will continue to work with cached data.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="mt-3 flex items-center gap-2 text-xs text-orange-700">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Offline features available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span>Server connection limited</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineModeNotification;
