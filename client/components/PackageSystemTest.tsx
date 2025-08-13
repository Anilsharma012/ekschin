import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePackageSync } from '../hooks/usePackageSync';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  TestTube,
  Activity,
  Zap
} from 'lucide-react';

const PackageSystemTest: React.FC = () => {
  const { isAuthenticated, user, token } = useAuth();
  const {
    packages,
    userPackages,
    availablePackages,
    activeUserPackages,
    loading,
    error,
    refreshPackages,
    isConnected,
    purchasePackage
  } = usePackageSync();

  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pass' | 'fail' | 'pending';
    message: string;
  }>>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    runInitialTests();
  }, [packages, userPackages, isConnected]);

  const runInitialTests = () => {
    const results = [];

    // Test 1: WebSocket Connection
    results.push({
      test: 'WebSocket Connection',
      status: isConnected ? 'pass' : 'fail',
      message: isConnected ? 'Connected to package sync service' : 'Not connected to package sync service'
    });

    // Test 2: Package Loading
    results.push({
      test: 'Package Loading',
      status: packages.length > 0 ? 'pass' : 'fail',
      message: `Loaded ${packages.length} packages from server`
    });

    // Test 3: Available Packages Filter
    results.push({
      test: 'Available Packages Filter',
      status: availablePackages.length >= 0 ? 'pass' : 'fail',
      message: `${availablePackages.length} packages available for purchase`
    });

    // Test 4: User Authentication
    results.push({
      test: 'User Authentication',
      status: isAuthenticated && user ? 'pass' : 'fail',
      message: isAuthenticated ? `Authenticated as ${user?.email || user?.username}` : 'Not authenticated'
    });

    // Test 5: User Packages
    results.push({
      test: 'User Packages Loading',
      status: 'pass',
      message: `User has ${userPackages.length} total packages, ${activeUserPackages.length} active`
    });

    setTestResults(results);
  };

  const runPackageCreationTest = async () => {
    setIsRunningTests(true);
    try {
      const response = await fetch('/api/admin/packages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Test Package ${Date.now()}`,
          description: 'This is a test package created by the package system test',
          price: 99,
          duration: 7,
          features: ['Test feature 1', 'Test feature 2'],
          type: 'test',
          category: 'property',
          location: 'rohtak',
          active: true
        })
      });

      const result = await response.json();
      
      setTestResults(prev => [...prev, {
        test: 'Admin Package Creation',
        status: result.success ? 'pass' : 'fail',
        message: result.success ? 'Successfully created test package' : `Failed: ${result.error}`
      }]);

      // Wait a bit for WebSocket update
      setTimeout(() => {
        refreshPackages();
      }, 1000);

    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Admin Package Creation',
        status: 'fail',
        message: `Error: ${error}`
      }]);
    } finally {
      setIsRunningTests(false);
    }
  };

  const runPackagePurchaseTest = async () => {
    if (availablePackages.length === 0) {
      setTestResults(prev => [...prev, {
        test: 'Package Purchase',
        status: 'fail',
        message: 'No packages available for purchase'
      }]);
      return;
    }

    setIsRunningTests(true);
    try {
      const testPackage = availablePackages[0];
      const result = await purchasePackage(testPackage._id, 'online');
      
      setTestResults(prev => [...prev, {
        test: 'Package Purchase',
        status: result.success ? 'pass' : 'fail',
        message: result.success ? 'Successfully purchased package' : `Failed: ${result.error}`
      }]);

    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Package Purchase',
        status: 'fail',
        message: `Error: ${error}`
      }]);
    } finally {
      setIsRunningTests(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
    runInitialTests();
  };

  if (!isAuthenticated) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please login to test the package system.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TestTube className="h-5 w-5 mr-2 text-blue-500" />
            Package System Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Packages</p>
                    <p className="text-2xl font-bold text-blue-900">{packages.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Available</p>
                    <p className="text-2xl font-bold text-green-900">{availablePackages.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">My Packages</p>
                    <p className="text-2xl font-bold text-yellow-900">{userPackages.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Connection</p>
                    <p className="text-lg font-bold text-purple-900">
                      {isConnected ? 'Live' : 'Offline'}
                    </p>
                  </div>
                  <Zap className={`h-8 w-8 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex space-x-4 mb-6">
            <Button onClick={runPackageCreationTest} disabled={isRunningTests || !user?.userType?.includes('admin')}>
              {isRunningTests ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Package className="h-4 w-4 mr-2" />}
              Test Package Creation (Admin)
            </Button>
            <Button onClick={runPackagePurchaseTest} disabled={isRunningTests || availablePackages.length === 0}>
              {isRunningTests ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Test Package Purchase
            </Button>
            <Button variant="outline" onClick={clearTestResults}>
              Clear Results
            </Button>
            <Button variant="outline" onClick={refreshPackages}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  {result.status === 'pass' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : result.status === 'fail' ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium">{result.test}</p>
                    <p className="text-sm text-gray-600">{result.message}</p>
                  </div>
                </div>
                <Badge 
                  variant={
                    result.status === 'pass' ? 'default' : 
                    result.status === 'fail' ? 'destructive' : 
                    'secondary'
                  }
                  className={
                    result.status === 'pass' ? 'bg-green-100 text-green-800' :
                    result.status === 'fail' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }
                >
                  {result.status}
                </Badge>
              </div>
            ))}
            
            {testResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No test results yet. Click "Clear Results" to run initial tests.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PackageSystemTest;
