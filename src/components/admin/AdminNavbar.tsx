"use client";

import { getBrowserClient } from "@/lib/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { Menu, ChevronDown, User as UserIcon, LogOut } from "lucide-react";

export default function AdminNavbar({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = getBrowserClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-gradient-to-r from-[#0D1B2A] to-[#1B263B] shadow-md sm:px-6 lg:px-8 border-b border-slate-800">
      <div className="flex items-center space-x-4">
        {/* Hamburger Menu for Mobile */}
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-300 hover:bg-slate-800/50 rounded-lg transition-colors md:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <Link
          href="/admin/dashboard"
          className="text-xl font-bold text-white tracking-tight hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span className="text-blue-500">KaizenHRMS</span>
        </Link>
      </div>

      {/* User Dropdown Menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all border border-transparent ${isDropdownOpen ? "bg-slate-800/50 border-slate-700" : ""}`}
        >
          <span className="hidden sm:inline-block max-w-[200px] truncate">
            {user?.email || "Account"}
          </span>
          <span className="sm:hidden">
            <UserIcon size={20} />
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 w-60 mt-2 origin-top-right bg-white dark:bg-[#1B263B] rounded-lg shadow-xl ring-1 ring-black/5 dark:ring-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 border border-slate-100 dark:border-slate-700">
            <div className="py-1">
              {/* User Email Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-[#0D1B2A]/30">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Signed in as
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user?.email}
                </p>
              </div>

              {/* Profile Link */}
              <Link
                href="/admin/profile"
                className="flex items-center space-x-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors mt-1"
                onClick={() => setIsDropdownOpen(false)}
              >
                <UserIcon size={16} className="text-slate-400" />
                <span>Profile Settings</span>
              </Link>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
