import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Package, 
  Crown, 
  Star, 
  Shield, 
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  DollarSign,
  Calendar,
  Eye,
  Send,
  Bell
} from 'lucide-react';

interface Package {
  _id?: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  duration: number;
  type: string;
  category: string;
  location: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserPackage {
  _id: string;
  userId: string;
  user: {
    name: string;
    email: string;
    userType: string;
  };
  packageId: string;
  package: Package;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  purchaseDate: Date;
  expiryDate: Date;
  paymentMethod: string;
  totalAmount: number;
}

const packageTypes = [
  { value: 'basic', label: 'Basic', icon: Shield, color: 'text-green-500' },
  { value: 'featured', label: 'Featured', icon: Star, color: 'text-blue-500' },
  { value: 'premium', label: 'Premium', icon: Crown, color: 'text-yellow-500' },
  { value: 'spotlight', label: 'Spotlight', icon: Zap, color: 'text-purple-500' }
];

const EnhancedPackageManagement: React.FC = () => {
  const { token } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    userType: 'all' as 'all' | 'seller' | 'buyer' | 'agent'
  });

  // Form states
  const [formData, setFormData] = useState<Package>({
    name: '',
    description: '',
    price: 0,
    features: [''],
    duration: 30,
    type: 'basic',
    category: 'property',
    location: 'rohtak',
    active: true
  });

  const [stats, setStats] = useState({
    totalPackages: 0,
    activePackages: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    activeUsers: 0
  });

  useEffect(() => {
    fetchPackages();
    fetchUserPackages();
  }, []);

  useEffect(() => {
    if (packages.length > 0) {
      calculateStats();
    }
  }, [packages, userPackages]);

  const calculateStats = () => {
    const activePackages = packages.filter(pkg => pkg.active).length;
    const totalRevenue = userPackages.reduce((sum, up) => sum + up.totalAmount, 0);
    const activeUsers = new Set(userPackages.filter(up => up.status === 'active').map(up => up.userId)).size;

    setStats({
      totalPackages: packages.length,
      activePackages,
      totalPurchases: userPackages.length,
      totalRevenue,
      activeUsers
    });
  };

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/packages', {
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
      const response = await fetch('/api/admin/user-packages', {
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

  const createPackage = async () => {
    try {
      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setPackages(prev => [...prev, data.data]);
        setSuccess('Package created successfully');
        setShowCreateForm(false);
        resetForm();
        
        // Send notification about new package
        await sendNotification({
          title: 'New Package Available!',
          message: `${formData.name} package is now available. Check it out!`,
          type: 'info',
          userType: 'all'
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create package');
      }
    } catch (error) {
      console.error('Error creating package:', error);
      setError('Network error while creating package');
    }
  };

  const updatePackage = async () => {
    if (!editingPackage?._id) return;

    try {
      const response = await fetch(`/api/admin/packages/${editingPackage._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setPackages(prev => prev.map(pkg => 
          pkg._id === editingPackage._id ? data.data : pkg
        ));
        setSuccess('Package updated successfully');
        setEditingPackage(null);
        resetForm();
        
        // Send notification about package update
        await sendNotification({
          title: 'Package Updated!',
          message: `${formData.name} package has been updated with new features.`,
          type: 'info',
          userType: 'all'
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update package');
      }
    } catch (error) {
      console.error('Error updating package:', error);
      setError('Network error while updating package');
    }
  };

  const deletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    try {
      const response = await fetch(`/api/admin/packages/${packageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setPackages(prev => prev.filter(pkg => pkg._id !== packageId));
        setSuccess('Package deleted successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete package');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      setError('Network error while deleting package');
    }
  };

  const sendNotification = async (notification: typeof newNotification) => {
    try {
      const response = await fetch('/api/admin/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(notification)
      });

      if (response.ok) {
        setSuccess('Notification sent successfully');
        setNewNotification({
          title: '',
          message: '',
          type: 'info',
          userType: 'all'
        });
      } else {
        setError('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setError('Failed to send notification');
    }
  };

  const startEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({ ...pkg });
    setShowCreateForm(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      features: [''],
      duration: 30,
      type: 'basic',
      category: 'property',
      location: 'rohtak',
      active: true
    });
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      setFormData(prev => ({
        ...prev,
        features: prev.features.filter((_, i) => i !== index)
      }));
    }
  };

  const getPackageIcon = (type: string) => {
    const packageType = packageTypes.find(pt => pt.value === type);
    if (!packageType) return <Package className="h-5 w-5 text-gray-500" />;
    
    const IconComponent = packageType.icon;
    return <IconComponent className={`h-5 w-5 ${packageType.color}`} />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      active: 'default',
      expired: 'destructive',
      cancelled: 'outline',
      pending: 'secondary'
    };
    
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading packages...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Package Management</h1>
          <p className="text-gray-600">Manage packages and send notifications to users</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchPackages}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Package
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="packages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="purchases">User Purchases</TabsTrigger>
          <TabsTrigger value="notifications">Send Notifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPackages}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activePackages} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPurchases}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeUsers} active users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.totalRevenue}</div>
                <p className="text-xs text-muted-foreground">
                  From package sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  With active packages
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Create/Edit Form */}
          {(showCreateForm || editingPackage) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingPackage ? 'Edit Package' : 'Create New Package'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Package Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter package name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="type">Package Type</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      {packageTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter package description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Features</Label>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="Enter feature"
                        />
                        {formData.features.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFeature(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  />
                  <Label htmlFor="active">Active Package</Label>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={editingPackage ? updatePackage : createPackage}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingPackage ? 'Update' : 'Create'} Package
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingPackage(null);
                      resetForm();
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Packages List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg._id} className="border-2 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getPackageIcon(pkg.type)}
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    </div>
                    <Badge variant={pkg.active ? 'default' : 'outline'}>
                      {pkg.active ? 'Active' : 'Inactive'}
                    </Badge>
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
                  
                  <div className="space-y-2 mb-4">
                    <h4 className="font-medium text-sm">Features:</h4>
                    <ul className="space-y-1">
                      {pkg.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {pkg.features.length > 3 && (
                        <li className="text-xs text-gray-500">+{pkg.features.length - 3} more</li>
                      )}
                    </ul>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(pkg)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePackage(pkg._id!)}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* User Purchases Tab */}
        <TabsContent value="purchases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Package Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {userPackages.map((userPackage) => (
                    <div
                      key={userPackage._id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getPackageIcon(userPackage.package.type)}
                          <div>
                            <h4 className="font-medium">{userPackage.package.name}</h4>
                            <p className="text-sm text-gray-600">{userPackage.user.name} ({userPackage.user.email})</p>
                          </div>
                        </div>
                        {getStatusBadge(userPackage.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Amount:</span>
                          <p>₹{userPackage.totalAmount}</p>
                        </div>
                        <div>
                          <span className="font-medium">Purchase Date:</span>
                          <p>{new Date(userPackage.purchaseDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Expiry Date:</span>
                          <p>{new Date(userPackage.expiryDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Payment Method:</span>
                          <p>{userPackage.paymentMethod}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {userPackages.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No purchases yet</h3>
                      <p className="text-gray-500">User package purchases will appear here.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send Notification to Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notif-title">Title</Label>
                <Input
                  id="notif-title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title"
                />
              </div>
              
              <div>
                <Label htmlFor="notif-message">Message</Label>
                <Textarea
                  id="notif-message"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Notification message"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notif-type">Type</Label>
                  <select
                    id="notif-type"
                    value={newNotification.type}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="notif-usertype">User Type</Label>
                  <select
                    id="notif-usertype"
                    value={newNotification.userType}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, userType: e.target.value as any }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All Users</option>
                    <option value="seller">Sellers Only</option>
                    <option value="buyer">Buyers Only</option>
                    <option value="agent">Agents Only</option>
                  </select>
                </div>
              </div>
              
              <Button
                onClick={() => sendNotification(newNotification)}
                disabled={!newNotification.title || !newNotification.message}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Package Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {packages.map((pkg) => {
                    const purchases = userPackages.filter(up => up.packageId === pkg._id).length;
                    const revenue = userPackages
                      .filter(up => up.packageId === pkg._id)
                      .reduce((sum, up) => sum + up.totalAmount, 0);
                    
                    return (
                      <div key={pkg._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getPackageIcon(pkg.type)}
                          <span>{pkg.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{purchases} purchases</p>
                          <p className="text-sm text-gray-500">₹{revenue}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userPackages.slice(0, 5).map((up) => (
                    <div key={up._id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {up.user.name} purchased {up.package.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(up.purchaseDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-medium">₹{up.totalAmount}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedPackageManagement;
