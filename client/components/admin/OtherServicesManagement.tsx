import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  Search,
  Filter,
  Phone,
  Clock,
  MapPin,
  Star,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

interface OtherService {
  _id: string;
  category: string;
  name: string;
  phone: string;
  photoUrl?: string;
  openTime: string;
  closeTime: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SERVICE_CATEGORIES = [
  "Plumber",
  "Electrician", 
  "Carpenter",
  "Painter",
  "Cleaner",
  "Security",
  "AC Repair",
  "Appliance Repair",
  "Pest Control",
  "Interior Designer",
  "Architect",
  "Civil Contractor",
  "Movers & Packers",
  "Real Estate Agent",
  "Legal Services",
  "Other"
];

export default function OtherServicesManagement() {
  const { token } = useAuth();
  const [services, setServices] = useState<OtherService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<OtherService | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    category: "",
    name: "",
    phone: "",
    photoUrl: "",
    openTime: "09:00",
    closeTime: "18:00",
    address: "",
  });

  useEffect(() => {
    fetchServices();
  }, [token]);

  const fetchServices = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/other-services", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServices(data.data || []);
        } else {
          setError(data.error || "Failed to fetch services");
        }
      } else if (response.status === 404) {
        // API endpoint doesn't exist yet - show empty state
        console.warn("Other services API endpoint not implemented yet");
        setServices([]);
      } else {
        setError("Failed to fetch services");
      }
    } catch (error: any) {
      console.error("Error fetching services:", error);
      
      if (
        error.message?.includes("Unexpected token") ||
        error.message?.includes("<!doctype")
      ) {
        console.warn("Other services API endpoint not implemented - received HTML instead of JSON");
        setServices([]);
      } else {
        setError("Failed to fetch services");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token) return;

    try {
      setSaving(true);

      const response = await fetch("/api/admin/other-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchServices();
          resetForm();
          setShowCreateDialog(false);
        } else {
          setError(data.error || "Failed to create service");
        }
      } else if (response.status === 404) {
        setError("Other services API not yet implemented. Contact administrator.");
      } else {
        setError("Failed to create service");
      }
    } catch (error: any) {
      console.error("Error creating service:", error);
      if (
        error.message?.includes("Unexpected token") ||
        error.message?.includes("<!doctype")
      ) {
        setError("Other services API not yet implemented. Contact administrator.");
      } else {
        setError("Failed to create service");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!token || !selectedService) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/admin/other-services/${selectedService._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchServices();
          resetForm();
          setShowEditDialog(false);
          setSelectedService(null);
        } else {
          setError(data.error || "Failed to update service");
        }
      } else {
        setError("Failed to update service");
      }
    } catch (error) {
      console.error("Error updating service:", error);
      setError("Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!token || !confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch(`/api/admin/other-services/${serviceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setServices(services.filter(service => service._id !== serviceId));
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      setError("Failed to delete service");
    }
  };

  const handleBulkUpload = async () => {
    if (!token || !selectedFile) return;

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/admin/other-services/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchServices();
          setShowBulkUploadDialog(false);
          setSelectedFile(null);
        } else {
          setError(data.error || "Failed to import services");
        }
      } else if (response.status === 404) {
        setError("Bulk import API not yet implemented. Contact administrator.");
      } else {
        setError("Failed to import services");
      }
    } catch (error: any) {
      console.error("Error importing services:", error);
      if (
        error.message?.includes("Unexpected token") ||
        error.message?.includes("<!doctype")
      ) {
        setError("Bulk import API not yet implemented. Contact administrator.");
      } else {
        setError("Failed to import services");
      }
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: "",
      name: "",
      phone: "",
      photoUrl: "",
      openTime: "09:00",
      closeTime: "18:00",
      address: "",
    });
  };

  const populateForm = (service: OtherService) => {
    setFormData({
      category: service.category,
      name: service.name,
      phone: service.phone,
      photoUrl: service.photoUrl || "",
      openTime: service.openTime,
      closeTime: service.closeTime,
      address: service.address,
    });
  };

  const exportServices = async () => {
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/other-services/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'other-services-export.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        setError('Failed to export services');
      }
    } catch (error) {
      setError('Network error while exporting services');
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.phone.includes(searchTerm) ||
                         service.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.isActive).length,
    categoriesCount: new Set(services.map(s => s.category)).size,
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError("");
              fetchServices();
            }}
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Other Services Management</h3>
          <p className="text-gray-600">Manage service providers and bulk upload from CSV/XLSX</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowBulkUploadDialog(true)}
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
          <Button
            onClick={exportServices}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#C70000] hover:bg-[#A60000]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">Service providers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeServices}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.categoriesCount}</div>
            <p className="text-xs text-muted-foreground">Service types</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {SERVICE_CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Provider</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      {service.photoUrl && (
                        <img
                          src={service.photoUrl}
                          alt={service.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.category}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{service.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">{service.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">{service.openTime} - {service.closeTime}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-sm truncate max-w-[150px]">{service.address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.isActive ? "default" : "secondary"}>
                      {service.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedService(service);
                          setShowViewDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedService(service);
                          populateForm(service);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(service._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredServices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    <div className="space-y-2">
                      <p>No services found.</p>
                      <p className="text-xs text-gray-400">
                        Other services API is not yet implemented. This feature will be available in a future update.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Service Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter service provider name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Photo URL</label>
                <Input
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="Enter photo URL..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Opening Time</label>
                <Input
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Closing Time</label>
                <Input
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address *</label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                className="bg-[#C70000] hover:bg-[#A60000]"
                disabled={saving}
              >
                {saving ? "Creating..." : "Create Service"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter service provider name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate} 
                className="bg-[#C70000] hover:bg-[#A60000]"
                disabled={saving}
              >
                {saving ? "Updating..." : "Update Service"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Service Provider Details</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {selectedService.photoUrl && (
                  <img
                    src={selectedService.photoUrl}
                    alt={selectedService.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h4 className="text-lg font-semibold">{selectedService.name}</h4>
                  <Badge variant="outline">{selectedService.category}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="flex items-center space-x-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{selectedService.phone}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Hours</label>
                  <p className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{selectedService.openTime} - {selectedService.closeTime}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="flex items-start space-x-1 mt-1">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span>{selectedService.address}</span>
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Upload Services</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">CSV/XLSX Format</h4>
              <p className="text-sm text-blue-700 mb-3">Your file should contain the following columns:</p>
              <div className="text-xs font-mono bg-white p-2 rounded border">
                category, name, phone, photoUrl, openTime, closeTime, address
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select File</label>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <p className="text-sm text-gray-500 mt-1">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowBulkUploadDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkUpload}
                className="bg-[#C70000] hover:bg-[#A60000]"
                disabled={uploading || !selectedFile}
              >
                {uploading ? "Uploading..." : "Upload Services"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-orange-500" />
            <span>Other Services Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-orange-800">
                Other Services: Development Ready
              </span>
            </div>
            <p className="text-sm text-orange-700">
              Frontend interface is ready with CRUD operations, bulk upload functionality, and export features. 
              Backend API endpoints need to be implemented to make this fully functional.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
