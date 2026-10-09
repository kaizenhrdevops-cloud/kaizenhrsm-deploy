// src/app/admin/layout.tsx
"use client";

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Mobile/tablet overlay (< lg). Desktop (>= lg) uses isDesktopCollapsed.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  // Single hamburger in the navbar controls both: overlay below lg,
  // collapse toggle at lg and above (so cramped tables get full width).
  const handleMenuClick = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setIsDesktopCollapsed((v) => !v);
    } else {
      setIsSidebarOpen(true);
    }
  };

  return (
    // Main container now stacks vertically
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0B101D]">
      {/* Single toast system for all of /admin (react-hot-toast) */}
      <Toaster position="top-center" />
      {/* Navbar is now a direct child, it will be full-width by default */}
      <AdminNavbar onMenuClick={handleMenuClick} />

      {/* New container for the content area below the navbar */}
      <div className="flex flex-1 overflow-hidden">
        {/* The Sidebar is inside the new container */}
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isDesktopCollapsed}
          onCollapse={() => setIsDesktopCollapsed(true)}
        />

        {/* The main content area is also inside the new container */}
        <main className="flex-1 min-w-0 p-4 overflow-y-auto md:p-6">{children}</main>
      </div>
    </div>
  );
}
