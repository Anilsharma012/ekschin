import React from "react";
import { fallbackProperties, fallbackCategories, fallbackPackages, isProductionEnvironment } from "../utils/fallbackData";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  MapPin, 
  Phone, 
  IndianRupee, 
  Bed, 
  Bath, 
  Car,
  Crown,
  Building,
  Home,
  Star
} from "lucide-react";

const ProductionReadyIndex = () => {
  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)} L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  };

  const getPropertyIcon = (type: string) => {
    switch (type) {
      case 'apartment': return <Building className="h-4 w-4" />;
      case 'house': return <Home className="h-4 w-4" />;
      case 'villa': return <Crown className="h-4 w-4" />;
      default: return <Building className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Aashish Property</h1>
              <p className="text-red-100 mt-1">Your Trusted Real Estate Partner in Rohtak</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="outline" className="text-white border-white hover:bg-white hover:text-red-600">
                Post Property
              </Button>
              <Button variant="secondary">
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-red-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Find Your Dream Property in Rohtak
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Browse through verified properties from trusted sellers
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4 flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Search by location, property type..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <Button className="bg-red-600 hover:bg-red-700 px-8">
              Search Properties
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-8">Property Categories</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {fallbackCategories.slice(0, 10).map((category) => (
              <Card key={category._id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h4 className="font-medium text-sm">{category.name}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold">Featured Properties</h3>
            <Button variant="outline">View All</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fallbackProperties.map((property) => (
              <Card key={property._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img 
                    src={property.images[0]} 
                    alt={property.title}
                    className="w-full h-48 object-cover"
                  />
                  {property.premium && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-lg">{formatPrice(property.price)}</h4>
                    <div className="flex items-center text-orange-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm ml-1">4.5</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 font-medium mb-2">{property.title}</p>
                  
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.location.address}, {property.location.city}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      {getPropertyIcon(property.propertyType)}
                      <span className="ml-1 capitalize">{property.propertyType}</span>
                    </div>
                    {property.area && (
                      <span>{property.area} sq ft</span>
                    )}
                  </div>
                  
                  {property.bedrooms && (
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1" />
                        {property.bedrooms} Bed
                      </div>
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1" />
                        {property.bathrooms} Bath
                      </div>
                      {property.parking && (
                        <div className="flex items-center">
                          <Car className="h-4 w-4 mr-1" />
                          Parking
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-red-600 hover:bg-red-700">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                    <Button variant="outline" className="flex-1">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Choose Your Plan</h3>
            <p className="text-gray-600">Select the perfect package for your property listing needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fallbackPackages.map((pkg, index) => (
              <Card key={pkg._id} className={`relative ${index === 1 ? 'border-red-500 ring-2 ring-red-200' : ''}`}>
                {index === 1 && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-red-500 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold text-red-600">₹{pkg.price}</div>
                  <p className="text-gray-500">{pkg.description}</p>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm">
                        <Star className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${index === 1 ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    variant={index === 1 ? 'default' : 'outline'}
                  >
                    Choose Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-4">Aashish Property</h4>
              <p className="text-gray-400 text-sm">
                Your trusted partner for buying and selling properties in Rohtak.
              </p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-3">Quick Links</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Buy Property</a></li>
                <li><a href="#" className="hover:text-white">Sell Property</a></li>
                <li><a href="#" className="hover:text-white">Rent Property</a></li>
                <li><a href="#" className="hover:text-white">About Us</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-3">Property Types</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Apartments</a></li>
                <li><a href="#" className="hover:text-white">Houses</a></li>
                <li><a href="#" className="hover:text-white">Villas</a></li>
                <li><a href="#" className="hover:text-white">Commercial</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-3">Contact</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📍 Rohtak, Haryana</li>
                <li>📞 +91 98765 43210</li>
                <li>✉️ info@aashishproperty.com</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Aashish Property. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductionReadyIndex;
