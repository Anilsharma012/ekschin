import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Bell, 
  Home,
  Eye,
  MessageSquare,
  ShoppingCart,
  Activity,
  BarChart3,
  RefreshCw,
  Crown,
  Star,
  Shield,
  Zap
} from 'lucide-react';
import EnhancedPackageManagement from '../components/admin/EnhancedPackageManagement';

interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalPackages: number;
  totalRevenue: number;
  activePackages: number;
  pendingApprovals: number;
  newUsers: number;
  packagePurchases: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registered' | 'package_purchased' | 'property_posted' | 'property_approved';
  message: string;
  timestamp: Date;
  user?: {
    name: string;
    email: string;
  };
}

const EnhancedAdminDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalPackages: 0,
    totalRevenue: 0,
    activePackages: 0,
    pendingApprovals: 0,
    newUsers: 0,
    packagePurchases: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.userType !== 'admin') {
      navigate('/admin-login');
      return;
    }
    
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const [usersRes, propertiesRes, packagesRes, userPackagesRes] = await Promise.all([
        fetch('/api/admin/users?limit=1000', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/properties', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/packages', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/user-packages', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (usersRes.ok && propertiesRes.ok && packagesRes.ok && userPackagesRes.ok) {
        const [usersData, propertiesData, packagesData, userPackagesData] = await Promise.all([
          usersRes.json(),
          propertiesRes.json(),
          packagesRes.json(),
          userPackagesRes.json()
        ]);

        const users = usersData.data?.users || [];
        const properties = propertiesData.data || [];
        const packages = packagesData.data || [];
        const userPackages = userPackagesData.data || [];

        // Calculate stats
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const newUsers = users.filter((u: any) => 
          new Date(u.createdAt) > oneWeekAgo
        ).length;

        const pendingApprovals = properties.filter((p: any) => 
          p.approvalStatus === 'pending'
        ).length;

        const activePackages = packages.filter((p: any) => p.active).length;

        const totalRevenue = userPackages.reduce((sum: number, up: any) => 
          sum + (up.totalAmount || 0), 0
        );

        const recentPackagePurchases = userPackages.filter((up: any) =>
          new Date(up.purchaseDate) > oneWeekAgo
        ).length;

        setStats({
          totalUsers: users.length,
          totalProperties: properties.length,
          totalPackages: packages.length,
          totalRevenue,
          activePackages,
          pendingApprovals,
          newUsers,
          packagePurchases: recentPackagePurchases
        });

        // Generate recent activity
        const activity: RecentActivity[] = [
          ...userPackages.slice(0, 3).map((up: any) => ({
            id: up._id,
            type: 'package_purchased' as const,
            message: `${up.user?.name || 'User'} purchased ${up.package?.name || 'package'}`,
            timestamp: new Date(up.purchaseDate),
            user: up.user
          })),
          ...users.slice(0, 2).map((u: any) => ({
            id: u._id,
            type: 'user_registered' as const,
            message: `${u.name} registered as ${u.userType}`,
            timestamp: new Date(u.createdAt),
            user: u
          }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setRecentActivity(activity);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'package_purchased':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'property_posted':
        return <Home className="h-4 w-4 text-purple-500" />;
      case 'property_approved':
        return <Shield className="h-4 w-4 text-orange-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
              <Badge variant="secondary">Administrator</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={fetchDashboardData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="packages">Package Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h2>
                    <p className="text-gray-600">Here's what's happening with your platform today.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">Admin Dashboard</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats.newUsers} this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                  <Home className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProperties}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingApprovals} pending approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
                  <Package className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activePackages}</div>
                  <p className="text-xs text-muted-foreground">
                    of {stats.totalPackages} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.packagePurchases} purchases this week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button className="w-full" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Home className="h-4 w-4 mr-2" />
                    Approve Properties
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Package className="h-4 w-4 mr-2" />
                    Create Package
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Bell className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3">
                        {getActivityIcon(activity.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {activity.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {recentActivity.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm">Database</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Healthy
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm">API Services</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Online
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm">Real-time Updates</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Active
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-sm">Payment Gateway</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Connected
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Package Management Tab */}
          <TabsContent value="packages">
            <EnhancedPackageManagement />
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
                  <p className="text-gray-500 mb-4">Manage users, view analytics, and control access.</p>
                  <Button variant="outline">
                    View All Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                  <p className="text-gray-500 mb-4">View detailed analytics and generate reports.</p>
                  <Button variant="outline">
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedAdminDashboard;
