export interface RohtakLocation {
  _id?: string;
  name: string;
  type: "sector" | "mohalla" | "landmark" | "area" | "colony" | "road" | "market" | "society";
  parentId?: string; // For hierarchical locations
  coordinates?: {
    lat: number;
    lng: number;
  };
  description?: string;
  pincode?: string;
  isActive: boolean;
  isPopular: boolean; // For featured locations
  order: number; // For sorting
  aliases?: string[]; // Alternative names
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Admin user ID
}

export interface LocationHierarchy {
  _id?: string;
  name: string;
  type: "district" | "city" | "zone" | "sector" | "area";
  parentId?: string;
  children: LocationHierarchy[];
  locations: RohtakLocation[];
  isActive: boolean;
  order: number;
}

export interface LocationSearchFilters {
  type?: string;
  search?: string;
  isActive?: boolean;
  isPopular?: boolean;
  parentId?: string;
  page?: number;
  limit?: number;
}

export interface LocationCategory {
  _id?: string;
  name: string;
  type: "sector" | "mohalla" | "landmark" | "area" | "colony" | "road" | "market" | "society";
  icon: string;
  color: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Comprehensive Rohtak Location Data
export const ROHTAK_LOCATION_DATA = {
  sectors: [
    { name: "Sector 1", pincode: "124001", isPopular: true },
    { name: "Sector 2", pincode: "124001", isPopular: true },
    { name: "Sector 3", pincode: "124001", isPopular: true },
    { name: "Sector 4", pincode: "124001", isPopular: true },
    { name: "Sector 5", pincode: "124001", isPopular: true },
    { name: "Sector 6", pincode: "124001", isPopular: false },
    { name: "Sector 7", pincode: "124001", isPopular: false },
    { name: "Sector 8", pincode: "124001", isPopular: false },
    { name: "Sector 9", pincode: "124001", isPopular: false },
    { name: "Sector 10", pincode: "124001", isPopular: false },
    { name: "Sector 11", pincode: "124001", isPopular: false },
    { name: "Sector 12", pincode: "124001", isPopular: true },
    { name: "Sector 13", pincode: "124001", isPopular: true },
    { name: "Sector 14", pincode: "124001", isPopular: true },
    { name: "Sector 15", pincode: "124001", isPopular: false },
    { name: "Sector 16", pincode: "124001", isPopular: false },
    { name: "Sector 17", pincode: "124001", isPopular: false },
    { name: "Sector 18", pincode: "124001", isPopular: false },
    { name: "Sector 19", pincode: "124001", isPopular: false },
    { name: "Sector 20", pincode: "124001", isPopular: false },
  ],
  mohallas: [
    { name: "Model Town", pincode: "124001", isPopular: true },
    { name: "Civil Lines", pincode: "124001", isPopular: true },
    { name: "Old City", pincode: "124001", isPopular: true },
    { name: "Subhash Nagar", pincode: "124001", isPopular: true },
    { name: "Shastri Nagar", pincode: "124001", isPopular: true },
    { name: "Prem Nagar", pincode: "124001", isPopular: false },
    { name: "Ram Nagar", pincode: "124001", isPopular: false },
    { name: "Krishan Nagar", pincode: "124001", isPopular: false },
    { name: "Vikas Nagar", pincode: "124001", isPopular: false },
    { name: "Ashok Nagar", pincode: "124001", isPopular: false },
    { name: "Nehru Nagar", pincode: "124001", isPopular: false },
    { name: "Gandhi Nagar", pincode: "124001", isPopular: true },
    { name: "Indira Colony", pincode: "124001", isPopular: false },
    { name: "Arya Nagar", pincode: "124001", isPopular: false },
    { name: "Saraswati Nagar", pincode: "124001", isPopular: false },
    { name: "Hanuman Nagar", pincode: "124001", isPopular: false },
    { name: "Gayatri Nagar", pincode: "124001", isPopular: false },
    { name: "Laxmi Nagar", pincode: "124001", isPopular: false },
    { name: "Durga Colony", pincode: "124001", isPopular: false },
    { name: "Shiv Colony", pincode: "124001", isPopular: false },
  ],
  roads: [
    { name: "Delhi Road", pincode: "124001", isPopular: true },
    { name: "Sonipat Road", pincode: "124001", isPopular: true },
    { name: "Jind Road", pincode: "124001", isPopular: true },
    { name: "Bhiwani Road", pincode: "124001", isPopular: true },
    { name: "Hisar Road", pincode: "124001", isPopular: true },
    { name: "Jhajjar Road", pincode: "124001", isPopular: false },
    { name: "Panipat Road", pincode: "124001", isPopular: false },
    { name: "Railway Road", pincode: "124001", isPopular: true },
    { name: "Jail Road", pincode: "124001", isPopular: false },
    { name: "Bohar Road", pincode: "124001", isPopular: false },
    { name: "Bal Bhawan Road", pincode: "124001", isPopular: false },
    { name: "ITI Road", pincode: "124001", isPopular: false },
    { name: "College Road", pincode: "124001", isPopular: true },
    { name: "Stadium Road", pincode: "124001", isPopular: false },
    { name: "Hospital Road", pincode: "124001", isPopular: false },
  ],
  landmarks: [
    { name: "AIIMS Rohtak", pincode: "124001", isPopular: true },
    { name: "PGI Rohtak", pincode: "124001", isPopular: true },
    { name: "MDU (Maharshi Dayanand University)", pincode: "124001", isPopular: true },
    { name: "District Court Rohtak", pincode: "124001", isPopular: true },
    { name: "Bus Stand Rohtak", pincode: "124001", isPopular: true },
    { name: "Railway Station Rohtak", pincode: "124001", isPopular: true },
    { name: "Government College Rohtak", pincode: "124001", isPopular: false },
    { name: "Rohtak Medical College", pincode: "124001", isPopular: false },
    { name: "Mini Secretariat", pincode: "124001", isPopular: false },
    { name: "DC Office", pincode: "124001", isPopular: false },
    { name: "SP Office", pincode: "124001", isPopular: false },
    { name: "Collectorate", pincode: "124001", isPopular: false },
    { name: "Main Market", pincode: "124001", isPopular: true },
    { name: "Sunheri Gate", pincode: "124001", isPopular: true },
    { name: "Kachha Bazar", pincode: "124001", isPopular: false },
    { name: "Grain Market", pincode: "124001", isPopular: false },
    { name: "Cloth Market", pincode: "124001", isPopular: false },
    { name: "Hardware Market", pincode: "124001", isPopular: false },
  ],
  societies: [
    { name: "DLF Colony", pincode: "124001", isPopular: true },
    { name: "Mansarovar Park", pincode: "124001", isPopular: true },
    { name: "Pushpa Vihar", pincode: "124001", isPopular: true },
    { name: "Ashoka Enclave", pincode: "124001", isPopular: true },
    { name: "Green City", pincode: "124001", isPopular: true },
    { name: "Omaxe City", pincode: "124001", isPopular: true },
    { name: "Supertech Eco Village", pincode: "124001", isPopular: true },
    { name: "TDI City", pincode: "124001", isPopular: true },
    { name: "Ansal Royal Heritage", pincode: "124001", isPopular: true },
    { name: "Rama Park", pincode: "124001", isPopular: false },
    { name: "GPS Colony", pincode: "124001", isPopular: false },
    { name: "Police Lines", pincode: "124001", isPopular: false },
    { name: "Bank Colony", pincode: "124001", isPopular: false },
    { name: "Teacher Colony", pincode: "124001", isPopular: false },
    { name: "Doctor Colony", pincode: "124001", isPopular: false },
    { name: "Engineer Colony", pincode: "124001", isPopular: false },
  ],
  areas: [
    { name: "Industrial Area", pincode: "124001", isPopular: true },
    { name: "HUDA Sector", pincode: "124001", isPopular: true },
    { name: "IMT Rohtak", pincode: "124001", isPopular: true },
  ]
};

export const LOCATION_TYPES = [
  { value: "sector", label: "Sector", icon: "🏢" },
  { value: "mohalla", label: "Mohalla", icon: "🏘️" },
  { value: "landmark", label: "Landmark", icon: "📍" },
  { value: "area", label: "Area", icon: "🏞️" },
  { value: "colony", label: "Colony", icon: "🏡" },
  { value: "road", label: "Road", icon: "🛣️" },
  { value: "market", label: "Market", icon: "🏪" },
  { value: "society", label: "Society", icon: "🏗️" },
] as const;

export type LocationType = typeof LOCATION_TYPES[number]["value"];
