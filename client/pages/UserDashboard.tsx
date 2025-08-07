import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { usePackageSync } from '../hooks/usePackageSync';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Search, 
  Heart, 
  MessageSquare, 
  Eye, 
  Filter,
  User,
  Settings,
  LogOut,
  Phone,
  Mail,
  MapPin,
  Calendar,
  RefreshCw,
  Home,
  Star,
  TrendingUp,
  Package,
  Bell,
  CreditCard,
  Crown,
  Shield,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle,
  ShoppingCart,
  DollarSign,
  Bookmark
} from 'lucide-react';
import OLXStyleHeader from '../components/OLXStyleHeader';
import BottomNavigation from '../components/BottomNavigation';
import PackageCheckoutModal from '../components/PackageCheckoutModal';

interface UserStats {
  totalFavorites: number;
  recentViews: number;
  savedSearches: number;
  inquiries: number;
  activePackages: number;
  totalSpent: number;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  userId: string;
}

export default function UserDashboard() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount } = usePushNotifications();
  
  const {
    packages,
    userPackages,
    availablePackages,
    activeUserPackages,
    loading: packagesLoading,
    error: packagesError,
    purchasePackage,
    hasPackage,
    refreshPackages,
    isConnected
  } = usePackageSync();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalFavorites: 0,
    recentViews: 0,
    savedSearches: 0,
    inquiries: 0,
    activePackages: 0,
    totalSpent: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/simple-login');
      return;
    }
    
    fetchDashboardData();
  }, [user, navigate, activeUserPackages]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Calculate stats from user packages
      const totalSpent = activeUserPackages.reduce((sum, up) => sum + up.package.price, 0);
      
      setStats({
        totalFavorites: user?.favorites?.length || 0,
        recentViews: 5,
        savedSearches: 2,
        inquiries: 3,
        activePackages: activeUserPackages.length,
        totalSpent
      });

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);
    try {
      const result = await purchasePackage(packageId);
      if (result.success) {
        // Show success message
        alert('Package purchased successfully!');
        fetchDashboardData();
      } else {
        alert(result.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const getPackageIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'premium':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'featured':
        return <Star className="h-5 w-5 text-blue-500" />;
      case 'spotlight':
        return <Zap className="h-5 w-5 text-purple-500" />;
      case 'basic':
        return <Shield className="h-5 w-5 text-green-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPackageColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'premium':
        return 'border-yellow-200 bg-yellow-50';
      case 'featured':
        return 'border-blue-200 bg-blue-50';
      case 'spotlight':
        return 'border-purple-200 bg-purple-50';
      case 'basic':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const getDaysRemaining = (expiryDate: Date | string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="animate-spin w-8 h-8 mx-auto mb-4 text-[#C70000]" />
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">User Dashboard</h1>
              <Badge variant="secondary">{user?.userType || 'User'}</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={refreshPackages}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <span className="hidden md:block">{user?.name}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="packages">
              Packages
              {stats.activePackages > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.activePackages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications
              {unreadCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Section */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h2>
                    <p className="text-gray-600">Find your perfect property and manage your account</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-500">
                      {isConnected ? 'Live Updates' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Favorites</CardTitle>
                  <Heart className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.totalFavorites}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Recent Views</CardTitle>
                  <Eye className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.recentViews}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Saved Searches</CardTitle>
                  <Bookmark className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.savedSearches}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Inquiries</CardTitle>
                  <MessageSquare className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.inquiries}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Packages</CardTitle>
                  <Package className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.activePackages}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₹{stats.totalSpent}</div>
                </CardContent>
              </Card>
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search for properties..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} className="bg-[#C70000] hover:bg-[#A60000]">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Link to="/search">
                    <Button className="w-full bg-[#C70000] hover:bg-[#A60000] text-white">
                      <Search className="h-4 w-4 mr-2" />
                      Browse Properties
                    </Button>
                  </Link>
                  <Link to="/favorites">
                    <Button variant="outline" className="w-full">
                      <Heart className="h-4 w-4 mr-2" />
                      My Favorites
                    </Button>
                  </Link>
                  <Link to="/messages">
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Messages
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={() => setShowProfileModal(true)}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-gray-500">{notification.message}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(notification.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No notifications yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            {/* User's Active Packages */}
            {activeUserPackages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                  Your Active Packages
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeUserPackages.map((userPackage) => {
                    const daysRemaining = getDaysRemaining(userPackage.expiryDate);
                    
                    return (
                      <Card key={userPackage._id} className={`border-2 ${getPackageColor(userPackage.package.type)}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getPackageIcon(userPackage.package.type)}
                              <CardTitle className="text-lg">{userPackage.package.name}</CardTitle>
                            </div>
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-green-600">₹{userPackage.package.price}</span>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {daysRemaining} days left
                              </p>
                              <p className="text-xs text-gray-400">
                                Expires: {formatDate(userPackage.expiryDate)}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 mb-4">{userPackage.package.description}</p>
                          
                          {/* Features */}
                          <ul className="space-y-1 mb-4">
                            {userPackage.package.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="flex items-center text-sm">
                                <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                            {userPackage.package.features.length > 3 && (
                              <li className="text-xs text-gray-500">
                                +{userPackage.package.features.length - 3} more features
                              </li>
                            )}
                          </ul>

                          <Button variant="outline" className="w-full" size="sm">
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Packages */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-blue-500" />
                Available Packages
              </h3>
              
              {packagesError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{packagesError}</AlertDescription>
                </Alert>
              )}
              
              {packagesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-8 bg-gray-200 rounded w-1/2" />
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="h-16 bg-gray-200 rounded" />
                        <div className="h-10 bg-gray-200 rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : availablePackages.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No packages available</h3>
                    <p className="text-gray-500">Check back later for new package offers.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availablePackages.map((pkg) => (
                    <Card key={pkg._id} className={`border-2 hover:shadow-lg transition-all ${getPackageColor(pkg.type)}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getPackageIcon(pkg.type)}
                            <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          </div>
                          {pkg.type === 'premium' && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        <div className="text-3xl font-bold text-blue-600">
                          ₹{pkg.price}
                          <span className="text-sm font-normal text-gray-500">
                            /{pkg.duration} days
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{pkg.description}</p>
                        
                        <ul className="space-y-2 mb-6">
                          {pkg.features.slice(0, 4).map((feature, index) => (
                            <li key={index} className="flex items-center text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {pkg.features.length > 4 && (
                            <li className="text-xs text-gray-500 ml-6">
                              +{pkg.features.length - 4} more features
                            </li>
                          )}
                        </ul>

                        <Button 
                          className="w-full" 
                          variant={pkg.type === 'premium' ? 'default' : 'outline'}
                          onClick={() => handlePurchase(pkg._id)}
                          disabled={purchasing === pkg._id || hasPackage(pkg._id)}
                        >
                          {purchasing === pkg._id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : hasPackage(pkg._id) ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Already Purchased
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Purchase Package
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Notifications</CardTitle>
                  <Badge>{notifications.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {notifications.map((notification, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant={notification.type === 'error' ? 'destructive' : 'secondary'}>
                            {notification.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="text-center py-12">
                        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                        <p className="text-gray-500">You're all caught up!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Profile updated</p>
                      <p className="text-xs text-gray-500">Updated your profile information</p>
                    </div>
                    <span className="text-xs text-gray-400">2 hours ago</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Property viewed</p>
                      <p className="text-xs text-gray-500">Viewed 3 BHK Apartment in Sector 15</p>
                    </div>
                    <span className="text-xs text-gray-400">1 day ago</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Message sent</p>
                      <p className="text-xs text-gray-500">Contacted seller about property inquiry</p>
                    </div>
                    <span className="text-xs text-gray-400">3 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Profile Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfileModal(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-lg">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">{user?.name}</h3>
                    <p className="text-gray-500">{user?.userType}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{stats.activePackages} active packages</span>
                  </div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <Button className="w-full" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button className="w-full" variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <BottomNavigation />
    </div>
  );
}
