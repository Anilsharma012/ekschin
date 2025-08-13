import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { createApiUrl } from '../lib/api';

export default function AdminLoginErrorTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  // Override console methods to capture logs
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  const startLogCapture = () => {
    console.error = (...args) => {
      addLog(`ERROR: ${args.join(' ')}`);
      originalConsoleError(...args);
    };
    console.log = (...args) => {
      if (args[0] && (args[0].includes('🔐') || args[0].includes('❌') || args[0].includes('📋'))) {
        addLog(`LOG: ${args.join(' ')}`);
      }
      originalConsoleLog(...args);
    };
  };

  const stopLogCapture = () => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  };

  const testInvalidLogin = async () => {
    setLoading(true);
    startLogCapture();
    addLog('🧪 Testing invalid admin login...');

    try {
      const loginData = {
        email: 'invalid@test.com',
        password: 'wrongpassword',
        userType: 'admin'
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(createApiUrl("auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify(loginData),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        addLog(`❌ Expected invalid login response: ${response.status} ${response.statusText}`);
        throw new Error(`Server error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        addLog(`❌ Expected login failure: ${data.error}`);
      } else {
        addLog(`⚠️ Unexpected login success!`);
      }
    } catch (error: any) {
      // This should trigger our fixed error handling
      addLog(`❌ Caught expected error: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(stopLogCapture, 1000); // Stop capturing after a delay
    }
  };

  const testNetworkError = async () => {
    setLoading(true);
    startLogCapture();
    addLog('🧪 Testing network error...');

    try {
      const controller = new AbortController();
      controller.abort(); // Immediately abort to trigger AbortError

      const response = await fetch(createApiUrl("auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
      });

    } catch (error: any) {
      addLog(`❌ Expected network error: ${error.name} - ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(stopLogCapture, 1000);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Admin Login Error Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This component tests admin login error handling to ensure errors are properly serialized and don't show "[object Object]".
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={testInvalidLogin} 
              variant="secondary"
              disabled={loading}
            >
              {loading ? 'Testing...' : 'Test Invalid Login'}
            </Button>
            <Button 
              onClick={testNetworkError} 
              variant="secondary"
              disabled={loading}
            >
              {loading ? 'Testing...' : 'Test Network Error'}
            </Button>
            <Button onClick={clearLogs} variant="outline">
              Clear Logs
            </Button>
          </div>

          <div className="bg-black text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
            <div className="mb-2 text-white">Admin Login Error Test Logs:</div>
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click a test button to start.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1 break-all">
                  {log}
                </div>
              ))
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Expected behavior:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Invalid login should fail with proper error message</li>
              <li>Network errors should be handled gracefully</li>
              <li>No "[object Object]" should appear in any logs</li>
              <li>All error information should be properly formatted</li>
              <li>Console logs should show structured JSON data</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
