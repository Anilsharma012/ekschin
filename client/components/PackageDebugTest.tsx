import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Package, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Database,
  Globe,
  Settings
} from 'lucide-react';

const PackageDebugTest: React.FC = () => {
  const [packageData, setPackageData] = useState<any>({
    admin: [],
    frontend: [],
    postUpload: []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const testAllPackageEndpoints = async () => {
    setLoading(true);
    setErrors([]);
    const newErrors: string[] = [];
    const results = { admin: [], frontend: [], postUpload: [] };

    try {
      // Test 1: Admin packages (what admin creates)
      console.log('🔍 Testing admin packages endpoint...');
      const adminResponse = await fetch('/api/packages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (adminResponse.ok) {
        const adminData = await adminResponse.json();
        results.admin = adminData.data || [];
        console.log('✅ Admin packages:', results.admin);
      } else {
        newErrors.push(`Admin packages API failed: ${adminResponse.status}`);
      }

      // Test 2: Frontend packages (what frontend shows)
      console.log('🔍 Testing frontend packages endpoint...');
      const frontendResponse = await fetch('/api/packages?activeOnly=true');
      
      if (frontendResponse.ok) {
        const frontendData = await frontendResponse.json();
        results.frontend = frontendData.data || [];
        console.log('✅ Frontend packages:', results.frontend);
      } else {
        newErrors.push(`Frontend packages API failed: ${frontendResponse.status}`);
      }

      // Test 3: Package selection during post upload
      console.log('🔍 Testing package selection...');
      try {
        const { usePackageSync } = await import('../hooks/usePackageSync');
        console.log('✅ usePackageSync hook accessible');
      } catch (hookError) {
        newErrors.push('usePackageSync hook failed to load');
      }

      setPackageData(results);
      setErrors(newErrors);

    } catch (error) {
      console.error('❌ Package debug test failed:', error);
      setErrors([`Test failed: ${error}`]);
    } finally {
      setLoading(false);
    }
  };

  const createTestPackage = async () => {
    setLoading(true);
    try {
      const testPackage = {
        name: `Test Package ${Date.now()}`,
        description: 'यह एक test advertisement listing package है जो debug के लिए create किया गया है',
        price: 199,
        duration: 30,
        features: ['Test feature 1', 'Test feature 2', 'Advertisement listing'],
        type: 'premium',
        category: 'property',
        location: 'rohtak',
        active: true,
        maxListings: 5
      };

      console.log('📦 Creating test package:', testPackage);

      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPackage)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Test package created:', result);
        alert('✅ Test package created successfully! Check home page and post upload.');
        await testAllPackageEndpoints(); // Refresh data
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to create test package:', errorData);
        alert(`❌ Failed to create test package: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error creating test package:', error);
      alert(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAllPackageEndpoints();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-500" />
            Package System Debug Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <Button onClick={testAllPackageEndpoints} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Test All Endpoints
            </Button>
            <Button onClick={createTestPackage} disabled={loading} variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Create Test Package
            </Button>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc ml-4">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Admin Packages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-green-500" />
              Admin Packages ({packageData.admin.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {packageData.admin.length === 0 ? (
                <p className="text-gray-500 text-sm">No packages found</p>
              ) : (
                packageData.admin.map((pkg: any, index: number) => (
                  <div key={index} className="p-2 border rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{pkg.name}</p>
                        <p className="text-xs text-gray-600">₹{pkg.price} - {pkg.type}</p>
                      </div>
                      <Badge variant={pkg.active ? "default" : "secondary"}>
                        {pkg.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Frontend Packages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-500" />
              Frontend Packages ({packageData.frontend.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {packageData.frontend.length === 0 ? (
                <p className="text-gray-500 text-sm">No packages visible on frontend</p>
              ) : (
                packageData.frontend.map((pkg: any, index: number) => (
                  <div key={index} className="p-2 border rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{pkg.name}</p>
                        <p className="text-xs text-gray-600">₹{pkg.price} - {pkg.type}</p>
                      </div>
                      <Badge variant="default">
                        Visible
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Package Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-purple-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Admin API</span>
                {packageData.admin.length > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Frontend API</span>
                {packageData.frontend.length > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Package Sync</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded text-sm">
            <p><strong>Admin endpoint:</strong> /api/packages</p>
            <p><strong>Frontend endpoint:</strong> /api/packages?activeOnly=true</p>
            <p><strong>Collection:</strong> ad_packages</p>
            <p><strong>Expected fields:</strong> active, type, category</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PackageDebugTest;
