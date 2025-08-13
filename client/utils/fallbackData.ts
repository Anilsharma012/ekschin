// Comprehensive fallback data for when backend is unavailable

export const fallbackProperties = [
  {
    _id: "fallback-1",
    title: "3 BHK Flat for Sale in Model Town, Rohtak",
    price: 4500000,
    location: { city: "Rohtak", state: "Haryana", address: "Model Town, Sector 3" },
    images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop"],
    propertyType: "apartment",
    premium: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    contactInfo: { name: "Rajesh Kumar", phone: "+91 98765 43210" },
    description: "Spacious 3 BHK flat with modern amenities",
    area: 1200,
    bedrooms: 3,
    bathrooms: 2,
    parking: true,
    furnished: "semi-furnished"
  },
  {
    _id: "fallback-2", 
    title: "2 BHK Independent House in Civil Lines",
    price: 3200000,
    location: { city: "Rohtak", state: "Haryana", address: "Civil Lines" },
    images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop"],
    propertyType: "house",
    premium: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    contactInfo: { name: "Priya Sharma", phone: "+91 98765 43211" },
    description: "Beautiful independent house with garden",
    area: 900,
    bedrooms: 2,
    bathrooms: 2,
    parking: true,
    furnished: "unfurnished"
  },
  {
    _id: "fallback-3",
    title: "4 BHK Villa with Garden in Mansarovar Park", 
    price: 8500000,
    location: { city: "Rohtak", state: "Haryana", address: "Mansarovar Park" },
    images: ["https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=400&h=300&fit=crop"],
    propertyType: "villa",
    premium: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    contactInfo: { name: "Vikash Yadav", phone: "+91 98765 43212" },
    description: "Luxury villa with swimming pool and garden",
    area: 2500,
    bedrooms: 4,
    bathrooms: 4,
    parking: true,
    furnished: "fully-furnished"
  },
  {
    _id: "fallback-4",
    title: "Plot for Sale 200 Sq Yard in Sector 14",
    price: 2800000,
    location: { city: "Rohtak", state: "Haryana", address: "Sector 14" },
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop"],
    propertyType: "plot",
    premium: false,
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    contactInfo: { name: "Amit Singh", phone: "+91 98765 43213" },
    description: "Prime location plot ready for construction",
    area: 200,
    parking: false,
    furnished: "unfurnished"
  },
  {
    _id: "fallback-5",
    title: "3 BHK Builder Floor in Subhash Nagar",
    price: 5200000,
    location: { city: "Rohtak", state: "Haryana", address: "Subhash Nagar" },
    images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop"],
    propertyType: "house", 
    premium: false,
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    contactInfo: { name: "Deepak Kumar", phone: "+91 98765 43214" },
    description: "Ready to move builder floor with parking",
    area: 1100,
    bedrooms: 3,
    bathrooms: 2,
    parking: true,
    furnished: "semi-furnished"
  },
  {
    _id: "fallback-6",
    title: "Office Space for Rent in Main Market",
    price: 35000,
    location: { city: "Rohtak", state: "Haryana", address: "Main Market" },
    images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop"],
    propertyType: "commercial",
    premium: false,
    createdAt: new Date(Date.now() - 518400000).toISOString(),
    contactInfo: { name: "Sunita Devi", phone: "+91 98765 43215" },
    description: "Commercial office space in prime location",
    area: 500,
    parking: true,
    furnished: "unfurnished"
  }
];

export const fallbackCategories = [
  { _id: "1", name: "Apartment", slug: "apartment", icon: "🏢", color: "#3B82F6", active: true },
  { _id: "2", name: "House", slug: "house", icon: "🏠", color: "#10B981", active: true },
  { _id: "3", name: "Villa", slug: "villa", icon: "🏡", color: "#F59E0B", active: true },
  { _id: "4", name: "Plot", slug: "plot", icon: "🏞️", color: "#8B5CF6", active: true },
  { _id: "5", name: "Commercial", slug: "commercial", icon: "🏪", color: "#EF4444", active: true },
  { _id: "6", name: "PG/Hostel", slug: "pg", icon: "🏨", color: "#06B6D4", active: true },
  { _id: "7", name: "Rental", slug: "rental", icon: "🔑", color: "#F97316", active: true },
  { _id: "8", name: "Farmhouse", slug: "farmhouse", icon: "🌾", color: "#84CC16", active: true },
  { _id: "9", name: "Warehouse", slug: "warehouse", icon: "🏭", color: "#6B7280", active: true },
  { _id: "10", name: "Office", slug: "office", icon: "🏢", color: "#1F2937", active: true }
];

export const fallbackBanners = [
  {
    _id: "banner-1",
    title: "Welcome to Aashish Properties",
    description: "Find your dream home in Rohtak",
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop",
    link: "/properties",
    position: "homepage_middle",
    active: true
  }
];

export const fallbackPackages = [
  {
    _id: "pkg-1",
    name: "Basic Plan",
    description: "Perfect for individual sellers",
    price: 299,
    type: "basic",
    category: "property",
    duration: 30,
    features: [
      "Post up to 5 properties",
      "Basic listing visibility",
      "Email support",
      "30 days validity"
    ],
    active: true
  },
  {
    _id: "pkg-2", 
    name: "Standard Plan",
    description: "Great for regular sellers",
    price: 599,
    type: "standard", 
    category: "property",
    duration: 30,
    features: [
      "Post up to 15 properties",
      "Enhanced visibility",
      "Priority support",
      "Featured listings",
      "30 days validity"
    ],
    active: true
  },
  {
    _id: "pkg-3",
    name: "Premium Plan", 
    description: "Best for professional agents",
    price: 999,
    type: "premium",
    category: "property", 
    duration: 30,
    features: [
      "Unlimited property posts",
      "Top visibility",
      "24/7 priority support", 
      "Premium badge",
      "Analytics dashboard",
      "30 days validity"
    ],
    active: true
  }
];

export const fallbackSliderImages = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=600&fit=crop",
    title: "Find Your Dream Home in Rohtak",
    description: "Discover the best properties with Aashish Properties"
  },
  {
    id: 2, 
    url: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&h=600&fit=crop",
    title: "Premium Properties Available", 
    description: "Luxury homes and apartments in prime locations"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=600&fit=crop", 
    title: "Trusted Real Estate Partner",
    description: "Your reliable partner in buying and selling properties"
  }
];

export const isProductionEnvironment = () => {
  return window.location.hostname.includes('.fly.dev') || 
         window.location.hostname.includes('netlify.app') ||
         window.location.hostname !== 'localhost';
};

export const shouldUseFallbackData = () => {
  return isProductionEnvironment();
};
