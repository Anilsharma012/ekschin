import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Star,
  Eye,
  EyeOff,
  Upload,
  Download,
  BarChart3,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { RohtakLocation, LocationSearchFilters, LOCATION_TYPES } from "@shared/location-types";

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

export default function LocationManagement() {
  const [locations, setLocations] = useState<RohtakLocation[]>([]);
  const [stats, setStats] = useState<LocationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LocationSearchFilters>({
    search: "",
    type: "",
    isActive: undefined,
    isPopular: undefined,
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<RohtakLocation | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    pincode: "",
    isActive: true,
    isPopular: false,
    order: 0,
    aliases: ""
  });
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [importing, setImporting] = useState(false);

  // Fetch locations
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append("search", filters.search);
      if (filters.type) params.append("type", filters.type);
      if (filters.isActive !== undefined) params.append("isActive", filters.isActive.toString());
      if (filters.isPopular !== undefined) params.append("isPopular", filters.isPopular.toString());
      params.append("page", filters.page?.toString() || "1");
      params.append("limit", filters.limit?.toString() || "20");

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/locations?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setLocations(data.data.locations);
        setPagination(data.data.pagination);
      } else {
        setError(data.error || "Failed to fetch locations");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch location statistics
  const fetchLocationStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/locations/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching location stats:", error);
    }
  };

  // Create location
  const handleCreateLocation = async () => {
    try {
      const token = localStorage.getItem("token");
      const aliases = formData.aliases ? formData.aliases.split(",").map(s => s.trim()).filter(s => s) : [];
      
      const response = await fetch("/api/admin/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          aliases
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Location created successfully");
        setIsCreateModalOpen(false);
        resetForm();
        fetchLocations();
        fetchLocationStats();
      } else {
        setError(data.error || "Failed to create location");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  // Update location
  const handleUpdateLocation = async () => {
    if (!selectedLocation) return;

    try {
      const token = localStorage.getItem("token");
      const aliases = formData.aliases ? formData.aliases.split(",").map(s => s.trim()).filter(s => s) : [];
      
      const response = await fetch(`/api/admin/locations/${selectedLocation._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          aliases
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Location updated successfully");
        setIsEditModalOpen(false);
        setSelectedLocation(null);
        resetForm();
        fetchLocations();
        fetchLocationStats();
      } else {
        setError(data.error || "Failed to update location");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  // Delete location
  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm("Are you sure you want to delete this location?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/locations/${locationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("Location deleted successfully");
        fetchLocations();
        fetchLocationStats();
      } else {
        setError(data.error || "Failed to delete location");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  // Initialize Rohtak locations
  const handleInitializeLocations = async () => {
    if (!confirm("This will initialize all default Rohtak locations. Continue?")) {
      return;
    }

    try {
      setImporting(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/locations/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`Initialized ${data.data.initialized} locations successfully`);
        fetchLocations();
        fetchLocationStats();
      } else {
        setError(data.error || "Failed to initialize locations");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      description: "",
      pincode: "",
      isActive: true,
      isPopular: false,
      order: 0,
      aliases: ""
    });
  };

  // Open edit modal
  const openEditModal = (location: RohtakLocation) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      type: location.type,
      description: location.description || "",
      pincode: location.pincode || "",
      isActive: location.isActive,
      isPopular: location.isPopular,
      order: location.order,
      aliases: location.aliases?.join(", ") || ""
    });
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    fetchLocations();
    fetchLocationStats();
  }, [filters]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rohtak Location Management</h1>
          <p className="text-gray-600">Manage locations, mohallas, sectors, and landmarks</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleInitializeLocations} disabled={importing} variant="outline">
            {importing ? "Initializing..." : "Initialize Default Locations"}
          </Button>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Eye className="h-5 w-5 text-green-500" />
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
                  <p className="text-sm text-gray-600">Types</p>
                  <p className="text-2xl font-bold">{stats.byType.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search locations..."
                value={filters.search || ""}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.type || ""} onValueChange={(value) => setFilters({ ...filters, type: value || undefined })}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {LOCATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.isActive?.toString() || ""} 
              onValueChange={(value) => setFilters({ ...filters, isActive: value ? value === "true" : undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.isPopular?.toString() || ""} 
              onValueChange={(value) => setFilters({ ...filters, isPopular: value ? value === "true" : undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Popularity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Popularity</SelectItem>
                <SelectItem value="true">Popular</SelectItem>
                <SelectItem value="false">Not Popular</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => setFilters({ search: "", type: "", isActive: undefined, isPopular: undefined, page: 1, limit: 20 })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading locations...</div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No locations found. Try adjusting your filters or add new locations.
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <div key={location._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold">{location.name}</h3>
                        <Badge variant="outline">
                          {LOCATION_TYPES.find(t => t.value === location.type)?.icon} {location.type}
                        </Badge>
                        {location.isPopular && (
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        {location.isActive ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Eye className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {location.description && (
                        <p className="text-sm text-gray-600 mt-1">{location.description}</p>
                      )}
                      {location.pincode && (
                        <p className="text-sm text-gray-500">PIN: {location.pincode}</p>
                      )}
                      {location.aliases && location.aliases.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Aliases: </span>
                          {location.aliases.map((alias, index) => (
                            <Badge key={index} variant="outline" className="mr-1 text-xs">
                              {alias}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(location)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLocation(location._id!)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    disabled={pagination.page <= 1}
                    onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Location Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter location name"
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pincode">PIN Code</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="124001"
                />
              </div>
              <div>
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="aliases">Aliases (comma-separated)</Label>
              <Input
                id="aliases"
                value={formData.aliases}
                onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                placeholder="Alternative names, nicknames"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPopular"
                  checked={formData.isPopular}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                />
                <Label htmlFor="isPopular">Popular</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateLocation}>
                Create Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Location Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editName">Location Name *</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter location name"
                />
              </div>
              <div>
                <Label htmlFor="editType">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editPincode">PIN Code</Label>
                <Input
                  id="editPincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="124001"
                />
              </div>
              <div>
                <Label htmlFor="editOrder">Order</Label>
                <Input
                  id="editOrder"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="editAliases">Aliases (comma-separated)</Label>
              <Input
                id="editAliases"
                value={formData.aliases}
                onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                placeholder="Alternative names, nicknames"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="editIsActive">Active</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsPopular"
                  checked={formData.isPopular}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPopular: checked })}
                />
                <Label htmlFor="editIsPopular">Popular</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateLocation}>
                Update Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
