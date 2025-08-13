import { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import {
  Search,
  MapPin,
  Star,
  Building,
  Home,
  Store,
  Landmark,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { RohtakLocation, LOCATION_TYPES } from "@shared/location-types";

interface LocationSelectorProps {
  value?: {
    sector?: string;
    mohalla?: string;
    landmark?: string;
    area?: string;
    address: string;
  };
  onChange: (location: {
    sector?: string;
    mohalla?: string;
    landmark?: string;
    area?: string;
    address: string;
  }) => void;
  required?: boolean;
}

interface LocationsByType {
  [key: string]: RohtakLocation[];
}

export default function LocationSelector({ value, onChange, required = false }: LocationSelectorProps) {
  const [locationsByType, setLocationsByType] = useState<LocationsByType>({});
  const [popularLocations, setPopularLocations] = useState<RohtakLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RohtakLocation[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showPopular, setShowPopular] = useState(true);
  const [selectedLocations, setSelectedLocations] = useState<{[key: string]: RohtakLocation}>({});
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch locations grouped by type
  const fetchLocationsByType = async () => {
    try {
      const response = await fetch("/api/locations/by-type");
      const data = await response.json();
      
      if (data.success) {
        const grouped: LocationsByType = {};
        data.data.forEach((group: any) => {
          grouped[group.type] = group.locations;
        });
        setLocationsByType(grouped);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
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

  // Handle search input
  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (query.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocations(query);
      }, 300);
    } else {
      setSearchResults([]);
    }
  };

  // Select location
  const selectLocation = (location: RohtakLocation, type?: string) => {
    const locationType = type || location.type;
    
    // Update selected locations
    const newSelected = { ...selectedLocations };
    newSelected[locationType] = location;
    setSelectedLocations(newSelected);
    
    // Update form value
    const newValue = { ...value, address: value?.address || "" };
    newValue[locationType as keyof typeof newValue] = location.name;
    onChange(newValue);
    
    // Clear search
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  // Remove selected location
  const removeLocation = (type: string) => {
    const newSelected = { ...selectedLocations };
    delete newSelected[type];
    setSelectedLocations(newSelected);
    
    const newValue = { ...value, address: value?.address || "" };
    delete newValue[type as keyof typeof newValue];
    onChange(newValue);
  };

  // Get icon for location type
  const getLocationIcon = (type: string) => {
    const icons = {
      sector: Building,
      mohalla: Home,
      landmark: Landmark,
      area: MapPin,
      colony: Home,
      road: MapPin,
      market: Store,
      society: Building
    };
    
    const IconComponent = icons[type as keyof typeof icons] || MapPin;
    return <IconComponent className="h-4 w-4" />;
  };

  useEffect(() => {
    fetchLocationsByType();
    fetchPopularLocations();
  }, []);

  // Initialize selected locations from value
  useEffect(() => {
    if (value) {
      const newSelected: {[key: string]: RohtakLocation} = {};
      
      Object.entries(value).forEach(([key, locationName]) => {
        if (key !== 'address' && locationName) {
          // Find the location in our data
          Object.entries(locationsByType).forEach(([type, locations]) => {
            const found = locations.find(loc => loc.name === locationName);
            if (found && key === type) {
              newSelected[key] = found;
            }
          });
        }
      });
      
      setSelectedLocations(newSelected);
    }
  }, [value, locationsByType]);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">
          Location Selection {required && <span className="text-red-500">*</span>}
        </Label>
        <p className="text-xs text-gray-500 mb-3">
          Select relevant location details for your property
        </p>
      </div>

      {/* Selected Locations */}
      {Object.keys(selectedLocations).length > 0 && (
        <Card>
          <CardContent className="p-3">
            <h4 className="text-sm font-medium mb-2">Selected Locations:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedLocations).map(([type, location]) => (
                <Badge key={type} variant="secondary" className="flex items-center space-x-1">
                  {getLocationIcon(type)}
                  <span className="text-xs">
                    {LOCATION_TYPES.find(t => t.value === type)?.label || type}: {location.name}
                  </span>
                  <button
                    onClick={() => removeLocation(type)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Section */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Quick Search</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="h-4 w-4 mr-1" />
              Search
              {showSearch ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
          </div>
          
          {showSearch && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {searchResults.map((location) => (
                    <button
                      key={location._id}
                      onClick={() => selectLocation(location)}
                      className="w-full text-left p-2 hover:bg-gray-50 border-b last:border-b-0 flex items-center space-x-2"
                    >
                      {getLocationIcon(location.type)}
                      <div>
                        <span className="font-medium">{location.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({LOCATION_TYPES.find(t => t.value === location.type)?.label})
                        </span>
                        {location.isPopular && (
                          <Star className="h-3 w-3 text-yellow-500 inline ml-1" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Locations */}
      {popularLocations.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                Popular Locations
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPopular(!showPopular)}
              >
                {showPopular ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            
            {showPopular && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {popularLocations.slice(0, 12).map((location) => (
                  <button
                    key={location._id}
                    onClick={() => selectLocation(location)}
                    className="text-left p-2 border rounded hover:bg-gray-50 text-xs"
                  >
                    <div className="flex items-center space-x-1">
                      {getLocationIcon(location.type)}
                      <span className="font-medium truncate">{location.name}</span>
                    </div>
                    <div className="text-gray-500">
                      {LOCATION_TYPES.find(t => t.value === location.type)?.label}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LOCATION_TYPES.map((locationType) => {
          const locations = locationsByType[locationType.value] || [];
          
          if (locations.length === 0) return null;
          
          return (
            <Card key={locationType.value}>
              <CardContent className="p-3">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <span className="mr-1">{locationType.icon}</span>
                  {locationType.label}s
                </h4>
                
                <Select onValueChange={(value) => {
                  const location = locations.find(loc => loc._id === value);
                  if (location) selectLocation(location, locationType.value);
                }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={`Select ${locationType.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location._id} value={location._id!}>
                        <div className="flex items-center space-x-2">
                          <span>{location.name}</span>
                          {location.isPopular && (
                            <Star className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Address Input */}
      <div>
        <Label htmlFor="address" className="text-sm font-medium">
          Complete Address {required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id="address"
          placeholder="Enter complete address (House/Plot No., Street, etc.)"
          value={value?.address || ""}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Provide the complete address including house/plot number, street name, etc.
        </p>
      </div>
    </div>
  );
}
