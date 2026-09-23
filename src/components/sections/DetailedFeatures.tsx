// src/components/sections/DetailedFeatures.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useHrmsSubmenus } from "../layout/navbar/useHrmsSubmenus";

const DetailedFeatures = () => {
  const modules = useHrmsSubmenus();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
      {modules.map((module, index) => {
        const IconComponent = module.icon;
        return (
          <Link
            href={module.path}
            key={module.path || index}
            aria-label={`Explore ${module.name}`}
            className="group relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-white/80 hover:border-teal-300/80 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#008080] border border-teal-100 flex items-center justify-center shrink-0 group-hover:bg-[#008080] group-hover:text-white group-hover:border-[#008080] transition-colors duration-200 shadow-sm">
                {IconComponent ? (
                  <IconComponent size={20} strokeWidth={1.8} />
                ) : (
                  <span className="text-sm font-bold">HR</span>
                )}
              </div>
              <h3 className="text-[14px] sm:text-[15px] font-semibold text-slate-800 group-hover:text-teal-900 transition-colors leading-snug line-clamp-2">
                {module.name}
              </h3>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-slate-300 group-hover:text-teal-700 group-hover:bg-teal-50 transition-all duration-200">
              <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default DetailedFeatures;
