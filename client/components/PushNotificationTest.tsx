import React, { useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAuth } from '../hooks/useAuth';

const PushNotificationTest: React.FC = () => {
  const { notifications, isConnected, clearAllNotifications } = usePushNotifications();
  const { user, isAuthenticated } = useAuth();
  const [testMessage, setTestMessage] = useState('');
  const [testTitle, setTestTitle] = useState('Test Notification');
  const [testType, setTestType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [sending, setSending] = useState(false);

  const sendTestNotification = async () => {
    if (!user || !testTitle || !testMessage) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/test/push-notification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id || user._id,
          title: testTitle,
          message: testMessage,
          type: testType
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Test notification sent successfully:', result);
      } else {
        console.error('❌ Failed to send test notification:', result.error);
      }
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Please login to test push notifications</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Push Notification Test</h2>
      
      {/* Connection Status */}
      <div className="mb-6">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isConnected ? 'bg-green-600' : 'bg-red-600'
          }`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          User: {user?.email || user?.username || 'Unknown'} ({user?.userType || 'user'})
        </p>
      </div>

      {/* Test Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter notification title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter notification message"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <button
          onClick={sendTestNotification}
          disabled={sending || !testTitle || !testMessage || !isConnected}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending...' : 'Send Test Notification'}
        </button>
      </div>

      {/* Notifications List */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">
            Recent Notifications ({notifications.length})
          </h3>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm">No notifications yet</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border-l-4 ${
                  notification.type === 'success' ? 'border-green-500 bg-green-50' :
                  notification.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  notification.type === 'error' ? 'border-red-500 bg-red-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PushNotificationTest;
