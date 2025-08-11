import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Activity,
  Server,
  MessageSquare,
  Bell
} from 'lucide-react';

const WebSocketDebug: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth();
  const { 
    notifications, 
    isConnected, 
    unreadCount, 
    requestNotificationPermission 
  } = usePushNotifications();
  
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const checkServerStatus = async () => {
    try {
      addLog('Checking server WebSocket status...');
      const response = await fetch('/api/debug/websocket/status');
      const data = await response.json();
      
      if (data.success) {
        setServerStatus(data.data);
        addLog(`✅ Server status: ${data.data.pushNotificationService.connectedUsers.length} users connected`);
      } else {
        addLog(`❌ Server status check failed: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ Failed to check server status: ${error.message}`);
    }
  };

  const testConnection = async () => {
    if (!user) {
      addLog('❌ No user logged in');
      return;
    }

    setTesting(true);
    try {
      addLog('Testing WebSocket connection...');
      
      const response = await fetch('/api/debug/websocket/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id || user._id })
      });

      const data = await response.json();
      
      if (data.success) {
        const status = data.data.isConnected ? '✅ Connected' : '❌ Not Connected';
        addLog(`Connection test result: ${status}`);
      } else {
        addLog(`❌ Connection test failed: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ Connection test error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const sendTestNotification = async () => {
    if (!user || !token) return;

    try {
      addLog('Sending test notification...');
      
      const response = await fetch('/api/test/push-notification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id || user._id,
          title: 'Test Notification',
          message: `Test sent at ${new Date().toLocaleTimeString()}`,
          type: 'info'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        addLog('✅ Test notification sent successfully');
      } else {
        addLog(`❌ Test notification failed: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ Test notification error: ${error.message}`);
    }
  };

  useEffect(() => {
    checkServerStatus();
    
    // Log connection state changes
    if (isConnected) {
      addLog('🔔 Push notifications connected');
    } else {
      addLog('📵 Push notifications disconnected');
    }
  }, [isConnected]);

  useEffect(() => {
    // Log new notifications
    if (notifications.length > 0) {
      addLog(`📬 Received notification: ${notifications[0].title}`);
    }
  }, [notifications.length]);

  if (!isAuthenticated) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please login to test WebSocket connectivity.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-500" />
            WebSocket Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className={`${isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-lg font-bold">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                  {isConnected ? (
                    <Wifi className="h-8 w-8 text-green-500" />
                  ) : (
                    <WifiOff className="h-8 w-8 text-red-500" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notifications</p>
                    <p className="text-lg font-bold">{notifications.length}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Unread</p>
                    <p className="text-lg font-bold">{unreadCount}</p>
                  </div>
                  <Bell className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Server Users</p>
                    <p className="text-lg font-bold">
                      {serverStatus?.pushNotificationService?.connectedUsers || 0}
                    </p>
                  </div>
                  <Server className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex space-x-4">
            <Button onClick={checkServerStatus} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Server Status
            </Button>
            <Button onClick={testConnection} disabled={testing}>
              {testing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>
            <Button onClick={sendTestNotification} disabled={!isConnected}>
              <Bell className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>
            <Button onClick={requestNotificationPermission} variant="outline">
              Enable Browser Notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connection Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {connectionLogs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              connectionLogs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Server Status Details */}
      {serverStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Server Status Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Push Notification Service</h4>
                <div className="text-sm space-y-1">
                  <p>Connected Users: {serverStatus.pushNotificationService.connectedUsers}</p>
                  <p>Initialized: {serverStatus.pushNotificationService.isInitialized ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Server Info</h4>
                <div className="text-sm space-y-1">
                  <p>Environment: {serverStatus.serverInfo.env}</p>
                  <p>Uptime: {Math.floor(serverStatus.serverInfo.uptime / 60)} minutes</p>
                  <p>Memory Usage: {Math.round(serverStatus.serverInfo.memory.used / 1024 / 1024)} MB</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications received</p>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WebSocketDebug;
