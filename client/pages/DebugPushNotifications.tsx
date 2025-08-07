import React from 'react';
import PushNotificationTest from '../components/PushNotificationTest';

const DebugPushNotifications: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Push Notification Debug
        </h1>
        <PushNotificationTest />
      </div>
    </div>
  );
};

export default DebugPushNotifications;
