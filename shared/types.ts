export interface Property {
  _id?: string;
  title: string;
  description: string;
  price: number;
  priceType: "sale" | "rent"; // per month for rent
  propertyType: string; // "residential", "commercial", "plot", etc.
  subCategory: string; // "1bhk", "2bhk", "shop", etc.
  location: {
    sector?: string;
    mohalla?: string;
    landmark?: string;
    area?: string; // Rohtak specific areas
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  specifications: {
    bedrooms?: number;
    bathrooms?: number;
    area: number; // in sq ft
    facing?: string;
    floor?: number;
    totalFloors?: number;
    parking?: boolean;
    furnished?: "furnished" | "semi-furnished" | "unfurnished";
  };
  images: string[];
  amenities: string[];
  ownerId: string;
  ownerType: "seller" | "agent";
  contactInfo: {
    name: string;
    phone: string;
    alternativePhone?: string;
    whatsappNumber?: string;
    email?: string;
  };
  status: "active" | "sold" | "rented" | "inactive";
  approvalStatus: "pending" | "approved" | "rejected";
  adminComments?: string;
  rejectionReason?: string;
  approvedAt?: Date;
  approvedBy?: string; // admin user ID
  featured: boolean;
  premium: boolean; // Is this a premium listing
  premiumApprovalStatus?: "pending" | "approved" | "rejected"; // Premium listing approval
  premiumApprovedAt?: Date;
  premiumApprovedBy?: string; // admin user ID
  contactVisible: boolean; // Whether contact info should be visible publicly
  packageId?: string; // Advertisement package
  packageExpiry?: Date;
  views: number;
  inquiries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  password: string; // hashed
  userType: "buyer" | "seller" | "agent" | "admin";
  profileImage?: string;
  preferences?: {
    propertyTypes: string[];
    priceRange: {
      min: number;
      max: number;
    };
    locations: string[];
  };
  favorites: string[]; // property IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent extends User {
  agentProfile: {
    licenseNumber?: string;
    experience: number; // years
    specializations: string[];
    rating: number;
    reviewCount: number;
    aboutMe: string;
    serviceAreas: string[];
  };
  properties: string[]; // property IDs listed by agent
}

export interface Category {
  _id?: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  subcategories: Subcategory[];
  order: number;
  active: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  filters?: {
    bedroomOptions?: number[];
    priceRanges?: Array<{
      label: string;
      min: number;
      max: number;
    }>;
  };
}

export interface SearchFilters {
  propertyType?: string;
  subCategory?: string;
  priceType?: "sale" | "rent";
  location?: {
    sector?: string;
    mohalla?: string;
    landmark?: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  bedrooms?: number;
  bathrooms?: number;
  areaRange?: {
    min: number;
    max: number;
  };
  amenities?: string[];
  sortBy?: "price_asc" | "price_desc" | "date_desc" | "date_asc" | "area_desc";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Advertisement Package Types
export interface AdPackage {
  _id?: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in days
  features: string[];
  type: "basic" | "featured" | "premium";
  category: "property" | "general";
  location: "rohtak" | "all";
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Transaction Types
export interface Transaction {
  _id?: string;
  userId: string;
  propertyId?: string;
  packageId: string;
  amount: number;
  paymentMethod: "upi" | "bank_transfer" | "online";
  paymentDetails?: {
    upiId?: string;
    bankAccount?: string;
    transactionId?: string;
    gatewayResponse?: any;
  };
  status: "pending" | "paid" | "failed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

// Banner Ad Types
export interface BannerAd {
  _id?: string;
  title: string;
  description: string;
  image: string;
  link?: string;
  position:
    | "homepage_top"
    | "homepage_middle"
    | "homepage_bottom"
    | "property_top"
    | "property_sidebar";
  active: boolean;
  priority: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export interface PropertyAnalytics {
  propertyId: string;
  views: number;
  inquiries: number;
  favorites: number;
  phoneClicks: number;
  lastViewed: Date;
}

// Rohtak Areas
export const ROHTAK_AREAS = [
  "Model Town",
  "Sector 1",
  "Sector 2",
  "Sector 3",
  "Sector 4",
  "Sector 5",
  "Sector 6",
  "Sector 7",
  "Sector 8",
  "Sector 9",
  "Sector 10",
  "Sector 11",
  "Sector 12",
  "Sector 13",
  "Sector 14",
  "Sector 15",
  "Sector 16",
  "Sector 17",
  "Sector 18",
  "Sector 19",
  "Sector 20",
  "Delhi Road",
  "Sonipat Road",
  "Jind Road",
  "Bhiwani Road",
  "Hisar Road",
  "Jhajjar Road",
  "Panipat Road",
  "Civil Lines",
  "Old City",
  "Railway Road",
  "Jail Road",
  "Bohar Road",
  "Subhash Nagar",
  "Shastri Nagar",
  "Prem Nagar",
  "DLF Colony",
  "Ram Nagar",
  "Krishan Nagar",
  "Vikas Nagar",
  "Ashok Nagar",
  "Nehru Nagar",
  "Gandhi Nagar",
  "Indira Colony",
  "Arya Nagar",
  "Saraswati Nagar",
  "Hanuman Nagar",
  "Gayatri Nagar",
  "Laxmi Nagar",
  "Durga Colony",
  "Shiv Colony",
  "Rama Park",
  "Bal Bhawan Road",
  "Near Bus Stand",
  "Near Railway Station",
  "Gali Baldev Singh",
  "Gali Toshan Singh",
  "Main Market",
  "Sunheri Gate",
  "Kachha Bazar",
  "Grain Market",
  "Cloth Market",
  "Hardware Market",
  "Industrial Area",
  "HUDA Sector",
  "IMT Rohtak",
  "Mansarovar Park",
  "Pushpa Vihar",
  "Ashoka Enclave",
  "Green City",
  "Omaxe City",
  "Supertech Eco Village",
  "TDI City",
  "Ansal Royal Heritage",
  "Near PGI Rohtak",
  "Near AIIMS Rohtak",
  "Near MDU",
  "Near District Court",
  "Near Government College",
  "Near Rohtak Medical College",
  "GPS Colony",
  "Police Lines",
  "ITI Road",
  "College Road",
  "Stadium Road",
  "Hospital Road",
  "Mini Secretariat",
  "DC Office Area",
  "SP Office Area",
  "Collectorate Area",
  "Bank Colony",
  "Teacher Colony",
  "Doctor Colony",
  "Engineer Colony",
] as const;

export type RohtakArea = (typeof ROHTAK_AREAS)[number];
