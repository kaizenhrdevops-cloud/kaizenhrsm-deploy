// src/components/layout/Navbar.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLink, DropdownTrigger } from "./navbar/NavItems";
import DesktopDropdowns from "./navbar/DesktopDropdowns";
import MobileMenu from "./navbar/MobileMenu";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);

  const hrmsDropdownRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const unmountTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMouseInsideRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current);
    };
  }, []);

  // Close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false);
        setOpenMobileSubmenu(null);
      }
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Auto scroll to top when HRMS dropdown opens
  useEffect(() => {
    if (activeDropdown === "hrms" && hrmsDropdownRef.current) {
      hrmsDropdownRef.current.scrollTo({ top: 0 });
    }
  }, [activeDropdown]);

  const clearAllTimers = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (unmountTimerRef.current) {
      clearTimeout(unmountTimerRef.current);
      unmountTimerRef.current = null;
    }
  };

  const openDropdown = (id: string) => {
    clearAllTimers();
    isMouseInsideRef.current = true;
    setIsClosing(false);
    setActiveDropdown(id);
  };

  const closeDropdown = () => {
    isMouseInsideRef.current = false;
    clearAllTimers();
    closeTimerRef.current = setTimeout(() => {
      if (!isMouseInsideRef.current) {
        setIsClosing(true);
        unmountTimerRef.current = setTimeout(() => {
          if (!isMouseInsideRef.current) {
            setActiveDropdown(null);
            setIsClosing(false);
          }
        }, 220);
      }
    }, 150);
  };

  const toggleMobileSubmenu = (submenu: string) => {
    setOpenMobileSubmenu((prev) => (prev === submenu ? null : submenu));
  };

  const handleMobileLinkClick = () => {
    setMobileMenuOpen(false);
    setOpenMobileSubmenu(null);
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-gray-100"
          : "bg-white border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group z-50 relative shrink-0">
            <div className="text-3xl font-bold text-[#008080] tracking-tight group-hover:opacity-80 transition-opacity duration-300">
              kaizen
            </div>
          </Link>

          {/* Desktop Navigation — visible on lg (1024px+) screens, responsive spacing prevents clipping */}
          <div className="hidden lg:flex items-center justify-between flex-1 ml-4 xl:ml-8 2xl:ml-12 h-full min-w-0">
            <div className="flex items-center space-x-2 xl:space-x-5 2xl:space-x-7 mx-auto h-full min-w-0">
              <DropdownTrigger
                label="HRMS"
                open={activeDropdown === "hrms"}
                onEnter={() => openDropdown("hrms")}
                onLeave={closeDropdown}
              />
              <DropdownTrigger
                label="Resources"
                open={activeDropdown === "resources"}
                onEnter={() => openDropdown("resources")}
                onLeave={closeDropdown}
              />

              {/* Direct Links */}
              <NavLink
                href="/resources/blog-articles"
                isActive={pathname.startsWith("/resources/blog-articles")}
              >
                Blog & Articles
              </NavLink>
              <NavLink
                href="/company/developments"
                isActive={pathname.startsWith("/company/developments")}
              >
                Developments
              </NavLink>
              <NavLink
                href="/company/careers"
                isActive={pathname.startsWith("/company/careers")}
              >
                Careers
              </NavLink>

              <DropdownTrigger
                label="Company"
                open={activeDropdown === "company"}
                onEnter={() => openDropdown("company")}
                onLeave={closeDropdown}
              />
            </div>

            {/* Desktop Contact Us Button */}
            <Link
              href="/company/contact-us"
              className="shrink-0 whitespace-nowrap bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 px-5 xl:px-7 py-2.5 rounded-full font-semibold text-xs xl:text-sm transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
            >
              Contact Us
            </Link>
          </div>

          {/* Mobile Menu Hamburger Button — visible below lg (1024px) */}
          <div className="lg:hidden z-50 relative">
            <button
              onClick={() => {
                if (mobileMenuOpen) {
                  setMobileMenuOpen(false);
                  setOpenMobileSubmenu(null);
                } else {
                  setMobileMenuOpen(true);
                }
              }}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-full transition-colors duration-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <DesktopDropdowns
        activeDropdown={activeDropdown}
        isClosing={isClosing}
        hrmsDropdownRef={hrmsDropdownRef}
        onEnter={openDropdown}
        onLeave={closeDropdown}
        onClose={() => setActiveDropdown(null)}
      />

      <MobileMenu
        open={mobileMenuOpen}
        openSubmenu={openMobileSubmenu}
        pathname={pathname}
        onToggle={toggleMobileSubmenu}
        onNavigate={handleMobileLinkClick}
      />
    </nav>
  );
};

export default Navbar;
