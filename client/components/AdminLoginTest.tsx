import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Shield, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Globe,
  Server,
  Wifi,
  User
} from 'lucide-react';
import { createApiUrl } from '../lib/api';

const AdminLoginTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');

  const runConnectivityTests = async () => {
    setLoading(true);
    const results: any[] = [];

    try {
      // Test 1: Basic ping
      console.log('🔍 Testing server connectivity...');
      try {
        const pingResponse = await fetch(createApiUrl('ping'), {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        results.push({
          test: 'Server Connectivity',
          status: pingResponse.ok ? 'pass' : 'fail',
          message: pingResponse.ok ? 'Server is reachable' : `Server returned ${pingResponse.status}`,
          details: `Response: ${pingResponse.status} ${pingResponse.statusText}`
        });
        
        setServerStatus(pingResponse.ok ? 'online' : 'offline');
      } catch (pingError) {
        results.push({
          test: 'Server Connectivity',
          status: 'fail',
          message: 'Cannot reach server',
          details: `Error: ${pingError.message}`
        });
        setServerStatus('offline');
      }

      // Test 2: CORS Check
      console.log('🔍 Testing CORS configuration...');
      try {
        const corsResponse = await fetch(createApiUrl('auth/login'), {
          method: 'OPTIONS',
          headers: {
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization'
          }
        });
        
        results.push({
          test: 'CORS Configuration',
          status: corsResponse.ok ? 'pass' : 'fail',
          message: corsResponse.ok ? 'CORS properly configured' : 'CORS configuration issue',
          details: `Status: ${corsResponse.status}, Headers: ${corsResponse.headers.get('Access-Control-Allow-Origin')}`
        });
      } catch (corsError) {
        results.push({
          test: 'CORS Configuration',
          status: 'fail',
          message: 'CORS test failed',
          details: `Error: ${corsError.message}`
        });
      }

      // Test 3: Admin Login Endpoint Test
      console.log('🔍 Testing admin login endpoint...');
      try {
        const loginResponse = await fetch(createApiUrl('auth/login'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'invalid_password',
            userType: 'admin'
          })
        });
        
        const loginData = await loginResponse.json();
        
        results.push({
          test: 'Login Endpoint',
          status: 'pass', // Even 401 is expected for invalid credentials
          message: 'Login endpoint is responding',
          details: `Status: ${loginResponse.status}, Response: ${loginData.error || 'OK'}`
        });
      } catch (loginError) {
        results.push({
          test: 'Login Endpoint',
          status: 'fail',
          message: 'Login endpoint not accessible',
          details: `Error: ${loginError.message}`
        });
      }

      // Test 4: Network Speed Test
      console.log('🔍 Testing network speed...');
      const startTime = Date.now();
      try {
        await fetch(createApiUrl('ping'));
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        results.push({
          test: 'Network Speed',
          status: responseTime < 2000 ? 'pass' : 'warning',
          message: `Response time: ${responseTime}ms`,
          details: responseTime < 1000 ? 'Fast connection' : responseTime < 2000 ? 'Moderate connection' : 'Slow connection'
        });
      } catch (speedError) {
        results.push({
          test: 'Network Speed',
          status: 'fail',
          message: 'Network speed test failed',
          details: `Error: ${speedError.message}`
        });
      }

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      setTestResults(results);
      setLoading(false);
    }
  };

  const testAdminLogin = async () => {
    setLoading(true);
    try {
      console.log('🔐 Testing admin login with default credentials...');
      
      const loginResponse = await fetch(createApiUrl('auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'admin@ashishproperty.com',
          password: 'admin123',
          userType: 'admin'
        })
      });

      const loginData = await loginResponse.json();
      
      if (loginData.success) {
        alert('✅ Admin login successful! You can now login with these credentials.');
      } else {
        alert(`❌ Admin login failed: ${loginData.error}`);
      }
    } catch (error) {
      alert(`❌ Login test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runConnectivityTests();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-500" />
            Admin Login Connectivity Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Server Status</p>
                    <p className="text-lg font-bold text-blue-900">
                      {serverStatus === 'online' ? 'Online' : 
                       serverStatus === 'offline' ? 'Offline' : 'Checking...'}
                    </p>
                  </div>
                  <Server className={`h-8 w-8 ${
                    serverStatus === 'online' ? 'text-green-500' : 
                    serverStatus === 'offline' ? 'text-red-500' : 'text-gray-500'
                  }`} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">API URL</p>
                    <p className="text-xs font-mono text-green-900">
                      {createApiUrl('auth/login')}
                    </p>
                  </div>
                  <Globe className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Environment</p>
                    <p className="text-lg font-bold text-purple-900">
                      {process.env.NODE_ENV || 'development'}
                    </p>
                  </div>
                  <Wifi className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex space-x-4 mb-6">
            <Button onClick={runConnectivityTests} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Run Tests
            </Button>
            <Button onClick={testAdminLogin} disabled={loading} variant="outline">
              <User className="h-4 w-4 mr-2" />
              Test Admin Login
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-start space-x-3">
                  {result.status === 'pass' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : result.status === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">{result.test}</p>
                    <p className="text-sm text-gray-600">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-gray-500 mt-1">{result.details}</p>
                    )}
                  </div>
                </div>
                <Badge 
                  variant={
                    result.status === 'pass' ? 'default' : 
                    result.status === 'warning' ? 'secondary' :
                    'destructive'
                  }
                  className={
                    result.status === 'pass' ? 'bg-green-100 text-green-800' :
                    result.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }
                >
                  {result.status}
                </Badge>
              </div>
            ))}
            
            {testResults.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                Click "Run Tests" to check admin login connectivity.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Admin Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Test Credentials (Development)</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Super Admin:</strong><br/>
                Email: admin@ashishproperty.com<br/>
                Password: admin123
              </div>
              <div>
                <strong>Test Admin:</strong><br/>
                Email: test@ashishproperty.com<br/>
                Password: test123
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginTest;
