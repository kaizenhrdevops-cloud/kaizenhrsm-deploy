// src/components/sections/RelatedModulesSection.tsx
import React from "react";
import Image from "next/image";
import Container from "@/components/layout/Container";

// Define the type for a single module
type Module = {
  name: string;
  description: string;
  link: string;
  imageSrc?: string;
};

// Define the props for the component
interface RelatedModulesSectionProps {
  modules: Module[];
  title?: string;
}

const RelatedModulesSection = ({
  modules,
  title = "One System. Infinite HR Possibilities",
}: RelatedModulesSectionProps) => {
  return (
    <div className="bg-slate-50">
      <Container className="py-24">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <div
              key={index}
              // 1. Main Card Effects: "hover:-translate-y-2" for lift, "hover:shadow-xl" for depth
              className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col hover:-translate-y-2"
            >
              {module.imageSrc ? (
                <div className="w-full h-48 relative bg-gray-100 overflow-hidden">
                  <Image
                    src={module.imageSrc}
                    alt={`${module.name} module`}
                    fill
                    // 2. Image Scaling Logic:
                    // - "scale-120 lg:scale-100": Forces image to fill space on different screens (your fix)
                    // - "lg:group-hover:scale-110": Zooms image slightly on desktop hover (my addition)
                    className="object-cover scale-120 lg:scale-100 transition-transform duration-500 ease-in-out lg:group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    priority={index < 4}
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-blue-600 text-4xl mb-2">📊</div>
                    <p className="text-blue-500 text-sm">Module Image</p>
                  </div>
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* 3. Title Color Change: Title turns blue on hover */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                  {module.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {module.description}
                </p>

                {/* 4. Read More Link: Removed underline, kept simple arrow animation */}
                <a
                  href={module.link}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm group mt-auto"
                >
                  Read More
                  <svg
                    className="w-4 h-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default RelatedModulesSection;
