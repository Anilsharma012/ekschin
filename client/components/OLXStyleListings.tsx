import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Clock, MessageCircle } from "lucide-react";
import PropertyLoadingSkeleton from "./PropertyLoadingSkeleton";

interface Property {
  _id: string;
  title: string;
  price: number;
  location: {
    city: string;
    state: string;
    address: string;
  };
  images: string[];
  propertyType: string;
  createdAt: string;
  contactInfo: {
    name: string;
  };
}

export default function OLXStyleListings() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetchProperties();
    loadFavorites();
  }, []);

  const fetchProperties = async () => {
    try {
      const { enhancedApi } = await import('../lib/api-enhanced');
      const response = await enhancedApi.get("properties?limit=20");
      const data = response.data;

      if (data.success && data.data.properties && data.data.properties.length > 0) {
        setProperties(data.data.properties);
      } else {
        // Mock data with real property images
        const mockProperties: Property[] = [
          {
            _id: "1",
            title: "3 BHK Flat for Sale in Rohtak",
            price: 4500000,
            location: { city: "Rohtak", state: "Haryana", address: "Model Town" },
            images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400"],
            propertyType: "apartment",
            premium: true,
            createdAt: new Date().toISOString(),
            contactInfo: { name: "Rajesh Kumar" }
          },
          {
            _id: "2",
            title: "2 BHK Independent House",
            price: 3200000,
            location: { city: "Rohtak", state: "Haryana", address: "Sector 14" },
            images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400"],
            propertyType: "house",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            contactInfo: { name: "Priya Sharma" }
          },
          {
            _id: "3",
            title: "Commercial Shop for Rent",
            price: 25000,
            location: { city: "Rohtak", state: "Haryana", address: "Railway Road" },
            images: ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"],
            propertyType: "commercial",
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            contactInfo: { name: "Amit Singh" }
          },
          {
            _id: "4",
            title: "1 BHK Apartment Near College",
            price: 1800000,
            location: { city: "Rohtak", state: "Haryana", address: "Near MDU" },
            images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"],
            propertyType: "apartment",
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            contactInfo: { name: "Sunita Devi" }
          },
          {
            _id: "5",
            title: "4 BHK Villa with Garden",
            price: 8500000,
            location: { city: "Rohtak", state: "Haryana", address: "Civil Lines" },
            images: ["https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=400"],
            propertyType: "villa",
            premium: true,
            createdAt: new Date(Date.now() - 345600000).toISOString(),
            contactInfo: { name: "Vikash Yadav" }
          },
          {
            _id: "6",
            title: "Plot for Sale 200 Sq Yard",
            price: 2800000,
            location: { city: "Rohtak", state: "Haryana", address: "Bohar Road" },
            images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400"],
            propertyType: "plot",
            createdAt: new Date(Date.now() - 432000000).toISOString(),
            contactInfo: { name: "Mohan Lal" }
          },
          {
            _id: "7",
            title: "3 BHK Builder Floor",
            price: 5200000,
            location: { city: "Rohtak", state: "Haryana", address: "Subhash Nagar" },
            images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400"],
            propertyType: "house",
            createdAt: new Date(Date.now() - 518400000).toISOString(),
            contactInfo: { name: "Deepak Kumar" }
          },
          {
            _id: "8",
            title: "Office Space for Rent",
            price: 35000,
            location: { city: "Rohtak", state: "Haryana", address: "Delhi Road" },
            images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=400"],
            propertyType: "commercial",
            createdAt: new Date(Date.now() - 604800000).toISOString(),
            contactInfo: { name: "Ravi Gupta" }
          },
          {
            _id: "9",
            title: "2 BHK Flat in Gated Society",
            price: 3800000,
            location: { city: "Rohtak", state: "Haryana", address: "Sector 3" },
            images: ["https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=400"],
            propertyType: "apartment",
            createdAt: new Date(Date.now() - 691200000).toISOString(),
            contactInfo: { name: "Neha Sharma" }
          },
          {
            _id: "10",
            title: "5 BHK Luxury Villa",
            price: 12000000,
            location: { city: "Rohtak", state: "Haryana", address: "Mansarovar Park" },
            images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400"],
            propertyType: "villa",
            premium: true,
            createdAt: new Date(Date.now() - 777600000).toISOString(),
            contactInfo: { name: "Sanjay Jindal" }
          },
          {
            _id: "11",
            title: "1 BHK Studio Apartment",
            price: 1500000,
            location: { city: "Rohtak", state: "Haryana", address: "Krishan Nagar" },
            images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400"],
            propertyType: "apartment",
            createdAt: new Date(Date.now() - 864000000).toISOString(),
            contactInfo: { name: "Pooja Singh" }
          },
          {
            _id: "12",
            title: "Commercial Building for Sale",
            price: 25000000,
            location: { city: "Rohtak", state: "Haryana", address: "Main Market" },
            images: ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400"],
            propertyType: "commercial",
            createdAt: new Date(Date.now() - 950400000).toISOString(),
            contactInfo: { name: "Ramesh Bansal" }
          },
          {
            _id: "13",
            title: "3 BHK Penthouse with Terrace",
            price: 7500000,
            location: { city: "Rohtak", state: "Haryana", address: "Sector 1" },
            images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400"],
            propertyType: "apartment",
            createdAt: new Date(Date.now() - 1036800000).toISOString(),
            contactInfo: { name: "Kavita Devi" }
          },
          {
            _id: "14",
            title: "Independent House with Parking",
            price: 4200000,
            location: { city: "Rohtak", state: "Haryana", address: "Old City" },
            images: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400"],
            propertyType: "house",
            createdAt: new Date(Date.now() - 1123200000).toISOString(),
            contactInfo: { name: "Ashok Kumar" }
          },
          {
            _id: "15",
            title: "Warehouse for Rent",
            price: 45000,
            location: { city: "Rohtak", state: "Haryana", address: "Industrial Area" },
            images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"],
            propertyType: "commercial",
            createdAt: new Date(Date.now() - 1209600000).toISOString(),
            contactInfo: { name: "Suresh Chand" }
          }
        ];
        setProperties(mockProperties);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      // Use mock data as fallback
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  };

  const toggleFavorite = (propertyId: string) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter(id => id !== propertyId)
      : [...favorites, propertyId];
    
    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹ ${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹ ${(price / 100000).toFixed(1)} L`;
    } else if (price >= 1000) {
      return `₹ ${(price / 1000).toFixed(0)}K`;
    }
    return `₹ ${price.toLocaleString()}`;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handlePropertyClick = (property: Property) => {
    navigate(`/properties/${property._id}`);
  };

  if (loading) {
    return <PropertyLoadingSkeleton />;
  }

  return (
    <div className="bg-white">
      <div className="px-4 py-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Fresh recommendations</h2>
        
        <div className="grid grid-cols-2 gap-3">
          {properties.map((property) => (
            <div
              key={property._id}
              onClick={() => handlePropertyClick(property)}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-98"
            >
              {/* Image */}
              <div className="relative aspect-square">
                <img
                  src={property.images[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400"}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400";
                  }}
                />
                
                {/* Premium Badge */}
                {property.premium && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg">
                    AP Premium
                  </div>
                )}

                {/* Favorite button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(property._id);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      favorites.includes(property._id)
                        ? "fill-red-500 text-red-500"
                        : "text-gray-600"
                    }`}
                  />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-3">
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {formatPrice(property.price)}
                </div>
                
                <h3 className="text-sm text-gray-700 mb-2 line-clamp-2 leading-tight">
                  {property.title}
                </h3>
                
                <div className="flex items-center text-xs text-gray-500 mb-1">
                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {property.location.city}, {property.location.state}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{getTimeAgo(property.createdAt)}</span>
                  </div>
                  <span className="capitalize text-xs px-2 py-1 bg-gray-100 rounded">
                    {property.propertyType}
                  </span>
                </div>

                {/* Chat Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Handle chat functionality
                    const token = localStorage.getItem('token');
                    if (token) {
                      window.location.href = `/chat?propertyId=${property._id}&sellerId=${property.ownerId || property.contactInfo?.name}`;
                    } else {
                      window.location.href = `/login?redirect=/property/${property._id}`;
                    }
                  }}
                  className="w-full bg-[#C70000] hover:bg-[#A60000] text-white text-xs py-2 px-3 rounded-md flex items-center justify-center space-x-1 transition-colors"
                >
                  <MessageCircle className="h-3 w-3" />
                  <span>Chat</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {properties.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">����</div>
            <p>No properties available</p>
          </div>
        )}
        
        {/* Load More Button */}
        {properties.length > 0 && (
          <div className="mt-6 text-center">
            <button className="text-[#C70000] font-semibold text-sm hover:underline">
              View all properties
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
