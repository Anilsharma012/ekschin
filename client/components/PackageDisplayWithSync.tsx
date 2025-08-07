import React, { useState } from 'react';
import { usePackageSync } from '../hooks/usePackageSync';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Package, 
  Crown, 
  Star, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  CreditCard,
  Shield,
  Zap,
  TrendingUp,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';

interface PackageDisplayProps {
  propertyId?: string;
  onPackageSelect?: (packageId: string) => void;
  showUserPackages?: boolean;
  showAvailablePackages?: boolean;
  title?: string;
  className?: string;
}

const PackageDisplayWithSync: React.FC<PackageDisplayProps> = ({
  propertyId,
  onPackageSelect,
  showUserPackages = false,
  showAvailablePackages = true,
  title = "Available Packages",
  className = ""
}) => {
  const {
    packages,
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
    isConnected
  } = usePackageSync();

  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);
    try {
      const result = await purchasePackage(packageId);
      if (!result.success) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const handleCancel = async (userPackageId: string) => {
    if (!confirm('Are you sure you want to cancel this package?')) return;
    
    setCancelling(userPackageId);
    try {
      const result = await cancelPackage(userPackageId);
      if (!result.success) {
        alert(result.error);
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Cancellation failed. Please try again.');
    } finally {
      setCancelling(null);
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

  const getUsagePercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-500">Loading packages...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-16 bg-gray-200 rounded" />
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-3 bg-gray-200 rounded" />
                  ))}
                </div>
                <div className="h-10 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Live Updates' : 'Disconnected'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={refreshPackages}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* User Packages Section */}
      {showUserPackages && activeUserPackages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Crown className="h-5 w-5 mr-2 text-yellow-500" />
            Your Active Packages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeUserPackages.map((userPackage) => {
              const daysRemaining = getDaysRemaining(userPackage.expiryDate);
              const usage = userPackage.usageStats;
              
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
                    
                    {/* Usage Statistics */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Properties Posted</span>
                          <span>{usage.propertiesPosted}/10</span>
                        </div>
                        <Progress value={getUsagePercentage(usage.propertiesPosted, 10)} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Featured Listings</span>
                          <span>{usage.featuredListings}/5</span>
                        </div>
                        <Progress value={getUsagePercentage(usage.featuredListings, 5)} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Premium Boosts</span>
                          <span>{usage.premiumBoosts}/3</span>
                        </div>
                        <Progress value={getUsagePercentage(usage.premiumBoosts, 3)} className="h-2" />
                      </div>
                    </div>

                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleCancel(userPackage._id)}
                      disabled={cancelling === userPackage._id}
                    >
                      {cancelling === userPackage._id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Package'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Packages Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-500" />
          {showUserPackages ? 'Available Packages' : 'All Packages'}
        </h3>
        
        {availablePackages.length === 0 ? (
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
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
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
    </div>
  );
};

export default PackageDisplayWithSync;
