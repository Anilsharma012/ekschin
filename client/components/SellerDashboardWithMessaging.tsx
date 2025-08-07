import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
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
  RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ChatConversation, ChatMessage } from '@shared/chat-types';
import { usePushNotifications } from '../hooks/usePushNotifications';
import PackageCheckoutModal from './PackageCheckoutModal';

interface ConversationWithDetails extends ChatConversation {
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
  unreadCount: number;
  lastMessage?: ChatMessage;
}

interface SellerStats {
  totalProperties: number;
  activeProperties: number;
  totalViews: number;
  totalInquiries: number;
  unreadMessages: number;
  revenue: number;
}

interface Package {
  _id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  duration: number;
  type: string;
  isActive: boolean;
}

const SellerDashboardWithMessaging: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { notifications, unreadCount } = usePushNotifications();

  // Dashboard state
  const [stats, setStats] = useState<SellerStats>({
    totalProperties: 0,
    activeProperties: 0,
    totalViews: 0,
    totalInquiries: 0,
    unreadMessages: 0,
    revenue: 0
  });

  // Messaging state
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Package state
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Real-time messaging with WebSocket
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket for real-time messaging
  useEffect(() => {
    if (!isAuthenticated || !user || !token) return;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
        
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('🔌 Connected to chat WebSocket');
          // Authenticate with the server
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
              
              // Add message to current conversation if it matches
              if (currentConversation && message.conversationId === currentConversation._id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
              }
              
              // Update conversation list with new message
              setConversations(prev => prev.map(conv => 
                conv._id === message.conversationId 
                  ? { ...conv, lastMessage: message, unreadCount: conv.unreadCount + 1 }
                  : conv
              ));
              
              // Update stats
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
          console.error('WebSocket error:', error);
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

  // Fetch initial data
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchStats();
      fetchConversations();
      fetchPackages();
    }
  }, [isAuthenticated, token]);

  // Fetch current conversation messages
  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation._id);
    }
  }, [currentConversation]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/seller/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || stats);
      }
    } catch (error) {
      console.error('Error fetching seller stats:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.messages || []);
        
        // Mark conversation as read
        markConversationAsRead(conversationId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      setLoadingPackages(true);
      const response = await fetch('/api/packages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPackages(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoadingPackages(false);
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
        const message = data.data;
        
        // Add message locally (WebSocket will also send it, but this is faster)
        setMessages(prev => [...prev, message]);
        setNewMessage('');
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv._id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const selectConversation = (conversation: ConversationWithDetails) => {
    setCurrentConversation(conversation);
    setMessages([]);
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
              <Button variant="ghost" size="sm" onClick={fetchStats}>
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
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name?.charAt(0) || 'S'}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="messages">
              Messages
              {stats.unreadMessages > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {stats.unreadMessages}
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
                    {stats.activeProperties} active
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
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{conversations.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.unreadMessages} unread
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{stats.revenue}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
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
                </div>
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
                      {filteredConversations.map((conversation) => (
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
                          <Send className="h-4 w-4" />
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

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Available Packages</CardTitle>
                  <Button variant="outline" onClick={fetchPackages} disabled={loadingPackages}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingPackages ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPackages ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border rounded-lg p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-4" />
                        <div className="h-8 bg-gray-200 rounded mb-4" />
                        <div className="h-20 bg-gray-200 rounded mb-4" />
                        <div className="h-10 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                      <Card key={pkg._id} className="border-2 hover:border-blue-300 transition-colors">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{pkg.name}</CardTitle>
                            {pkg.type === 'premium' && <Star className="h-5 w-5 text-yellow-500" />}
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
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <Button 
                            className="w-full" 
                            variant={pkg.type === 'premium' ? 'default' : 'outline'}
                          >
                            <Package className="h-4 w-4 mr-2" />
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerDashboardWithMessaging;
