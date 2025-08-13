import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import NetworkStatus from './NetworkStatus';

export default function NetworkStatusTest() {
  const [showComponent, setShowComponent] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [`[${timestamp}] ${result}`, ...prev.slice(0, 9)]);
  };

  const testHealthEndpoint = async () => {
    try {
      addTestResult('Testing /api/health endpoint...');
      const response = await fetch('/api/health');
      const data = await response.json();
      
      if (response.ok) {
        addTestResult(`✅ Health endpoint working: ${data.status}`);
      } else {
        addTestResult(`❌ Health endpoint error: ${response.status}`);
      }
    } catch (error: any) {
      addTestResult(`❌ Health endpoint failed: ${error.message}`);
    }
  };

  const testPingEndpoint = async () => {
    try {
      addTestResult('Testing /api/ping endpoint...');
      const response = await fetch('/api/ping');
      const data = await response.json();
      
      if (response.ok) {
        addTestResult(`✅ Ping endpoint working: ${data.message}`);
      } else {
        addTestResult(`❌ Ping endpoint error: ${response.status}`);
      }
    } catch (error: any) {
      addTestResult(`❌ Ping endpoint failed: ${error.message}`);
    }
  };

  const toggleComponent = () => {
    setShowComponent(!showComponent);
    addTestResult(showComponent ? 'NetworkStatus unmounted' : 'NetworkStatus mounted');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  useEffect(() => {
    addTestResult('NetworkStatus test component loaded');
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>NetworkStatus Component Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testHealthEndpoint} variant="default">
              Test /api/health
            </Button>
            <Button onClick={testPingEndpoint} variant="secondary">
              Test /api/ping
            </Button>
            <Button onClick={toggleComponent} variant="outline">
              {showComponent ? 'Hide' : 'Show'} NetworkStatus
            </Button>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={showComponent ? 'default' : 'secondary'}>
              NetworkStatus: {showComponent ? 'Mounted' : 'Unmounted'}
            </Badge>
          </div>

          <div className="bg-black text-green-400 p-4 rounded-lg max-h-64 overflow-y-auto font-mono text-sm">
            <div className="mb-2 text-white">Test Results:</div>
            {testResults.length === 0 ? (
              <div className="text-gray-500">No test results yet...</div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Test endpoints to verify API connectivity</li>
              <li>Mount/unmount NetworkStatus to test for AbortErrors</li>
              <li>Check browser console for any error messages</li>
              <li>NetworkStatus should handle errors gracefully without AbortError</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Conditionally render NetworkStatus for testing */}
      {showComponent && <NetworkStatus />}
    </div>
  );
}
