import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

export const usePushNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  // Show browser notification
  const showBrowserNotification = (notification: PushNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };
    }
  };

  // Connect to WebSocket for real-time notifications
  const connectWebSocket = () => {
    if (!isAuthenticated || !user || wsRef.current) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;

      console.log('🔄 Connecting to push notification service at:', wsUrl);
      console.log('📊 Connection context:', {
        protocol,
        host: window.location.host,
        isAuthenticated,
        userId: user?.id || user?._id,
        userType: user?.userType,
        reconnectAttempt: reconnectAttempts.current
      });

      wsRef.current = new WebSocket(wsUrl);

      // Add additional logging for WebSocket state changes
      wsRef.current.addEventListener('error', (event) => {
        console.error('📡 Raw WebSocket error event:', {
          type: event.type,
          timeStamp: event.timeStamp,
          isTrusted: event.isTrusted,
          target: {
            url: event.target?.url,
            readyState: event.target?.readyState,
            protocol: event.target?.protocol
          }
        });
      });

      wsRef.current.onopen = () => {
        console.log('🔔 Connected to push notification service');
        setIsConnected(true);
        reconnectAttempts.current = 0; // Reset reconnection attempts on success

        // Authenticate with user ID
        if (wsRef.current && user) {
          const authMessage = {
            type: 'auth',
            userId: user.id || user._id,
            userType: user.userType || 'user'
          };
          console.log('🔐 Sending auth message:', authMessage);
          wsRef.current.send(JSON.stringify(authMessage));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'push_notification') {
            const notification: PushNotification = {
              ...data.data,
              timestamp: new Date(data.data.timestamp)
            };
            
            // Add to notifications list
            setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
            
            // Show browser notification
            showBrowserNotification(notification);
            
            console.log('📱 Received push notification:', notification.title);
          } else if (data.type === 'auth_success') {
            console.log('✅ Authenticated for push notifications');
          }
        } catch (error) {
          console.error('Error parsing notification message:', {
            error: error instanceof Error ? error.message : String(error),
            data: event.data,
            type: typeof event.data
          });
        }
      };

      wsRef.current.onclose = () => {
        console.log('🚪 Disconnected from push notification service');
        setIsConnected(false);
        wsRef.current = null;

        // Exponential backoff reconnection
        if (isAuthenticated && user && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Reconnecting to push notifications in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

          setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.warn('⚠️ Max reconnection attempts reached for push notifications');
        }
      };

      wsRef.current.onerror = (error) => {
        // Enhanced error serialization to avoid [object Object] logging
        const getErrorDetails = (err: any) => {
          if (err instanceof Event) {
            return {
              type: err.type || 'WebSocket Error',
              target: err.target ? {
                url: (err.target as any).url || 'Unknown URL',
                readyState: (err.target as any).readyState || 'Unknown state',
                protocol: (err.target as any).protocol || 'Unknown protocol'
              } : 'No target',
              timestamp: new Date().toISOString(),
              message: 'WebSocket connection error occurred'
            };
          } else if (err instanceof Error) {
            return {
              type: 'Error',
              message: err.message,
              name: err.name,
              stack: err.stack,
              timestamp: new Date().toISOString()
            };
          } else {
            return {
              type: 'Unknown Error',
              message: typeof err === 'string' ? err : 'Unknown WebSocket error',
              raw: err && typeof err === 'object' ? JSON.stringify(err, null, 2) : String(err),
              timestamp: new Date().toISOString()
            };
          }
        };

        const errorDetails = getErrorDetails(error);
        console.error('🔴 Push notification WebSocket error:', errorDetails);
        setIsConnected(false);

        // Attempt reconnection after error
        if (isAuthenticated && user) {
          console.log('🔄 Attempting to reconnect push notifications in 5 seconds...');
          setTimeout(connectWebSocket, 5000);
        }
      };
    } catch (error) {
      console.error('Failed to connect to push notification service:', error);
    }
  };

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read: true }
              : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !('read' in n) || !n.read).length;

  useEffect(() => {
    if (isAuthenticated && user) {
      requestNotificationPermission();
      connectWebSocket();
    } else {
      disconnectWebSocket();
      setNotifications([]);
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isAuthenticated, user]);

  return {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    clearAllNotifications,
    requestNotificationPermission,
  };
};
