import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  MessageSquare,
  Package,
  Bell
} from 'lucide-react';

interface ConnectionStatus {
  endpoint: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  error?: string;
  lastConnected?: Date;
}

const WebSocketTest: React.FC = () => {
  const [connections, setConnections] = useState<ConnectionStatus[]>([
    { endpoint: '/ws/chat', status: 'disconnected' },
    { endpoint: '/ws/packages', status: 'disconnected' },
    { endpoint: '/ws/notifications', status: 'disconnected' }
  ]);

  const testConnection = (endpoint: string) => {
    // Skip WebSocket testing in production
    const isProduction = window.location.hostname.includes(".fly.dev");
    if (isProduction) {
      setConnections(prev =>
        prev.map(conn =>
          conn.endpoint === endpoint
            ? { ...conn, status: 'error', error: 'WebSocket testing disabled in production' }
            : conn
        )
      );
      return;
    }

    setConnections(prev =>
      prev.map(conn =>
        conn.endpoint === endpoint
          ? { ...conn, status: 'connecting', error: undefined }
          : conn
      )
    );

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}${endpoint}`;

      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        setConnections(prev => 
          prev.map(conn => 
            conn.endpoint === endpoint 
              ? { ...conn, status: 'error', error: 'Connection timeout' }
              : conn
          )
        );
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        setConnections(prev => 
          prev.map(conn => 
            conn.endpoint === endpoint 
              ? { ...conn, status: 'connected', lastConnected: new Date() }
              : conn
          )
        );
        
        // Close after successful connection test
        setTimeout(() => {
          ws.close();
          setConnections(prev => 
            prev.map(conn => 
              conn.endpoint === endpoint 
                ? { ...conn, status: 'disconnected' }
                : conn
            )
          );
        }, 1000);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error(`WebSocket error for ${endpoint}:`, error);
        setConnections(prev => 
          prev.map(conn => 
            conn.endpoint === endpoint 
              ? { 
                  ...conn, 
                  status: 'error', 
                  error: `Connection failed: ${error.type || 'Unknown error'}`
                }
              : conn
          )
        );
      };

      ws.onclose = (event) => {
        clearTimeout(timeout);
        if (event.code !== 1000) { // Not a normal closure
          setConnections(prev => 
            prev.map(conn => 
              conn.endpoint === endpoint 
                ? { 
                    ...conn, 
                    status: 'error', 
                    error: `Connection closed: ${event.code} ${event.reason || 'Unknown reason'}`
                  }
                : conn
            )
          );
        }
      };
    } catch (error) {
      setConnections(prev => 
        prev.map(conn => 
          conn.endpoint === endpoint 
            ? { 
                ...conn, 
                status: 'error', 
                error: `Failed to create WebSocket: ${error}`
              }
            : conn
        )
      );
    }
  };

  const testAllConnections = () => {
    connections.forEach(conn => {
      setTimeout(() => testConnection(conn.endpoint), Math.random() * 1000);
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      connected: 'default',
      connecting: 'secondary',
      error: 'destructive',
      disconnected: 'outline'
    };
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getEndpointIcon = (endpoint: string) => {
    switch (endpoint) {
      case '/ws/chat':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case '/ws/packages':
        return <Package className="h-4 w-4 text-purple-500" />;
      case '/ws/notifications':
        return <Bell className="h-4 w-4 text-orange-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEndpointName = (endpoint: string) => {
    switch (endpoint) {
      case '/ws/chat':
        return 'Chat Messages';
      case '/ws/packages':
        return 'Package Sync';
      case '/ws/notifications':
        return 'Push Notifications';
      default:
        return endpoint;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>WebSocket Connection Test</CardTitle>
            <Button onClick={testAllConnections} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Test All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {connections.map((conn) => (
              <div key={conn.endpoint} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getEndpointIcon(conn.endpoint)}
                  {getStatusIcon(conn.status)}
                  <div>
                    <h4 className="font-medium">{getEndpointName(conn.endpoint)}</h4>
                    <p className="text-sm text-gray-600">{conn.endpoint}</p>
                    {conn.lastConnected && (
                      <p className="text-xs text-gray-400">
                        Last connected: {conn.lastConnected.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(conn.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testConnection(conn.endpoint)}
                    disabled={conn.status === 'connecting'}
                  >
                    Test
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {connections.some(conn => conn.error) && (
            <Alert variant="destructive" className="mt-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {connections
                    .filter(conn => conn.error)
                    .map(conn => (
                      <div key={conn.endpoint}>
                        <strong>{conn.endpoint}:</strong> {conn.error}
                      </div>
                    ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Connection Instructions:</h5>
            <ul className="text-sm space-y-1 text-gray-600">
              <li>• <strong>Chat Messages:</strong> Real-time messaging between users</li>
              <li>• <strong>Package Sync:</strong> Live package updates across dashboards</li>
              <li>• <strong>Push Notifications:</strong> Admin notifications to users</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebSocketTest;
