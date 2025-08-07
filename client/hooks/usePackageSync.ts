import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

interface Package {
  _id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  duration: number;
  type: string;
  isActive: boolean;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserPackage {
  _id: string;
  userId: string;
  packageId: string;
  package: Package;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  purchaseDate: Date;
  expiryDate: Date;
  usageStats: {
    propertiesPosted: number;
    featuredListings: number;
    premiumBoosts: number;
  };
}

export const usePackageSync = () => {
  const { token, isAuthenticated, user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize WebSocket for real-time package updates
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/packages`;
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('📦 Connected to package sync WebSocket');
          reconnectAttempts.current = 0; // Reset reconnection attempts on success

          // Authenticate
          if (wsRef.current && user) {
            wsRef.current.send(JSON.stringify({
              type: 'auth',
              userId: user.id || user._id,
              token
            }));
          }
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'package_created':
                setPackages(prev => [...prev, data.package]);
                console.log('📦 New package added:', data.package.name);
                break;

              case 'package_updated':
                setPackages(prev => prev.map(pkg =>
                  pkg._id === data.package._id ? data.package : pkg
                ));
                console.log('📦 Package updated:', data.package.name);
                break;

              case 'package_deleted':
                setPackages(prev => prev.filter(pkg => pkg._id !== data.packageId));
                console.log('📦 Package removed:', data.packageId);
                break;

              case 'user_package_created':
                if (data.userPackage.userId === (user?.id || user?._id)) {
                  setUserPackages(prev => [...prev, data.userPackage]);
                  console.log('🎯 New user package added');
                }
                break;

              case 'user_package_updated':
                if (data.userPackage.userId === (user?.id || user?._id)) {
                  setUserPackages(prev => prev.map(up =>
                    up._id === data.userPackage._id ? data.userPackage : up
                  ));
                  console.log('🎯 User package updated');
                }
                break;

              case 'sync_complete':
                console.log('✅ Package sync completed');
                break;
            }
          } catch (error) {
            console.error('Error parsing package sync message:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('❌ Package sync WebSocket disconnected');

          // Exponential backoff reconnection
          if (isAuthenticated && user && token && reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            console.log(`🔄 Reconnecting to package sync in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

            setTimeout(() => {
              reconnectAttempts.current++;
              connectWebSocket();
            }, delay);
          } else if (reconnectAttempts.current >= maxReconnectAttempts) {
            console.warn('⚠️ Max reconnection attempts reached for package sync');
          }
        };

        wsRef.current.onerror = (error) => {
          const errorDetails = {
            type: error.type || 'error',
            url: error.target?.url || wsRef.current?.url || 'Unknown URL',
            readyState: error.target?.readyState || wsRef.current?.readyState || 'Unknown state',
            code: error.code || 'No code',
            reason: error.reason || 'Unknown reason',
            timestamp: new Date().toISOString()
          };

          console.error('🔴 Package sync WebSocket error:', errorDetails);

          // Attempt reconnection after error
          if (isAuthenticated && user && token) {
            console.log('🔄 Attempting to reconnect package sync in 5 seconds...');
            setTimeout(connectWebSocket, 5000);
          }
        };
      } catch (error) {
        console.error('Failed to connect package sync WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, token, user]);

  // Fetch initial packages and user packages
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchPackages();
      fetchUserPackages();
    }
  }, [isAuthenticated, token]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/packages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPackages(data.data || []);
      } else {
        setError('Failed to fetch packages');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Network error while fetching packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPackages = async () => {
    try {
      const response = await fetch('/api/user-packages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPackages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching user packages:', error);
    }
  };

  const purchasePackage = async (packageId: string, paymentMethod: string = 'online') => {
    try {
      const response = await fetch('/api/seller/purchase-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ packageId, paymentMethod })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add to local state immediately
        if (data.data.userPackage) {
          setUserPackages(prev => [...prev, data.data.userPackage]);
        }
        
        return { success: true, data: data.data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Purchase failed' };
      }
    } catch (error) {
      console.error('Error purchasing package:', error);
      return { success: false, error: 'Network error during purchase' };
    }
  };

  const cancelPackage = async (userPackageId: string) => {
    try {
      const response = await fetch(`/api/user-packages/${userPackageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        // Remove from local state
        setUserPackages(prev => prev.filter(up => up._id !== userPackageId));
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Cancellation failed' };
      }
    } catch (error) {
      console.error('Error cancelling package:', error);
      return { success: false, error: 'Network error during cancellation' };
    }
  };

  // Get active packages
  const activePackages = packages.filter(pkg => pkg.active);

  // Get user's active packages
  const activeUserPackages = userPackages.filter(up => up.status === 'active');

  // Get available packages (not already purchased by user)
  const availablePackages = activePackages.filter(pkg => 
    !userPackages.some(up => up.packageId === pkg._id && up.status === 'active')
  );

  // Check if user has specific package
  const hasPackage = (packageId: string) => {
    return userPackages.some(up => up.packageId === packageId && up.status === 'active');
  };

  // Get package usage stats
  const getPackageUsage = (packageId: string) => {
    const userPackage = userPackages.find(up => up.packageId === packageId && up.status === 'active');
    return userPackage?.usageStats || null;
  };

  // Force refresh packages
  const refreshPackages = async () => {
    await Promise.all([fetchPackages(), fetchUserPackages()]);
  };

  return {
    packages: activePackages,
    userPackages,
    availablePackages,
    activeUserPackages,
    loading,
    error,
    purchasePackage,
    cancelPackage,
    hasPackage,
    getPackageUsage,
    refreshPackages,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
};
