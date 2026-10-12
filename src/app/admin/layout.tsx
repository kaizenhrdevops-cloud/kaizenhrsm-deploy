// src/app/admin/layout.tsx
"use client";

import { useState } from "react";
import { Toaster } from "react-hot-toast";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminSessionGuard from "@/components/admin/AdminSessionGuard";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Mobile/tablet overlay (< lg). Desktop (>= lg) uses isDesktopCollapsed.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  // Privacy gate: paint nothing protected (navbar email, sidebar, page
  // content) until the session guard confirms this tab owns a live session.
  // A fresh tab with leftover cookies stays on the blank screen below and
  // is bounced to /login without ever flashing admin content.
  const [sessionReady, setSessionReady] = useState(false);

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
      {/* Ends the session when the last admin tab closes; 30m idle / 8h max.
          Kept mounted in both branches so verification runs exactly once. */}
      <AdminSessionGuard onReady={() => setSessionReady(true)} />
      {!sessionReady ? (
        // Blank screen while the session is being verified. Deliberately
        // free of any app content (no brand, email, nav, or page data).
        <div
          className="flex flex-1 items-center justify-center"
          aria-busy="true"
          aria-label="Verifying session"
        >
          <div
            className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin"
            role="status"
            aria-label="Loading"
          />
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
