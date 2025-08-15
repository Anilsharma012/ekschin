import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Search, Filter } from "lucide-react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import CategoryBar from "../components/CategoryBar";
import BottomNavigation from "../components/BottomNavigation";
import StaticFooter from "../components/StaticFooter";

interface Category {
  _id?: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: Subcategory[];
  order: number;
  active: boolean;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  count?: number;
}

interface Property {
  _id: string;
  title: string;
  price: number;
  priceType: "sale" | "rent";
  propertyType: string;
  subCategory: string;
  location: {
    address: string;
    sector?: string;
    mohalla?: string;
  };
  specifications?: {
    bedrooms?: number;
    bathrooms?: number;
    area?: number;
  };
  images: string[];
  contactInfo: {
    name: string;
    phone: string;
  };
  featured: boolean;
  premium: boolean;
}

export default function Buy() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subcategoryCounts, setSubcategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCategories();
    fetchPropertyCounts();
  }, []);

  useEffect(() => {
    if (selectedCategory && selectedSubcategory) {
      fetchPropertiesByCategory();
    }
  }, [selectedCategory, selectedSubcategory]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories");
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPropertyCounts = async () => {
    try {
      const response = await fetch("/api/properties?priceType=sale");
      const data = await response.json();

      if (data.success) {
        const counts: Record<string, number> = {};
        data.data.properties?.forEach((property: any) => {
          if (property.subCategory) {
            counts[property.subCategory] = (counts[property.subCategory] || 0) + 1;
          }
        });
        setSubcategoryCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching property counts:", error);
    }
  };

  const fetchPropertiesByCategory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("priceType", "sale");

      if (selectedCategory) {
        params.append("propertyType", selectedCategory.slug);
      }
      if (selectedSubcategory) {
        params.append("subCategory", selectedSubcategory.slug);
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/properties?${params}`);
      const data = await response.json();

      if (data.success) {
        setProperties(data.data.properties || []);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setProperties([]);
  };

  const handleSubcategoryClick = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);
  };

  const handleBackClick = () => {
    if (selectedSubcategory) {
      setSelectedSubcategory(null);
      setProperties([]);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/properties/${propertyId}`);
  };

  const handleSearch = () => {
    if (selectedCategory && selectedSubcategory) {
      fetchPropertiesByCategory();
    }
  };

  const handleViewAllProperties = () => {
    navigate(`/categories/${selectedCategory?.slug}/${selectedSubcategory?.slug}`);
  };

  if (loading && !selectedCategory) {
    return (
      <div className="min-h-screen bg-white">
        <OLXStyleHeader />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#C70000] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // Properties View
  if (selectedCategory && selectedSubcategory && properties.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <OLXStyleHeader />

        <div className="px-4 py-6">
          {/* Header with Back Button */}
          <div className="flex items-center mb-6">
            <button onClick={handleBackClick} className="mr-4 p-2">
              <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                {selectedSubcategory.name} for Sale
              </h1>
              <p className="text-sm text-gray-600">
                {properties.length} properties found
              </p>
            </div>
            <Button
              onClick={handleViewAllProperties}
              variant="outline"
              size="sm"
              className="border-[#C70000] text-[#C70000]"
            >
              <Filter className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-[#C70000] hover:bg-[#A60000] text-white"
            >
              Search
            </Button>
          </div>

          {/* Properties List */}
          <div className="space-y-4">
            {properties.slice(0, 10).map((property) => (
              <div
                key={property._id}
                onClick={() => handlePropertyClick(property._id)}
                className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex">
                  <div className="w-32 h-32 flex-shrink-0 relative">
                    <img
                      src={property.images?.[0] || "https://via.placeholder.com/300x300?text=No+Image"}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    {property.featured && (
                      <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                        Featured
                      </div>
                    )}
                    {property.premium && (
                      <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
                        Premium
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 leading-tight">
                        {property.title}
                      </h3>
                      <span className="text-lg font-bold text-[#C70000] ml-2">
                        ₹{property.price?.toLocaleString() || "0"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {property.location?.address || "Location not available"}
                    </p>

                    <div className="flex items-center text-gray-500 mb-3 text-sm">
                      {property.specifications?.bedrooms && (
                        <span className="mr-4">{property.specifications.bedrooms} BHK</span>
                      )}
                      {property.specifications?.bathrooms && (
                        <span className="mr-4">{property.specifications.bathrooms} Bath</span>
                      )}
                      <span>{property.specifications?.area || 0} sq ft</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {property.contactInfo?.name || "Owner"}
                      </span>
                      <Button
                        size="sm"
                        className="bg-[#C70000] hover:bg-[#A60000] text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`tel:${property.contactInfo?.phone}`, '_self');
                        }}
                      >
                        Call Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {properties.length > 10 && (
            <div className="text-center mt-6">
              <Button
                onClick={handleViewAllProperties}
                variant="outline"
                className="border-[#C70000] text-[#C70000]"
              >
                View All {properties.length} Properties
              </Button>
            </div>
          )}
        </div>

        <BottomNavigation />
      </div>
    );
  }

  // Subcategories View
  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-white">
        <OLXStyleHeader />

        <div className="px-4 py-6">
          {/* Header with Back Button */}
          <div className="flex items-center mb-6">
            <button onClick={handleBackClick} className="mr-4 p-2">
              <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {selectedCategory.name} for Sale
              </h1>
              <p className="text-sm text-gray-600">Choose property type</p>
            </div>
          </div>

          {/* Subcategories List */}
          <div className="space-y-2">
            {selectedCategory.subcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                onClick={() => handleSubcategoryClick(subcategory)}
                className="w-full bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{selectedCategory.icon}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900 text-base">
                      {subcategory.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {subcategory.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {subcategoryCounts[subcategory.slug] && (
                    <span className="text-xs bg-[#C70000] text-white px-2 py-1 rounded-full">
                      {subcategoryCounts[subcategory.slug]}
                    </span>
                  )}
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  // Main Categories View
  return (
    <div className="min-h-screen bg-white">
      <OLXStyleHeader />

      <main className="pb-16">
        <CategoryBar />

        <div className="px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Buy Properties
            </h1>
            <p className="text-gray-600">
              Choose a category to find properties for sale
            </p>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category._id || category.slug}
                onClick={() => handleCategoryClick(category)}
                className="w-full bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{category.icon}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {category.subcategories.length} types
                  </span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <BottomNavigation />
      <StaticFooter />
    </div>
  );
}
