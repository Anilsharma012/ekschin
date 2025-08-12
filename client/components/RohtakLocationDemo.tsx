import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import {
  MapPin,
  Building,
  Home,
  Landmark,
  Store,
  Star,
  Search,
  Database,
  Settings,
  CheckCircle,
  AlertCircle,
  BarChart3
} from "lucide-react";
import LocationSelector from "./LocationSelector";
import { RohtakLocation, LOCATION_TYPES } from "@shared/location-types";

interface LocationStats {
  total: number;
  active: number;
  popular: number;
  byType: Array<{
    type: string;
    total: number;
    active: number;
    popular: number;
  }>;
}

export default function RohtakLocationDemo() {
  const [stats, setStats] = useState<LocationStats | null>(null);
  const [locations, setLocations] = useState<RohtakLocation[]>([]);
  const [locationsByType, setLocationsByType] = useState<any[]>([]);
  const [popularLocations, setPopularLocations] = useState<RohtakLocation[]>([]);
  const [searchResults, setSearchResults] = useState<RohtakLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>({ address: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch location statistics
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/locations/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        setIsInitialized(data.data.total > 0);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch locations by type
  const fetchLocationsByType = async () => {
    try {
      const response = await fetch("/api/locations/by-type");
      const data = await response.json();
      if (data.success) {
        setLocationsByType(data.data);
      }
    } catch (error) {
      console.error("Error fetching locations by type:", error);
    }
  };

  // Fetch popular locations
  const fetchPopularLocations = async () => {
    try {
      const response = await fetch("/api/locations/popular");
      const data = await response.json();
      if (data.success) {
        setPopularLocations(data.data);
      }
    } catch (error) {
      console.error("Error fetching popular locations:", error);
    }
  };

  // Search locations
  const searchLocations = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error("Error searching locations:", error);
    }
  };

  // Initialize locations
  const initializeLocations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/locations/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Successfully initialized ${data.data.initialized} locations!`);
        setIsInitialized(true);
        fetchStats();
        fetchLocationsByType();
        fetchPopularLocations();
      } else {
        setError(data.error || "Failed to initialize locations");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get icon for location type
  const getLocationIcon = (type: string) => {
    const icons = {
      sector: Building,
      mohalla: Home,
      landmark: Landmark,
      area: MapPin,
      colony: Home,
      road: Road,
      market: Store,
      society: Building
    };
    
    const IconComponent = icons[type as keyof typeof icons] || MapPin;
    return <IconComponent className="h-4 w-4" />;
  };

  useEffect(() => {
    fetchStats();
    fetchLocationsByType();
    fetchPopularLocations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchLocations(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏙️ Rohtak Location Coverage System
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive location management system for Rohtak with sectors, mohallas, landmarks, and more. 
            Complete admin control with MongoDB integration.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Initialization Section */}
        {!isInitialized && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Initialize Location Database</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Initialize the comprehensive Rohtak location database with all sectors, mohallas, landmarks, and areas.
              </p>
              <Button onClick={initializeLocations} disabled={loading}>
                {loading ? "Initializing..." : "Initialize Rohtak Locations"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Locations</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold">{stats.active}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Popular</p>
                    <p className="text-2xl font-bold">{stats.popular}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Categories</p>
                    <p className="text-2xl font-bold">{stats.byType.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="selector" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="selector">Location Selector</TabsTrigger>
            <TabsTrigger value="search">Search Demo</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Location Selector Demo */}
          <TabsContent value="selector">
            <Card>
              <CardHeader>
                <CardTitle>🎯 Location Selector Component</CardTitle>
                <p className="text-sm text-gray-600">
                  Interactive location selector for property posting - exactly like OLX.in
                </p>
              </CardHeader>
              <CardContent>
                <LocationSelector
                  value={selectedLocation}
                  onChange={setSelectedLocation}
                  required={true}
                />
                
                {/* Selected Location Display */}
                {(selectedLocation.sector || selectedLocation.mohalla || selectedLocation.landmark || selectedLocation.area || selectedLocation.address) && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Selected Location:</h4>
                    <div className="space-y-1 text-sm">
                      {selectedLocation.sector && <p><strong>Sector:</strong> {selectedLocation.sector}</p>}
                      {selectedLocation.mohalla && <p><strong>Mohalla:</strong> {selectedLocation.mohalla}</p>}
                      {selectedLocation.landmark && <p><strong>Landmark:</strong> {selectedLocation.landmark}</p>}
                      {selectedLocation.area && <p><strong>Area:</strong> {selectedLocation.area}</p>}
                      {selectedLocation.address && <p><strong>Address:</strong> {selectedLocation.address}</p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Demo */}
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>🔍 Location Search</CardTitle>
                <p className="text-sm text-gray-600">
                  Fast autocomplete search across all locations
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search locations (e.g., Sector 14, AIIMS, Model Town)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="border rounded-lg max-h-64 overflow-y-auto">
                      {searchResults.map((location) => (
                        <div key={location._id} className="p-3 border-b last:border-b-0 flex items-center space-x-3">
                          {getLocationIcon(location.type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{location.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {LOCATION_TYPES.find(t => t.value === location.type)?.label}
                              </Badge>
                              {location.isPopular && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                            {location.pincode && (
                              <p className="text-xs text-gray-500">PIN: {location.pincode}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {searchQuery && searchResults.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No locations found for "{searchQuery}"</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locationsByType.map((category) => (
                <Card key={category.type}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      {getLocationIcon(category.type)}
                      <span>{LOCATION_TYPES.find(t => t.value === category.type)?.label}s</span>
                      <Badge variant="secondary">{category.locations.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {category.locations.slice(0, 10).map((location: any) => (
                        <div key={location._id} className="flex items-center justify-between text-sm">
                          <span>{location.name}</span>
                          {location.isPopular && (
                            <Star className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      ))}
                      {category.locations.length > 10 && (
                        <p className="text-xs text-gray-500">
                          ...and {category.locations.length - 10} more
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Popular Locations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Popular Locations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {popularLocations.slice(0, 10).map((location) => (
                      <div key={location._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                        {getLocationIcon(location.type)}
                        <div className="flex-1">
                          <span className="font-medium">{location.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {LOCATION_TYPES.find(t => t.value === location.type)?.label}
                          </Badge>
                        </div>
                        <Star className="h-4 w-4 text-yellow-500" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Type Distribution */}
              {stats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                      <span>Location Distribution</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.byType.map((type) => (
                        <div key={type.type} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              {getLocationIcon(type.type)}
                              <span className="text-sm font-medium">
                                {LOCATION_TYPES.find(t => t.value === type.type)?.label}s
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">{type.total}</span>
                          </div>
                          <div className="flex space-x-2 text-xs">
                            <Badge variant="outline" className="bg-green-50">
                              Active: {type.active}
                            </Badge>
                            <Badge variant="outline" className="bg-yellow-50">
                              Popular: {type.popular}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Admin Link */}
        <Card className="mt-8">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <Settings className="h-4 w-4" />
              <span>Admin can manage all locations from</span>
              <Button variant="link" onClick={() => window.location.href = "/admin"} className="p-0 h-auto">
                Admin Dashboard → Locations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
