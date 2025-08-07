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
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔔 Connected to push notification service');
        setIsConnected(true);
        
        // Authenticate with user ID
        if (wsRef.current && user) {
          wsRef.current.send(JSON.stringify({
            type: 'auth',
            userId: user.id || user._id,
            userType: user.userType || 'user'
          }));
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
          console.error('Error parsing notification message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🚪 Disconnected from push notification service');
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt to reconnect after 3 seconds
        if (isAuthenticated && user) {
          setTimeout(connectWebSocket, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('🔴 WebSocket error:', error);
        setIsConnected(false);
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
