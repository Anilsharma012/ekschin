import OLXStyleHeader from "../components/OLXStyleHeader";
import OLXStyleCategories from "../components/OLXStyleCategories";
import OLXStyleListings from "../components/OLXStyleListings";
import PWAInstallPrompt from "../components/PWAInstallPrompt";
import BottomNavigation from "../components/BottomNavigation";

export default function OLXStyleIndex() {
  return (
    <div className="min-h-screen bg-gray-50">
      <OLXStyleHeader />
      
      <main className="pb-16">
        <OLXStyleCategories />
        <OLXStyleListings />
      </main>

      <BottomNavigation />
      <PWAInstallPrompt />
    </div>
  );
}
