// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getBrowserClient } from "@/lib/client";
import {
  LayoutDashboard,
  FileText,
  Layers,
  Mail,
  Users,
  UserCog,
  Settings,
  X,
  User,
  Key,
  Shield,
  ScrollText,
  Send, // <-- 1. IMPORT THE NEW ICON
} from "lucide-react";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type Profile = {
  role: "admin" | "super_admin";
};

export default function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const pathname = usePathname();

  const supabase = getBrowserClient();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        setProfile(profileData as Profile);
      }
    };
    fetchData();
  }, [supabase]);

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 h-screen w-56 px-3 py-3 text-white bg-gray-800
    transform transition-transform duration-300 ease-in-out overflow-y-auto
    md:relative md:translate-x-0
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
  `;

  // Helper function to check if link is active
  const isActive = (path: string) => {
    return pathname.startsWith(path); // Use startsWith to keep it active on sub-pages
  };

  // Navigation Link Component
  const NavLink = ({
    href,
    icon: Icon,
    label,
    badge,
  }: {
    href: string;
    icon: any;
    label: string;
    badge?: string;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`flex items-center justify-between px-2 py-1.5 space-x-2 rounded-md transition-colors text-sm ${
          active ? "bg-blue-600 text-white" : "hover:bg-gray-700 text-gray-200"
        }`}
      >
        <div className="flex items-center space-x-2">
          <Icon size={18} />
          <span>{label}</span>
        </div>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500 text-gray-900 rounded-full font-semibold">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  // Section Header Component
  const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="mb-1.5 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
      {title}
    </h3>
  );

  // Only super admins should see elevated navigation (e.g., Audit Log).
  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <>
      <aside className={sidebarClasses}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-xl font-bold">
            <Link href="/admin/dashboard">KaizenHRMS</Link>
          </div>
          <button onClick={onClose} className="md:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col space-y-4">
          {/* OVERVIEW */}
          <div>
            <SectionHeader title="Overview" />
            <div className="space-y-1">
              <NavLink
                href="/admin/dashboard"
                icon={LayoutDashboard}
                label="Dashboard"
              />
            </div>
          </div>

          {/* CONTENT */}
          <div>
            <SectionHeader title="Content" />
            <div className="space-y-1">
              <NavLink href="/admin/blog" icon={FileText} label="Blog Posts" />
              <NavLink href="/admin/hrms" icon={Layers} label="HRMS Modules" />
              <NavLink href="/admin/contacts" icon={Mail} label="Contacts" />
              <NavLink
                href="/admin/subscribers"
                icon={Users}
                label="Subscribers"
              />
              {/* Newsletter is restricted to super admins. */}
              {isSuperAdmin && (
                <NavLink
                  href="/admin/newsletter"
                  icon={Send}
                  label="Newsletter"
                />
              )}
            </div>
          </div>

          {/* ADMINISTRATION - Super Admin Only */}
          {isSuperAdmin && (
            <div>
              <SectionHeader title="Administration" />
              <div className="space-y-1">
                <NavLink
                  href="/admin/users"
                  icon={UserCog}
                  label="User Management"
                />
                <NavLink
                  href="/admin/audit-log"
                  icon={ScrollText}
                  label="Audit Log"
                />
              </div>
            </div>
          )}

          {/* MY ACCOUNT */}
          <div>
            <SectionHeader title="My Account" />
            <div className="space-y-1">
              <NavLink href="/admin/profile" icon={User} label="Profile" />
              <NavLink
                href="/admin/change-password"
                icon={Key}
                label="Change Password"
              />
            </div>
          </div>

          {/* SYSTEM - Super Admin Only */}
          {isSuperAdmin && (
            <div>
              <SectionHeader title="System" />
              <div className="space-y-1">
                <NavLink
                  href="/admin/settings"
                  icon={Shield}
                  label="General Settings"
                />
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
