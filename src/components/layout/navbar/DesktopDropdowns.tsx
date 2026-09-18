"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { resourcesSubmenus, companySubmenus } from "@/data/submenus";
import { DropdownItem } from "./NavItems";
import { useHrmsSubmenus } from "./useHrmsSubmenus";

export default function DesktopDropdowns({
  activeDropdown,
  isClosing,
  hrmsDropdownRef,
  onEnter,
  onLeave,
  onClose,
}: {
  activeDropdown: string | null;
  isClosing: boolean;
  hrmsDropdownRef: React.RefObject<HTMLDivElement | null>;
  onEnter: (id: string) => void;
  onLeave: () => void;
  onClose: () => void;
}) {
  const hrmsSubmenus = useHrmsSubmenus();
  const [scrollAtBottom, setScrollAtBottom] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Monitor scroll in HRMS dropdown to dynamically toggle arrow and detect overflow
  useEffect(() => {
    const el = hrmsDropdownRef.current;
    if (!el || activeDropdown !== "hrms") return;

    const checkScroll = () => {
      const isOverflowing = el.scrollHeight > el.clientHeight + 10;
      setHasOverflow(isOverflowing);
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
      setScrollAtBottom(atBottom);
    };

    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [activeDropdown, hrmsDropdownRef, hrmsSubmenus]);

  const handleScrollToggle = () => {
    const el = hrmsDropdownRef.current;
    if (!el) return;
    if (scrollAtBottom) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  };

  const isVisible = Boolean(activeDropdown && !isClosing);

  return (
    <div
      className={`absolute top-full left-0 w-full z-40 transition-all duration-200 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto visible"
          : "opacity-0 -translate-y-2 pointer-events-none invisible"
      }`}
      onMouseEnter={() => {
        if (activeDropdown) onEnter(activeDropdown);
      }}
      onMouseLeave={onLeave}
    >
      <div className="w-full bg-white/98 backdrop-blur-xl border-t border-gray-100 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)]">
        {/* HRMS section */}
        {activeDropdown === "hrms" && (
          <div
            ref={hrmsDropdownRef}
            className="max-h-[75vh] overflow-y-auto overscroll-contain transition-opacity duration-200"
          >
            <div className="max-w-7xl mx-auto p-8 relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hrmsSubmenus.map((item, index) => (
                  <DropdownItem key={index} item={item} onNavigate={onClose} />
                ))}
              </div>

              {hasOverflow && (
                <div className="sticky bottom-4 w-full flex justify-end pr-8 pointer-events-none mt-4">
                  <button
                    onClick={handleScrollToggle}
                    className="bg-blue-600 shadow-lg rounded-full p-3 hover:bg-blue-700 hover:scale-110 transition-all duration-300 pointer-events-auto text-white cursor-pointer"
                    title={scrollAtBottom ? "Scroll to top" : "Scroll down"}
                    aria-label={scrollAtBottom ? "Scroll to top" : "Scroll down"}
                  >
                    {scrollAtBottom ? (
                      <ChevronUp size={22} />
                    ) : (
                      <ChevronDown size={22} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resources section */}
        {activeDropdown === "resources" && (
          <div className="max-w-7xl mx-auto p-8 transition-opacity duration-200">
            <div className="flex flex-wrap justify-center gap-6">
              {resourcesSubmenus.map((item, index) => (
                <DropdownItem
                  key={index}
                  item={item}
                  wide
                  onNavigate={onClose}
                />
              ))}
            </div>
          </div>
        )}

        {/* Company section */}
        {activeDropdown === "company" && (
          <div className="max-w-7xl mx-auto p-8 transition-opacity duration-200">
            <div className="flex flex-wrap justify-center gap-6">
              {companySubmenus.map((item, index) => (
                <DropdownItem
                  key={index}
                  item={item}
                  wide
                  onNavigate={onClose}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
