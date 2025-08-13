import React, { useState } from 'react';
import { MessageCircle, TestTube, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import ChatModal from './ChatModal';

export default function ChatTest() {
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [`[${timestamp}] ${result}`, ...prev.slice(0, 9)]);
  };

  // Mock property data for testing
  const mockProperty = {
    id: "test-property-123",
    title: "Beautiful 3BHK Apartment in Sector 5",
    price: "₹35L",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
    sellerId: "seller-123",
    sellerName: "Rajesh Kumar",
    propertyId: 12345
  };

  const testChatModal = () => {
    addTestResult('🧪 Opening Chat Modal for testing');
    setChatModalOpen(true);
  };

  const testAuthToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
      addTestResult('✅ Auth token found in localStorage');
    } else {
      addTestResult('❌ No auth token found - login required');
    }
  };

  const testChatAPI = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addTestResult('❌ Cannot test API - no auth token');
        return;
      }

      addTestResult('🔄 Testing chat API endpoint...');
      
      const response = await fetch('/api/chat/conversations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        addTestResult(`✅ Chat API works - found ${data.data?.length || 0} conversations`);
      } else {
        addTestResult(`❌ Chat API error: ${response.status}`);
      }
    } catch (error: any) {
      addTestResult(`❌ Chat API failed: ${error.message}`);
    }
  };

  const testPropertyConversationAPI = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addTestResult('❌ Cannot test API - no auth token');
        return;
      }

      addTestResult('🔄 Testing start property conversation API...');
      
      // This should fail gracefully since we're using a test property ID
      const response = await fetch('/api/chat/start-property-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: 'test-property-id',
          message: 'Test message from ChatTest component'
        }),
      });

      const data = await response.json();
      if (response.ok) {
        addTestResult('✅ Property conversation API works');
      } else {
        addTestResult(`⚠️ Property conversation API responded: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      addTestResult(`❌ Property conversation API failed: ${error.message}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        addTestResult(`👤 Current user: ${parsedUser.name} (${parsedUser.userType})`);
      } catch (e) {
        addTestResult('❌ Invalid user data in localStorage');
      }
    } else {
      addTestResult('❌ No user data found');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-6 w-6" />
            <span>Chat System Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button onClick={testChatModal} variant="default" className="text-sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Test Chat Modal
            </Button>
            <Button onClick={testAuthToken} variant="outline" className="text-sm">
              <Check className="h-4 w-4 mr-2" />
              Check Auth Token
            </Button>
            <Button onClick={getCurrentUser} variant="outline" className="text-sm">
              👤 Check User Data
            </Button>
            <Button onClick={testChatAPI} variant="secondary" className="text-sm">
              🔄 Test Chat API
            </Button>
            <Button onClick={testPropertyConversationAPI} variant="secondary" className="text-sm">
              🏠 Test Property API
            </Button>
            <Button onClick={clearResults} variant="outline" className="text-sm">
              <X className="h-4 w-4 mr-2" />
              Clear Results
            </Button>
          </div>

          <div className="bg-black text-green-400 p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-sm">
            <div className="mb-2 text-white">Chat Test Results:</div>
            {testResults.length === 0 ? (
              <div className="text-gray-500">No test results yet. Click a test button to start.</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Test Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>First check if you're logged in (auth token and user data)</li>
              <li>Test the chat modal UI with mock property data</li>
              <li>Test the chat API endpoints for any errors</li>
              <li>Check browser console for any JavaScript errors</li>
              <li>The property conversation API test will fail gracefully with test data</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Chat Modal for Testing */}
      <ChatModal
        isOpen={chatModalOpen}
        onClose={() => {
          setChatModalOpen(false);
          addTestResult('🔄 Chat modal closed');
        }}
        propertyTitle={mockProperty.title}
        propertyPrice={mockProperty.price}
        propertyImage={mockProperty.image}
        sellerId={mockProperty.sellerId}
        sellerName={mockProperty.sellerName}
        propertyId={mockProperty.propertyId}
      />
    </div>
  );
}
