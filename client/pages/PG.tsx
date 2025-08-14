import React from "react";
import OLXStyleHeader from "../components/OLXStyleHeader";
import CategoryBar from "../components/CategoryBar";
import BottomNavigation from "../components/BottomNavigation";
import DynamicFooter from "../components/DynamicFooter";

export default function PG() {
  return (
    <div className="min-h-screen bg-white">
      <OLXStyleHeader />
      
      <main className="pb-16">
        <CategoryBar />
        
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">PG & Hostels</h1>
            <p className="text-gray-600 mb-8">Find paying guest accommodations and hostels</p>
            
            <div className="bg-gray-50 rounded-lg p-8">
              <p className="text-gray-500">PG & Hostels page content will be added here.</p>
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />
      <DynamicFooter />
    </div>
  );
}
