import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';

interface AdminData {
  stats: {
    totalUsers: number;
    totalProperties: number;
    totalPackages: number;
    totalTransactions: number;
  };
  loading: boolean;
  error: string;
  refetch: () => void;
}

const AdminDataContext = createContext<AdminData | undefined>(undefined);

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
};

interface AdminDataProviderProps {
  children: ReactNode;
}

export const AdminDataProvider = ({ children }: AdminDataProviderProps) => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalPackages: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminStats = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error || 'Failed to fetch admin stats');
        }
      } else {
        setError('Failed to fetch admin stats');
      }
    } catch (err) {
      setError('Network error while fetching admin stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminStats();
    }
  }, [token]);

  const value: AdminData = {
    stats,
    loading,
    error,
    refetch: fetchAdminStats,
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};
