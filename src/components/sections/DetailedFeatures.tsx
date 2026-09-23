// src/components/sections/DetailedFeatures.tsx
"use client";

import React from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { useHrmsSubmenus } from "../layout/navbar/useHrmsSubmenus";

const DetailedFeatures = () => {
  const modules = useHrmsSubmenus();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
      {modules.map((module, index) => {
        const IconComponent = module.icon || LayoutGrid;
        return (
          <Link
            href={module.path}
            key={module.path || index}
            aria-label={`Explore ${module.name}`}
            className="group flex items-center gap-3 px-4 py-3.5 rounded-lg bg-white/[0.07] backdrop-blur-[2px] border border-white/[0.09] hover:bg-white/[0.14] hover:border-white/[0.2] transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-md bg-white/[0.12] flex items-center justify-center shrink-0 text-teal-200 group-hover:text-yellow-300 transition-colors duration-200">
              <IconComponent size={18} strokeWidth={1.7} />
            </div>
            <span className="text-[13px] sm:text-sm font-medium text-white/85 group-hover:text-white leading-snug transition-colors duration-200">
              {module.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default DetailedFeatures;
