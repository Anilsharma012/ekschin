import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';

export default function WebSocketErrorTest() {
  const [connectionState, setConnectionState] = useState<string>('Disconnected');
  const [logs, setLogs] = useState<string[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const testConnectionToValidEndpoint = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
      
      addLog(`🔄 Testing valid WebSocket connection to: ${wsUrl}`);
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setConnectionState('Connected');
        addLog('✅ WebSocket connected successfully');
      };
      
      wsRef.current.onclose = (event) => {
        setConnectionState('Disconnected');
        addLog(`🚪 WebSocket closed: ${event.code} ${event.reason || ''}`);
      };
      
      wsRef.current.onerror = (error) => {
        setConnectionState('Error');
        setErrorCount(prev => prev + 1);
        
        // Test our improved error handling
        try {
          const errorInfo = {
            type: typeof error,
            constructor: error.constructor?.name || 'Unknown',
            isEvent: error instanceof Event,
            isError: error instanceof Error,
            message: error instanceof Error ? error.message : 'No message available',
            target: error.target ? {
              url: (error.target as any)?.url || 'unknown',
              readyState: (error.target as any)?.readyState || 'unknown',
              protocol: (error.target as any)?.protocol || 'unknown'
            } : null
          };
          
          addLog(`❌ WebSocket error (improved handling): ${JSON.stringify(errorInfo, null, 2)}`);
        } catch (e) {
          addLog(`❌ Error handling failed: ${e}`);
        }
      };
      
    } catch (error) {
      addLog(`❌ Failed to create WebSocket: ${error}`);
    }
  };

  const testConnectionToInvalidEndpoint = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const invalidUrl = 'ws://invalid-url:9999/invalid-endpoint';
      addLog(`🔄 Testing invalid WebSocket connection to: ${invalidUrl}`);
      wsRef.current = new WebSocket(invalidUrl);
      
      wsRef.current.onopen = () => {
        setConnectionState('Connected');
        addLog('✅ WebSocket connected (unexpected)');
      };
      
      wsRef.current.onclose = (event) => {
        setConnectionState('Disconnected');
        addLog(`🚪 WebSocket closed: ${event.code} ${event.reason || ''}`);
      };
      
      wsRef.current.onerror = (error) => {
        setConnectionState('Error');
        setErrorCount(prev => prev + 1);
        
        // Test our error handling with invalid endpoint
        try {
          const errorInfo = {
            type: typeof error,
            constructor: error.constructor?.name || 'Unknown',
            isEvent: error instanceof Event,
            isError: error instanceof Error,
            timestamp: new Date().toISOString(),
            target: error.target ? {
              url: (error.target as any)?.url || 'unknown',
              readyState: (error.target as any)?.readyState || 'unknown'
            } : null
          };
          
          addLog(`❌ Expected error (invalid URL): ${JSON.stringify(errorInfo, null, 2)}`);
        } catch (e) {
          addLog(`❌ Error serialization failed: ${e}`);
        }
      };
      
    } catch (error) {
      addLog(`❌ Failed to create invalid WebSocket: ${error}`);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setConnectionState('Disconnected');
      addLog('🚪 Manually disconnected');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setErrorCount(0);
  };

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            WebSocket Error Handling Test
            <div className="flex gap-2">
              <Badge variant={connectionState === 'Connected' ? 'default' : connectionState === 'Error' ? 'destructive' : 'secondary'}>
                {connectionState}
              </Badge>
              {errorCount > 0 && (
                <Badge variant="destructive">
                  {errorCount} errors
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This component tests WebSocket error handling to ensure errors are properly serialized and don't show "[object Object]".
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={testConnectionToValidEndpoint} variant="default">
              Test Valid Connection
            </Button>
            <Button onClick={testConnectionToInvalidEndpoint} variant="secondary">
              Test Invalid Connection
            </Button>
            <Button onClick={disconnect} variant="outline">
              Disconnect
            </Button>
            <Button onClick={clearLogs} variant="outline">
              Clear Logs
            </Button>
          </div>

          <div className="bg-black text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
            <div className="mb-2 text-white">WebSocket Error Test Logs:</div>
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click a test button to start.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1 break-all">
                  {log}
                </div>
              ))
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Expected behavior:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Valid connection should connect and show proper connection info</li>
              <li>Invalid connection should fail with detailed error information</li>
              <li>No "[object Object]" should appear in the logs</li>
              <li>All error information should be properly formatted JSON</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
