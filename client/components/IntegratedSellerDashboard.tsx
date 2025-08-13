import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePackageSync } from '../hooks/usePackageSync';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Send, 
  Home, 
  Package, 
  Bell,
  Settings,
  User,
  Phone,
  MoreVertical,
  Search,
  Circle,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  DollarSign,
  Eye,
  RefreshCw,
  CreditCard,
  Crown,
  Shield,
  Zap,
  AlertCircle,
  MapPin,
  Calendar,
  Activity,
  MessageCircle,
  Filter,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import PackageCheckoutModal from './PackageCheckoutModal';
import SellerProfileManagement from './SellerProfileManagement';

interface SellerStats {
  totalProperties: number;
  activeProperties: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
  totalViews: number;
  totalInquiries: number;
  unreadMessages: number;
  unreadNotifications: number;
  revenue: number;
  premiumListings: number;
  profileViews: number;
}

interface ChatConversation {
  _id: string;
  participants: string[];
  participantDetails: Array<{
    _id: string;
    name: string;
    userType: string;
    avatar?: string;
  }>;
  propertyDetails?: Array<{
    _id: string;
    title: string;
    price: number;
    images: string[];
    location: { address: string };
  }>;
  lastMessage?: {
    message: string;
    timestamp: Date;
    senderId: string;
  };
  unreadCount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderType: string;
  message: string;
  timestamp: Date;
  readBy?: string[];
  deliveredAt?: Date;
}

interface Property {
  _id: string;
  title: string;
  description: string;
  price: number;
  priceType: string;
  propertyType: string;
  subCategory: string;
  location: {
    sector: string;
    area: string;
    city: string;
    state: string;
    address: string;
  };
  specifications: {
    bedrooms?: number;
    bathrooms?: number;
    area: number;
    facing?: string;
    floor?: number;
    totalFloors?: number;
    parking?: boolean;
    furnished?: string;
  };
  images: string[];
  amenities: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  views: number;
  inquiries: number;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IntegratedSellerDashboard: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { notifications, unreadCount: notificationUnreadCount } = usePushNotifications();
  const {
    packages,
    userPackages,
    availablePackages,
    activeUserPackages,
    loading: packagesLoading,
    error: packagesError,
    refreshPackages,
    isConnected: packageSyncConnected
  } = usePackageSync();

  // Dashboard state
  const [stats, setStats] = useState<SellerStats>({
    totalProperties: 0,
    activeProperties: 0,
    pendingApproval: 0,
    approved: 0,
    rejected: 0,
    totalViews: 0,
    totalInquiries: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
    revenue: 0,
    premiumListings: 0,
    profileViews: 0
  });

  // Properties state
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  // Seller notifications state
  const [sellerNotifications, setSellerNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Messaging state
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Package purchase state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);

  // Profile state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // WebSocket for real-time messaging
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket for real-time messaging
  useEffect(() => {
    if (!isAuthenticated || !user || !token) return;

    const connectWebSocket = () => {
      try {
        // Disable WebSocket in production
        const isProduction = window.location.hostname.includes(".fly.dev");
        if (isProduction) {
          console.log('🚫 Chat WebSocket disabled in production environment');
          return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('🔌 Connected to chat WebSocket');
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
            
            if (data.type === 'new_message') {
              const message: ChatMessage = data.message;
              
              if (currentConversation && message.conversationId === currentConversation._id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
              }
              
              setConversations(prev => prev.map(conv => 
                conv._id === message.conversationId 
                  ? { ...conv, lastMessage: { message: message.message, timestamp: message.timestamp, senderId: message.senderId }, unreadCount: conv.unreadCount + 1 }
                  : conv
              ));
              
              setStats(prev => ({ ...prev, unreadMessages: prev.unreadMessages + 1 }));
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onclose = () => {
          console.log('❌ WebSocket disconnected, attempting to reconnect...');
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error('🔴 Chat WebSocket error:', {
            type: error.type,
            url: error.target?.url || 'Unknown URL',
            readyState: error.target?.readyState || 'Unknown state'
          });
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, user, token, currentConversation]);

  // Fetch all data on component mount
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAllData();
    }
  }, [isAuthenticated, token]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchProperties(),
        fetchConversations(),
        fetchProfile(),
        fetchSellerNotifications()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/seller/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } else {
        console.error('Failed to fetch stats:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching seller stats:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      const response = await fetch('/api/seller/properties', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProperties(data.data || []);
        }
      } else {
        console.error('Failed to fetch properties:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching seller properties:', error);
    } finally {
      setLoadingProperties(false);
    }
  };

  const fetchSellerNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await fetch('/api/seller/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSellerNotifications(data.data || []);
          // Update unread count in stats
          const unreadCount = data.data.filter(n => !n.isRead).length;
          setStats(prev => ({ ...prev, unreadNotifications: unreadCount }));
        }
      } else {
        console.error('Failed to fetch notifications:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching seller notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConversations(data.data || []);
        }
      } else {
        console.error('Failed to fetch conversations:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.data.messages || []);
          markConversationAsRead(conversationId);
        }
      } else {
        console.error('Failed to fetch messages:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfileData(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || sendingMessage) return;

    try {
      setSendingMessage(true);
      
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: currentConversation._id,
          message: newMessage.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const message = data.data;
          setMessages(prev => [...prev, message]);
          setNewMessage('');
          scrollToBottom();
        }
      } else {
        setError('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setConversations(prev => prev.map(conv => 
        conv._id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const selectConversation = (conversation: ChatConversation) => {
    setCurrentConversation(conversation);
    setMessages([]);
    fetchMessages(conversation._id);
  };

  const handlePurchaseClick = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowCheckoutModal(true);
  };

  const handlePurchase = async (packageId: string, paymentMethod: string, paymentDetails?: any) => {
    try {
      const response = await fetch('/api/seller/purchase-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ packageId, paymentMethod, paymentDetails })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess('Package purchased successfully!');
          refreshPackages();
          fetchStats();
          return { success: true };
        } else {
          setError(data.error || 'Purchase failed');
          return { success: false, error: data.error };
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Purchase failed');
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setError('Purchase failed. Please try again.');
      return { success: false, error: 'Network error' };
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/seller/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        // Update local state
        setSellerNotifications(prev =>
          prev.map(n => n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n)
        );
        // Update unread count
        setStats(prev => ({ ...prev, unreadNotifications: prev.unreadNotifications - 1 }));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/seller/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        // Remove from local state
        const notif = sellerNotifications.find(n => n._id === notificationId);
        setSellerNotifications(prev => prev.filter(n => n._id !== notificationId));
        // Update unread count if it was unread
        if (notif && !notif.isRead) {
          setStats(prev => ({ ...prev, unreadNotifications: prev.unreadNotifications - 1 }));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    searchQuery === '' ||
    conv.participantDetails.some(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) ||
    conv.propertyDetails?.some(p =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const getMessageStatus = (message: ChatMessage) => {
    if (message.readBy && message.readBy.length > 1) {
      return <CheckCircle className="h-3 w-3 text-blue-500" />;
    } else if (message.deliveredAt) {
      return <CheckCircle className="h-3 w-3 text-gray-400" />;
    } else {
      return <Clock className="h-3 w-3 text-gray-300" />;
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

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading seller dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Please login to access seller dashboard</h2>
            <Link to="/auth">
              <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
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
              <h1 className="text-xl font-semibold text-gray-900">Seller Dashboard</h1>
              <Badge variant="secondary">{user?.userType || 'Seller'}</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={fetchAllData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {notificationUnreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {notificationUnreadCount}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden md:block">Profile</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileModal(true)}
                className="flex items-center space-x-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>{user?.name?.charAt(0) || 'S'}</AvatarFallback>
                </Avatar>
                <span className="hidden md:block">{user?.name}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
          <Button variant="ghost" size="sm" onClick={() => setError('')} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {success && (
        <Alert className="m-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
          <Button variant="ghost" size="sm" onClick={() => setSuccess('')} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">
              Properties
              {stats.pendingApproval > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.pendingApproval}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages">
              Messages
              {stats.unreadMessages > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications
              {stats.unreadNotifications > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProperties}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.approved} approved, {stats.pendingApproval} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalViews}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all properties
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Inquiries</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalInquiries}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.unreadMessages} unread messages
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Premium Listings</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.premiumListings}</div>
                  <p className="text-xs text-muted-foreground">
                    Featured properties
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
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
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle>Real-time Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${wsRef.current?.readyState === WebSocket.OPEN ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">Chat Messages</span>
                    <Badge variant="outline" className={wsRef.current?.readyState === WebSocket.OPEN ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                      {wsRef.current?.readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${packageSyncConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">Package Sync</span>
                    <Badge variant="outline" className={packageSyncConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                      {packageSyncConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">Push Notifications</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Properties</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={fetchProperties}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Link to="/post-property">
                      <Button>
                        <Home className="h-4 w-4 mr-2" />
                        Add Property
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingProperties ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-8 bg-gray-200 rounded w-1/2" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="h-32 bg-gray-200 rounded" />
                          <div className="h-4 bg-gray-200 rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : properties.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
                    <p className="text-gray-500 mb-4">Start by adding your first property listing</p>
                    <Link to="/post-property">
                      <Button>
                        <Home className="h-4 w-4 mr-2" />
                        Add Property
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((property) => (
                      <Card key={property._id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg truncate">{property.title}</CardTitle>
                            {getApprovalStatusBadge(property.approvalStatus)}
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            ₹{property.price.toLocaleString()}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              {property.location.area}, {property.location.city}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                {property.views} views
                              </div>
                              <div className="flex items-center">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                {property.inquiries} inquiries
                              </div>
                            </div>
                            {property.isPremium && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Settings className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Conversations List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Conversations</CardTitle>
                    <Badge>{conversations.length}</Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[450px]">
                    <div className="space-y-2 p-4">
                      {loadingConversations ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse">
                              <div className="h-16 bg-gray-200 rounded-lg" />
                            </div>
                          ))}
                        </div>
                      ) : filteredConversations.map((conversation) => (
                        <div
                          key={conversation._id}
                          onClick={() => selectConversation(conversation)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            currentConversation?._id === conversation._id
                              ? 'bg-blue-50 border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {conversation.participantDetails[0]?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {conversation.participantDetails[0]?.name || 'Unknown User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {conversation.lastMessage?.message || 'No messages yet'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              {conversation.unreadCount > 0 && (
                                <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-400">
                                {conversation.lastMessage && formatTime(conversation.lastMessage.timestamp)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Property Info */}
                          {conversation.propertyDetails && conversation.propertyDetails[0] && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <p className="font-medium">{conversation.propertyDetails[0].title}</p>
                              <p className="text-gray-600">₹{conversation.propertyDetails[0].price}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat Interface */}
              <Card className="lg:col-span-2">
                {currentConversation ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {currentConversation.participantDetails[0]?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">
                              {currentConversation.participantDetails[0]?.name || 'Unknown User'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {currentConversation.participantDetails[0]?.userType || 'User'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Messages */}
                    <CardContent className="p-0">
                      <ScrollArea className="h-[350px] p-4">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message._id}
                              className={`flex ${
                                message.senderId === (user?.id || user?._id) 
                                  ? 'justify-end' 
                                  : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[70%] p-3 rounded-lg ${
                                  message.senderId === (user?.id || user?._id)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <p className="text-sm">{message.message}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <span className={`text-xs ${
                                    message.senderId === (user?.id || user?._id)
                                      ? 'text-blue-100'
                                      : 'text-gray-500'
                                  }`}>
                                    {formatTime(message.timestamp)}
                                  </span>
                                  {message.senderId === (user?.id || user?._id) && (
                                    <div className="ml-2">
                                      {getMessageStatus(message)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    </CardContent>

                    {/* Message Input */}
                    <div className="border-t p-4">
                      <div className="flex items-center space-x-2">
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                          disabled={sendingMessage}
                        />
                        <Button 
                          onClick={sendMessage} 
                          disabled={!newMessage.trim() || sendingMessage}
                          size="sm"
                        >
                          {sendingMessage ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                      <p className="text-gray-500">Select a conversation to start chatting</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </CardTitle>
                  <Badge variant="outline">
                    {stats.unreadNotifications} unread
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loadingNotifications ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-3 p-4 border rounded-lg animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sellerNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-2">कोई notifications नहीं हैं</p>
                    <p className="text-sm text-gray-400">Admin notifications यहाँ दिखाई जाएंगी</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sellerNotifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-4 border rounded-lg transition-colors hover:bg-gray-50 ${
                          !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`w-3 h-3 rounded-full mt-2 ${
                              !notification.isRead ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className={`font-medium ${
                                  !notification.isRead ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {notification.title}
                                </h3>
                                {notification.sentBy === 'admin' && (
                                  <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-700 text-sm mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatTime(notification.createdAt)}
                                </span>
                                {notification.readAt && (
                                  <span className="flex items-center text-green-600">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Read {formatTime(notification.readAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markNotificationAsRead(notification._id)}
                                className="text-xs"
                              >
                                Mark Read
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteNotification(notification._id)}
                              className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            {/* Active User Packages */}
            {activeUserPackages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                    Your Active Packages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeUserPackages.map((userPackage) => {
                      const daysRemaining = Math.max(0, Math.ceil((new Date(userPackage.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                      
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
                                  Expires: {new Date(userPackage.expiryDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-600 mb-4">{userPackage.package.description}</p>
                            
                            {/* Usage Statistics */}
                            {userPackage.usageStats && (
                              <div className="space-y-3 mb-4">
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Properties Posted</span>
                                    <span>{userPackage.usageStats.propertiesPosted}/10</span>
                                  </div>
                                  <Progress value={(userPackage.usageStats.propertiesPosted / 10) * 100} className="h-2" />
                                </div>
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Featured Listings</span>
                                    <span>{userPackage.usageStats.featuredListings}/5</span>
                                  </div>
                                  <Progress value={(userPackage.usageStats.featuredListings / 5) * 100} className="h-2" />
                                </div>
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Premium Boosts</span>
                                    <span>{userPackage.usageStats.premiumBoosts}/3</span>
                                  </div>
                                  <Progress value={(userPackage.usageStats.premiumBoosts / 3) * 100} className="h-2" />
                                </div>
                              </div>
                            )}

                            <Button variant="outline" className="w-full" size="sm">
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Package History and Summary */}
            {userPackages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-500" />
                    My Package History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Package Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Total Packages</p>
                            <p className="text-2xl font-bold text-blue-900">{userPackages.length}</p>
                          </div>
                          <Package className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 font-medium">Active</p>
                            <p className="text-2xl font-bold text-green-900">
                              {userPackages.filter(p => p.status === 'active').length}
                            </p>
                          </div>
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-yellow-600 font-medium">Expired</p>
                            <p className="text-2xl font-bold text-yellow-900">
                              {userPackages.filter(p => p.status === 'expired').length}
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-yellow-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Total Spent</p>
                            <p className="text-2xl font-bold text-gray-900">
                              ₹{userPackages.reduce((sum, p) => sum + (p.package?.price || 0), 0)}
                            </p>
                          </div>
                          <DollarSign className="h-8 w-8 text-gray-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Package Transactions */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Recent Transactions</h4>
                    <div className="space-y-2">
                      {userPackages.slice(0, 5).map((userPackage) => (
                        <div key={userPackage._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getPackageIcon(userPackage.package?.type || 'basic')}
                            <div>
                              <p className="font-medium">{userPackage.package?.name || 'Unknown Package'}</p>
                              <p className="text-sm text-gray-500">
                                Purchased: {new Date(userPackage.purchaseDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{userPackage.package?.price || 0}</p>
                            <Badge
                              variant={
                                userPackage.status === 'active' ? 'default' :
                                userPackage.status === 'expired' ? 'secondary' :
                                'destructive'
                              }
                              className={
                                userPackage.status === 'active' ? 'bg-green-100 text-green-800' :
                                userPackage.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {userPackage.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    {userPackages.length > 5 && (
                      <Button variant="outline" size="sm" className="w-full">
                        View All Transactions
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show message if no packages */}
            {userPackages.length === 0 && !packagesLoading && (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Packages Yet</h3>
                  <p className="text-gray-500 mb-6">
                    You haven't purchased any packages yet. Explore our available packages below to boost your property listings.
                  </p>
                  <Button onClick={() => refreshPackages()}>
                    <Package className="h-4 w-4 mr-2" />
                    Browse Packages
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Available Packages */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Available Packages</CardTitle>
                  <Button variant="outline" onClick={refreshPackages} disabled={packagesLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${packagesLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {packagesError && (
                  <Alert variant="destructive" className="mb-4">
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
                ) : availablePackages.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No packages available</h3>
                    <p className="text-gray-500">Check back later for new package offers.</p>
                  </div>
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
                            ��{pkg.price}
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
                            onClick={() => handlePurchaseClick(pkg)}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Purchase Package
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Profile Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input value={user?.name || ''} readOnly />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input value={user?.email || ''} readOnly />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <Input value={user?.phone || ''} readOnly />
                      </div>
                      <div>
                        <label className="text-sm font-medium">User Type</label>
                        <Input value={user?.userType || ''} readOnly />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <input type="checkbox" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-gray-500">Receive push notifications</p>
                        </div>
                        <input type="checkbox" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">SMS Notifications</p>
                          <p className="text-sm text-gray-500">Receive SMS for important updates</p>
                        </div>
                        <input type="checkbox" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Profile Visibility</p>
                          <p className="text-sm text-gray-500">Make your profile visible to potential buyers</p>
                        </div>
                        <input type="checkbox" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Contact Information</p>
                          <p className="text-sm text-gray-500">Show contact details on listings</p>
                        </div>
                        <input type="checkbox" defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Management Modal */}
      <SellerProfileManagement
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Package Checkout Modal */}
      {showCheckoutModal && selectedPackage && (
        <PackageCheckoutModal
          package={selectedPackage}
          isOpen={showCheckoutModal}
          onClose={() => {
            setShowCheckoutModal(false);
            setSelectedPackage(null);
          }}
          onPurchase={handlePurchase}
          isProcessing={false}
        />
      )}
    </div>
  );
};

export default IntegratedSellerDashboard;
