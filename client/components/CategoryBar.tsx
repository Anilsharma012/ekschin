import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CategoryButton {
  name: string;
  path: string;
}

const categoryButtons: CategoryButton[] = [
  { name: "Buy", path: "/buy" },
  { name: "Sale", path: "/sale" },
  { name: "Rent", path: "/rent" },
  { name: "Lease", path: "/lease" },
  { name: "PG", path: "/pg" },
  { name: "Other Services", path: "/services" },
];

export default function CategoryBar() {
  const location = useLocation();

  return (
    <div className="bg-white">
      <div className="px-4 py-6">
        <div className="flex flex-wrap gap-3 justify-center">
          {categoryButtons.map((category) => {
            const isActive = location.pathname === category.path;

            return (
              <Link
                key={category.path}
                to={category.path}
                className={cn(
                  "px-6 py-3 rounded-full text-sm font-medium transition-all duration-200",
                  "border border-gray-200 hover:shadow-lg hover:scale-105",
                  "active:scale-95 transform",
                  isActive
                    ? "bg-[#C70000] text-white border-[#C70000] font-bold shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300",
                )}
              >
                <span className={isActive ? "underline" : ""}>
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
