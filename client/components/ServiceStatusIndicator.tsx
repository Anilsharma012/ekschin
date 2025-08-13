import React from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useServiceAvailability } from '../hooks/useServiceAvailability';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface ServiceStatusIndicatorProps {
  compact?: boolean;
  showDetails?: boolean;
}

const ServiceStatusIndicator: React.FC<ServiceStatusIndicatorProps> = ({ 
  compact = false, 
  showDetails = false 
}) => {
  const { 
    isOnline, 
    apiAvailable, 
    websocketAvailable, 
    lastChecked, 
    refresh,
    isFullyAvailable,
    hasPartialService
  } = useServiceAvailability();

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4 text-red-500" />;
    if (isFullyAvailable) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (hasPartialService) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isFullyAvailable) return 'All services available';
    if (hasPartialService) return 'Limited service';
    return 'Service unavailable';
  };

  const getStatusColor = () => {
    if (!isOnline || !hasPartialService) return 'bg-red-50 border-red-200 text-red-800';
    if (isFullyAvailable) return 'bg-green-50 border-green-200 text-green-800';
    return 'bg-yellow-50 border-yellow-200 text-yellow-800';
  };

  // Don't show in production if everything is working fine
  const isProduction = window.location.hostname.includes('.fly.dev');
  if (isProduction && isFullyAvailable && !showDetails) {
    return null;
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
    );
  }

  return (
    <Card className={`border ${getStatusColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-medium">{getStatusText()}</h3>
              {showDetails && (
                <div className="text-xs mt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-3 w-3" />
                    <span>Network: {isOnline ? 'Connected' : 'Offline'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${apiAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>API: {apiAvailable ? 'Available' : 'Unavailable'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${websocketAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Real-time: {websocketAvailable ? 'Available' : 'Unavailable'}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>

        {!isFullyAvailable && (
          <div className="mt-3 text-xs">
            {!isOnline && (
              <p>You're currently offline. Some features may not work properly.</p>
            )}
            {isOnline && !apiAvailable && (
              <p>Server is temporarily unavailable. Using cached data when possible.</p>
            )}
            {isOnline && apiAvailable && !websocketAvailable && (
              <p>Real-time notifications are currently unavailable.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceStatusIndicator;
