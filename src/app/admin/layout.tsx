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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    // Main container now stacks vertically
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Single toast system for all of /admin (react-hot-toast) */}
      <Toaster position="top-center" />
      {/* Navbar is now a direct child, it will be full-width by default */}
      <AdminNavbar onMenuClick={() => setIsSidebarOpen(true)} />

      {/* New container for the content area below the navbar */}
      <div className="flex flex-1 overflow-hidden">
        {/* The Sidebar is inside the new container */}
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* The main content area is also inside the new container */}
        <main className="flex-1 p-4 overflow-y-auto md:p-6">{children}</main>
      </div>
    </div>
  );
}
