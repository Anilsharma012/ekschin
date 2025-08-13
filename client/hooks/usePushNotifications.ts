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

  // Safe logging utility to prevent [object Object] errors
  const safeLog = (level: 'log' | 'error' | 'warn', message: string, data?: any) => {
    try {
      if (data && typeof data === 'object') {
        console[level](message, JSON.stringify(data, null, 2));
      } else {
        console[level](message, data);
      }
    } catch (e) {
      console[level](message, `[Serialization failed: ${String(data)}]`);
    }
  };

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
      // Environment detection
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isProduction = window.location.hostname.includes('.fly.dev');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      // Use the same host as the current page for WebSocket connection
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;

      console.log('🔄 Connecting to push notification service at:', wsUrl);
      console.log('🌍 Environment details:', {
        isLocalhost,
        isProduction,
        hostname: window.location.hostname,
        port: window.location.port,
        protocol: window.location.protocol
      });
      safeLog('log', '📊 Connection context:', {
        protocol,
        host: window.location.host,
        isAuthenticated,
        userId: user?.id || user?._id,
        userType: user?.userType,
        reconnectAttempt: reconnectAttempts.current
      });

      // Check if WebSocket is supported
      if (typeof WebSocket === 'undefined') {
        console.warn('⚠️ WebSocket not supported in this environment');
        return;
      }

      // In production, add a small delay before connecting to avoid rapid connection attempts
      if (isProduction && reconnectAttempts.current > 0) {
        console.log('🕐 Production environment: Adding connection delay...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      wsRef.current = new WebSocket(wsUrl);

      // Add additional logging for WebSocket state changes
      wsRef.current.addEventListener('error', (event) => {
        console.error('📡 Raw WebSocket error event:', JSON.stringify({
          type: event.type,
          timeStamp: event.timeStamp,
          isTrusted: event.isTrusted,
          target: event.target ? {
            url: (event.target as any)?.url || 'unknown',
            readyState: (event.target as any)?.readyState || 'unknown',
            protocol: (event.target as any)?.protocol || 'unknown'
          } : null
        }, null, 2));
      });

      wsRef.current.onopen = () => {
        console.log('🔔 Connected to push notification service');
        console.log('📊 WebSocket connection details:', {
          url: wsRef.current?.url,
          protocol: wsRef.current?.protocol,
          readyState: wsRef.current?.readyState,
          extensions: wsRef.current?.extensions
        });
        setIsConnected(true);
        reconnectAttempts.current = 0; // Reset reconnection attempts on success

        // Authenticate with user ID
        if (wsRef.current && user) {
          const authMessage = {
            type: 'auth',
            userId: user.id || user._id,
            userType: user.userType || 'user'
          };
          console.log('�� Sending auth message:', authMessage);
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

      wsRef.current.onclose = (event) => {
        console.log('🚪 Disconnected from push notification service', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          environment: window.location.hostname.includes('.fly.dev') ? 'production' : 'development'
        });
        setIsConnected(false);
        wsRef.current = null;

        // Don't reconnect if closed normally or if WebSocket server not available
        if (event.code === 1000 || event.code === 1001 || event.code === 1006) {
          console.log('📝 WebSocket closed, checking if server is available before reconnecting');

          // In production, check if WebSocket endpoint exists before reconnecting
          if (window.location.hostname.includes('.fly.dev')) {
            // Don't aggressively reconnect in production to avoid spam
            if (reconnectAttempts.current < 3) {
              const delay = 10000; // 10 second delay for production
              console.log(`🔄 Production environment: Reconnecting in ${delay}ms`);
              setTimeout(() => {
                reconnectAttempts.current++;
                connectWebSocket();
              }, delay);
            } else {
              console.warn('⚠️ WebSocket unavailable in production, disabling push notifications');
            }
          }
          return;
        }

        // Exponential backoff reconnection for other network issues
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
        // Comprehensive error analysis and logging
        console.group('🔴 Push Notification WebSocket Error Analysis');

        try {
          // Log the raw error object with proper serialization
          const rawErrorInfo = {
            type: typeof error,
            constructor: error.constructor?.name || 'Unknown',
            isEvent: error instanceof Event,
            isError: error instanceof Error,
            message: error instanceof Error ? error.message : (error as any)?.message || 'No message available'
          };

          console.error('Raw error object:', JSON.stringify(rawErrorInfo, null, 2));
          console.error('Error type:', typeof error);
          console.error('Error constructor:', error.constructor?.name || 'Unknown');

          // Try to extract all possible error information
          const errorAnalysis = {
            timestamp: new Date().toISOString(),
            errorType: typeof error,
            constructorName: error.constructor?.name,
            isEvent: error instanceof Event,
            isError: error instanceof Error,
            wsUrl: wsRef.current?.url,
            wsReadyState: wsRef.current?.readyState,
            wsProtocol: wsRef.current?.protocol,
            connectionAttempt: reconnectAttempts.current,
            userContext: {
              isAuthenticated,
              userId: user?.id || user?._id,
              userType: user?.userType
            }
          };

          // Enhanced error serialization
          if (error instanceof Event) {
            errorAnalysis.eventDetails = {
              type: error.type,
              timeStamp: error.timeStamp,
              isTrusted: error.isTrusted,
              bubbles: error.bubbles,
              cancelable: error.cancelable,
              target: error.target ? {
                url: (error.target as any).url,
                readyState: (error.target as any).readyState,
                protocol: (error.target as any).protocol,
                bufferedAmount: (error.target as any).bufferedAmount,
                extensions: (error.target as any).extensions
              } : null
            };
          } else if (error instanceof Error) {
            errorAnalysis.errorDetails = {
              name: error.name,
              message: error.message,
              stack: error.stack
            };
          } else if (error && typeof error === 'object') {
            try {
              errorAnalysis.objectDetails = JSON.parse(JSON.stringify(error));
            } catch (e) {
              errorAnalysis.objectDetails = 'Failed to serialize object';
            }
          }

          console.error('Complete error analysis:', JSON.stringify(errorAnalysis, null, 2));

          // Check for specific error patterns
          if (error.target?.readyState === WebSocket.CLOSED) {
            console.warn('WebSocket was already closed');
          } else if (error.target?.readyState === WebSocket.CLOSING) {
            console.warn('WebSocket is closing');
          } else if (error.target?.readyState === WebSocket.CONNECTING) {
            console.warn('WebSocket failed during connection');
          }

        } catch (analysisError) {
          console.error('Failed to analyze WebSocket error:', analysisError);
        } finally {
          console.groupEnd();
        }

        setIsConnected(false);

        // Attempt reconnection after error with backoff only for network errors
        const wsReadyState = wsRef.current?.readyState;
        if (wsReadyState === WebSocket.CLOSED && isAuthenticated && user && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(5000 * (reconnectAttempts.current + 1), 30000);
          console.log(`🔄 Attempting to reconnect push notifications in ${delay}ms...`);
          setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket();
          }, delay);
        } else {
          console.warn('⚠️ Max reconnection attempts reached, user not authenticated, or WebSocket not closed properly');
        }
      };
    } catch (error) {
      console.error('Failed to connect to push notification service:', error);
      setIsConnected(false);

      // Don't retry if there's a fundamental connection issue
      if (error instanceof Error && error.message.includes('WebSocket')) {
        console.warn('⚠️ WebSocket connection failed, disabling notifications for this session');
        reconnectAttempts.current = maxReconnectAttempts;
      }
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
