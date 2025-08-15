import { useState, useEffect } from "react";
import {
  Building,
  Phone,
  Clock,
  MapPin,
  Search,
  Filter,
  Star,
  ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

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
}

interface ServiceCategory {
  _id: string;
  count: number;
}

export default function OtherServices() {
  const [services, setServices] = useState<{ [key: string]: OtherService[] }>(
    {},
  );
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [selectedCategory]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (selectedCategory !== "all")
        params.append("category", selectedCategory);

      const response = await fetch(`/api/other-services?${params}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServices(data.data);
        } else {
          setError(data.error || "Failed to fetch services");
        }
      } else {
        setError("Failed to fetch services");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setError("Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/other-services/categories");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const filteredServices = Object.entries(services).reduce(
    (acc, [category, categoryServices]) => {
      const filtered = categoryServices.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.phone.includes(searchTerm) ||
          service.address.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      if (filtered.length > 0) {
        acc[category] = filtered;
      }

      return acc;
    },
    {} as { [key: string]: OtherService[] },
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#C70000] to-[#A60000] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Other Services
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Find trusted service providers in your area
          </p>

          {/* Search Section */}
          <div className="max-w-2xl mx-auto bg-white rounded-lg p-6 shadow-lg">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category._id} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="bg-[#C70000] hover:bg-[#A60000] text-white">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Overview */}
      {categories.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Service Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {categories.map((category) => (
              <Card
                key={category._id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCategory === category._id
                    ? "ring-2 ring-[#C70000]"
                    : ""
                }`}
                onClick={() => setSelectedCategory(category._id)}
              >
                <CardContent className="p-4 text-center">
                  <Building className="h-8 w-8 mx-auto mb-2 text-[#C70000]" />
                  <h3 className="font-semibold text-sm">{category._id}</h3>
                  <p className="text-xs text-gray-500">
                    {category.count} services
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
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
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Services List */}
      <div className="container mx-auto px-4 pb-12">
        {Object.keys(filteredServices).length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Services Found
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No services available at the moment"}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(filteredServices).map(
              ([category, categoryServices]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {category}
                    </h2>
                    <Badge variant="outline" className="text-sm">
                      {categoryServices.length} service
                      {categoryServices.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryServices.map((service) => (
                      <Card
                        key={service._id}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4 mb-4">
                            {service.photoUrl ? (
                              <img
                                src={service.photoUrl}
                                alt={service.name}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-[#C70000] rounded-full flex items-center justify-center">
                                <Building className="h-8 w-8 text-white" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {service.name}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {service.category}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{service.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>
                                {service.openTime} - {service.closeTime}
                              </span>
                            </div>
                            <div className="flex items-start space-x-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mt-0.5" />
                              <span className="line-clamp-2">
                                {service.address}
                              </span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              className="flex-1 bg-[#C70000] hover:bg-[#A60000]"
                              onClick={() =>
                                window.open(`tel:${service.phone}`)
                              }
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call Now
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                window.open(`https://wa.me/${service.phone}`)
                              }
                            >
                              WhatsApp
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-gray-100 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Are you a service provider?
          </h2>
          <p className="text-gray-600 mb-6">
            Join our platform and connect with customers in your area
          </p>
          <Button className="bg-[#C70000] hover:bg-[#A60000]">
            Register Your Service
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Development Notice */}
      <div className="bg-blue-50 border-t border-blue-200 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-900 mb-2">
              Development Notice
            </h3>
            <p className="text-sm text-blue-700">
              This Other Services feature is currently in development. The
              frontend interface is ready but backend APIs need to be
              implemented to display actual service provider data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
