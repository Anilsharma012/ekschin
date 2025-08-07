import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  Eye,
  Calendar,
  Link,
  Image as ImageIcon,
} from "lucide-react";
import { BannerAd } from "@shared/types";

interface AdminBannersProps {
  token: string;
}

const bannerPositions = [
  { value: "homepage_top", label: "Homepage Top" },
  { value: "homepage_middle", label: "Homepage Middle" },
  { value: "homepage_bottom", label: "Homepage Bottom" },
  { value: "property_top", label: "Property Page Top" },
  { value: "property_sidebar", label: "Property Page Sidebar" },
];

export default function AdminBanners({ token }: AdminBannersProps) {
  const [banners, setBanners] = useState<BannerAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    link: "",
    position: "",
    priority: 5,
    startDate: "",
    endDate: "",
    active: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/banners", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setBanners(data.data.banners);
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = async (file: File) => {
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      const response = await fetch("/api/admin/banners/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();

      if (data.success) {
        handleInputChange("image", data.data.imageUrl);
        alert("Image uploaded successfully!");
      } else {
        alert("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    }
  };

  const handleCreateBanner = async () => {
    try {
      const response = await fetch("/api/admin/banners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        fetchBanners();
        resetForm();
        setShowAddForm(false);
        alert("Banner created successfully!");
      } else {
        alert(data.error || "Failed to create banner");
      }
    } catch (error) {
      console.error("Error creating banner:", error);
      alert("Failed to create banner");
    }
  };

  const handleUpdateBanner = async (bannerId: string) => {
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        fetchBanners();
        setEditingBanner(null);
        resetForm();
        alert("Banner updated successfully!");
      } else {
        alert(data.error || "Failed to update banner");
      }
    } catch (error) {
      console.error("Error updating banner:", error);
      alert("Failed to update banner");
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        fetchBanners();
        alert("Banner deleted successfully!");
      } else {
        alert(data.error || "Failed to delete banner");
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
      alert("Failed to delete banner");
    }
  };

  const handleEditBanner = (banner: BannerAd) => {
    setFormData({
      title: banner.title,
      description: banner.description,
      image: banner.image,
      link: banner.link || "",
      position: banner.position,
      priority: banner.priority,
      startDate: new Date(banner.startDate).toISOString().split("T")[0],
      endDate: new Date(banner.endDate).toISOString().split("T")[0],
      active: banner.active,
    });
    setEditingBanner(banner._id!);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image: "",
      link: "",
      position: "",
      priority: 5,
      startDate: "",
      endDate: "",
      active: true,
    });
    setEditingBanner(null);
  };

  const getBannerStatusColor = (banner: BannerAd) => {
    const now = new Date();
    const start = new Date(banner.startDate);
    const end = new Date(banner.endDate);

    if (!banner.active) return "bg-gray-100 text-gray-800";
    if (now < start) return "bg-yellow-100 text-yellow-800";
    if (now > end) return "bg-red-100 text-red-800";
    return "bg-green-100 text-green-800";
  };

  const getBannerStatus = (banner: BannerAd) => {
    const now = new Date();
    const start = new Date(banner.startDate);
    const end = new Date(banner.endDate);

    if (!banner.active) return "Inactive";
    if (now < start) return "Scheduled";
    if (now > end) return "Expired";
    return "Active";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading banners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
        <Button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="bg-[#C70000] hover:bg-[#A60000] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Banner
        </Button>
      </div>

      {/* Add/Edit Banner Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold mb-4">
            {editingBanner ? "Edit Banner" : "Add New Banner"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Banner title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Position *
              </label>
              <Select
                value={formData.position}
                onValueChange={(value) => handleInputChange("position", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {bannerPositions.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Banner description"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Image URL *
              </label>
              <div className="flex space-x-2">
                <Input
                  value={formData.image}
                  onChange={(e) => handleInputChange("image", e.target.value)}
                  placeholder="Image URL or upload image"
                  required
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 flex items-center"
                >
                  <Upload className="h-4 w-4" />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Link URL</label>
              <Input
                value={formData.link}
                onChange={(e) => handleInputChange("link", e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Priority (1-10)
              </label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) =>
                  handleInputChange("priority", parseInt(e.target.value))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date *
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                End Date *
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleInputChange("active", e.target.checked)}
                className="rounded border-gray-300 text-[#C70000] focus:ring-[#C70000]"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Active
              </label>
            </div>
          </div>

          {/* Preview */}
          {formData.image && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Preview</label>
              <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={formData.image}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-2 mt-6">
            <Button
              onClick={() =>
                editingBanner
                  ? handleUpdateBanner(editingBanner)
                  : handleCreateBanner()
              }
              className="bg-[#C70000] hover:bg-[#A60000] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingBanner ? "Update Banner" : "Create Banner"}
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Banners List */}
      <div className="space-y-4">
        {banners.map((banner) => (
          <div
            key={banner._id}
            className="bg-white rounded-lg shadow border p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex space-x-4">
                <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {banner.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {banner.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Position: {banner.position}</span>
                    <span>Priority: {banner.priority}</span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(banner.startDate).toLocaleDateString()} -{" "}
                      {new Date(banner.endDate).toLocaleDateString()}
                    </span>
                    {banner.link && (
                      <span className="flex items-center">
                        <Link className="h-3 w-3 mr-1" />
                        Has Link
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getBannerStatusColor(banner)}`}
                >
                  {getBannerStatus(banner)}
                </span>
                <Button
                  onClick={() => handleEditBanner(banner)}
                  variant="outline"
                  size="sm"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDeleteBanner(banner._id!)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Banners Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first banner to start advertising on the homepage
            </p>
            <Button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-[#C70000] hover:bg-[#A60000] text-white"
            >
              Create Banner
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
