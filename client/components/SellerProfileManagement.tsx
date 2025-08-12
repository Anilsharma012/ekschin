import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  User,
  Camera,
  Phone,
  Mail,
  MapPin,
  Building,
  Save,
  X,
  Edit,
  Shield,
  Bell,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Upload,
  Crown,
  Star,
  Calendar,
  Clock,
  Zap
} from "lucide-react";

interface SellerProfile {
  name: string;
  email: string;
  phone: string;
  alternativePhone?: string;
  whatsappNumber?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  shopName?: string;
  shopAddress?: string;
  gstNumber?: string;
  description?: string;
  profilePicture?: string;
  coverPhoto?: string;
  businessCategory?: string;
  website?: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    profileVisibility: boolean;
    contactInfoVisible: boolean;
    businessHours: {
      monday: { open: string; close: string; closed: boolean };
      tuesday: { open: string; close: string; closed: boolean };
      wednesday: { open: string; close: string; closed: boolean };
      thursday: { open: string; close: string; closed: boolean };
      friday: { open: string; close: string; closed: boolean };
      saturday: { open: string; close: string; closed: boolean };
      sunday: { open: string; close: string; closed: boolean };
    };
  };
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    documentVerified: boolean;
    profileCompleted: boolean;
  };
}

interface PlanDetails {
  planType: "Free" | "Premium" | "Featured" | "Spotlight";
  startDate: Date;
  expiryDate: Date;
  remainingDays: number;
  features: string[];
  usage: {
    propertiesPosted: number;
    maxProperties: number;
    featuredListings: number;
    maxFeaturedListings: number;
    premiumBoosts: number;
    maxPremiumBoosts: number;
  };
}

interface SellerProfileManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SellerProfileManagement({ isOpen, onClose }: SellerProfileManagementProps) {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/seller/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.data.profile);
        setPlanDetails(data.data.plan);
      } else {
        setError(data.error || "Failed to load profile");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updatedProfile: Partial<SellerProfile>) => {
    try {
      setSaving(true);
      const response = await fetch("/api/seller/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedProfile),
      });

      const data = await response.json();
      if (data.success) {
        setProfile({ ...profile!, ...updatedProfile });
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await fetch("/api/seller/upload-profile-picture", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setProfile({ ...profile!, profilePicture: data.data.profilePicture });
        setSuccess("Profile picture updated successfully!");
      } else {
        setError(data.error || "Failed to upload profile picture");
      }
    } catch (error) {
      setError("Failed to upload profile picture");
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchProfile();
    }
  }, [isOpen, token]);

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case "Premium":
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case "Featured":
        return <Star className="h-5 w-5 text-blue-500" />;
      case "Spotlight":
        return <Zap className="h-5 w-5 text-purple-500" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case "Premium":
        return "border-yellow-200 bg-yellow-50 text-yellow-800";
      case "Featured":
        return "border-blue-200 bg-blue-50 text-blue-800";
      case "Spotlight":
        return "border-purple-200 bg-purple-50 text-purple-800";
      default:
        return "border-gray-200 bg-gray-50 text-gray-800";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Profile Management</h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="m-6 mb-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="m-6 mb-0">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="plan">Plan Details</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Profile Picture */}
                    <div className="flex items-center space-x-6 mb-6">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={profile?.profilePicture} />
                          <AvatarFallback className="text-xl">
                            {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                          <Camera className="h-3 w-3" />
                          <input
                            id="profile-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadProfilePicture(file);
                            }}
                          />
                        </label>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">{profile?.name || user?.name}</h3>
                        <p className="text-gray-600">{profile?.email || user?.email}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          {profile?.verification.emailVerified && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Email Verified
                            </Badge>
                          )}
                          {profile?.verification.phoneVerified && (
                            <Badge className="bg-blue-100 text-blue-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Phone Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={profile?.name || ""}
                          onChange={(e) => setProfile({ ...profile!, name: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile?.email || ""}
                          onChange={(e) => setProfile({ ...profile!, email: e.target.value })}
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Primary Phone *</Label>
                        <Input
                          id="phone"
                          value={profile?.phone || ""}
                          onChange={(e) => setProfile({ ...profile!, phone: e.target.value })}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="altPhone">Alternative Phone</Label>
                        <Input
                          id="altPhone"
                          value={profile?.alternativePhone || ""}
                          onChange={(e) => setProfile({ ...profile!, alternativePhone: e.target.value })}
                          placeholder="Alternative phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="whatsapp">WhatsApp Number</Label>
                        <Input
                          id="whatsapp"
                          value={profile?.whatsappNumber || ""}
                          onChange={(e) => setProfile({ ...profile!, whatsappNumber: e.target.value })}
                          placeholder="WhatsApp number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={profile?.city || ""}
                          onChange={(e) => setProfile({ ...profile!, city: e.target.value })}
                          placeholder="Your city"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="address">Complete Address</Label>
                      <Textarea
                        id="address"
                        value={profile?.address || ""}
                        onChange={(e) => setProfile({ ...profile!, address: e.target.value })}
                        placeholder="Enter your complete address"
                        rows={3}
                      />
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="description">About Me</Label>
                      <Textarea
                        id="description"
                        value={profile?.description || ""}
                        onChange={(e) => setProfile({ ...profile!, description: e.target.value })}
                        placeholder="Tell buyers about yourself and your business"
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Business Tab */}
              <TabsContent value="business" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shopName">Shop/Business Name</Label>
                        <Input
                          id="shopName"
                          value={profile?.shopName || ""}
                          onChange={(e) => setProfile({ ...profile!, shopName: e.target.value })}
                          placeholder="Enter your shop name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessCategory">Business Category</Label>
                        <Select
                          value={profile?.businessCategory || ""}
                          onValueChange={(value) => setProfile({ ...profile!, businessCategory: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="real-estate-agent">Real Estate Agent</SelectItem>
                            <SelectItem value="property-dealer">Property Dealer</SelectItem>
                            <SelectItem value="builder">Builder/Developer</SelectItem>
                            <SelectItem value="individual">Individual Seller</SelectItem>
                            <SelectItem value="property-consultant">Property Consultant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="gstNumber">GST Number</Label>
                        <Input
                          id="gstNumber"
                          value={profile?.gstNumber || ""}
                          onChange={(e) => setProfile({ ...profile!, gstNumber: e.target.value })}
                          placeholder="Enter GST number (if applicable)"
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={profile?.website || ""}
                          onChange={(e) => setProfile({ ...profile!, website: e.target.value })}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="shopAddress">Shop/Office Address</Label>
                      <Textarea
                        id="shopAddress"
                        value={profile?.shopAddress || ""}
                        onChange={(e) => setProfile({ ...profile!, shopAddress: e.target.value })}
                        placeholder="Enter your shop/office address"
                        rows={3}
                      />
                    </div>

                    <div className="mt-6">
                      <Label className="text-base font-medium">Social Media Links</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <Label htmlFor="facebook">Facebook</Label>
                          <Input
                            id="facebook"
                            value={profile?.socialLinks?.facebook || ""}
                            onChange={(e) => setProfile({ 
                              ...profile!, 
                              socialLinks: { ...profile?.socialLinks, facebook: e.target.value }
                            })}
                            placeholder="Facebook profile URL"
                          />
                        </div>
                        <div>
                          <Label htmlFor="instagram">Instagram</Label>
                          <Input
                            id="instagram"
                            value={profile?.socialLinks?.instagram || ""}
                            onChange={(e) => setProfile({ 
                              ...profile!, 
                              socialLinks: { ...profile?.socialLinks, instagram: e.target.value }
                            })}
                            placeholder="Instagram profile URL"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Plan Details Tab */}
              <TabsContent value="plan" className="space-y-6 mt-6">
                {planDetails && (
                  <Card className={`border-2 ${getPlanColor(planDetails.planType)}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        {getPlanIcon(planDetails.planType)}
                        <span>{planDetails.planType} Plan</span>
                        {planDetails.planType !== "Free" && (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="text-center">
                          <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                          <p className="text-sm text-gray-600">Start Date</p>
                          <p className="font-semibold">{new Date(planDetails.startDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-center">
                          <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                          <p className="text-sm text-gray-600">Expiry Date</p>
                          <p className="font-semibold">{new Date(planDetails.expiryDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-center">
                          <div className={`h-8 w-8 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            planDetails.remainingDays > 7 ? 'bg-green-100 text-green-600' : 
                            planDetails.remainingDays > 3 ? 'bg-yellow-100 text-yellow-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            <span className="text-sm font-bold">{planDetails.remainingDays}</span>
                          </div>
                          <p className="text-sm text-gray-600">Days Remaining</p>
                          <p className="font-semibold">
                            {planDetails.remainingDays > 0 ? `${planDetails.remainingDays} days left` : 'Expired'}
                          </p>
                        </div>
                      </div>

                      {/* Usage Statistics */}
                      <div className="space-y-4 mb-6">
                        <h4 className="font-medium">Usage Statistics</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Properties Posted</span>
                              <span>{planDetails.usage.propertiesPosted}/{planDetails.usage.maxProperties}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, (planDetails.usage.propertiesPosted / planDetails.usage.maxProperties) * 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Featured Listings</span>
                              <span>{planDetails.usage.featuredListings}/{planDetails.usage.maxFeaturedListings}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, (planDetails.usage.featuredListings / planDetails.usage.maxFeaturedListings) * 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Premium Boosts</span>
                              <span>{planDetails.usage.premiumBoosts}/{planDetails.usage.maxPremiumBoosts}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, (planDetails.usage.premiumBoosts / planDetails.usage.maxPremiumBoosts) * 100)}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Plan Features */}
                      <div>
                        <h4 className="font-medium mb-3">Plan Features</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {planDetails.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {planDetails.remainingDays <= 7 && (
                        <Alert className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Your plan expires in {planDetails.remainingDays} days. Consider upgrading to continue enjoying premium features.
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <Switch 
                          checked={profile?.preferences?.emailNotifications || false}
                          onCheckedChange={(checked) => setProfile({
                            ...profile!,
                            preferences: { ...profile?.preferences!, emailNotifications: checked }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-gray-500">Receive push notifications for new messages</p>
                        </div>
                        <Switch 
                          checked={profile?.preferences?.pushNotifications || false}
                          onCheckedChange={(checked) => setProfile({
                            ...profile!,
                            preferences: { ...profile?.preferences!, pushNotifications: checked }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">SMS Notifications</p>
                          <p className="text-sm text-gray-500">Receive SMS for important updates</p>
                        </div>
                        <Switch 
                          checked={profile?.preferences?.smsNotifications || false}
                          onCheckedChange={(checked) => setProfile({
                            ...profile!,
                            preferences: { ...profile?.preferences!, smsNotifications: checked }
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Profile Visibility</p>
                            <p className="text-sm text-gray-500">Make your profile visible to potential buyers</p>
                          </div>
                        </div>
                        <Switch 
                          checked={profile?.preferences?.profileVisibility || false}
                          onCheckedChange={(checked) => setProfile({
                            ...profile!,
                            preferences: { ...profile?.preferences!, profileVisibility: checked }
                          })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Contact Information</p>
                            <p className="text-sm text-gray-500">Show contact details on property listings</p>
                          </div>
                        </div>
                        <Switch 
                          checked={profile?.preferences?.contactInfoVisible || false}
                          onCheckedChange={(checked) => setProfile({
                            ...profile!,
                            preferences: { ...profile?.preferences!, contactInfoVisible: checked }
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => updateProfile(profile!)} 
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
