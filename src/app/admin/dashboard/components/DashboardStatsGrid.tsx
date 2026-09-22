// src/app/admin/dashboard/components/DashboardStatsGrid.tsx
"use client";

import { DashboardStat } from "@/types/dashboard";
import {
  FileText,
  Users,
  Mail,
  Activity,
  ShieldAlert,
  Server,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import Link from "next/link";

const iconMap = {
  FileText,
  Users,
  Mail,
  Activity,
  ShieldAlert,
  Server,
};

const colorStyles = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100" },
  green: { bg: "bg-green-50", text: "text-green-600", iconBg: "bg-green-100" },
  yellow: {
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    iconBg: "bg-yellow-100",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    iconBg: "bg-purple-100",
  },
  red: { bg: "bg-red-50", text: "text-red-600", iconBg: "bg-red-100" },
  gray: { bg: "bg-slate-50", text: "text-slate-600", iconBg: "bg-slate-100" },
};

export default function DashboardStatsGrid({
  stats,
}: {
  stats: DashboardStat[];
}) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat, index) => {
        const Icon = iconMap[stat.iconName] || Activity;
        const styles = colorStyles[stat.color] || colorStyles.gray;

        return (
          <Link
            key={index}
            href={stat.href}
            className="group relative flex flex-col justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`p-2.5 rounded-xl ${styles.iconBg} ${styles.text}`}
              >
                <Icon size={20} />
              </div>
              {stat.trend && (
                <div
                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trend === "up"
                      ? "bg-green-50 text-green-700"
                      : stat.trend === "down"
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-50 text-slate-600"
                  }`}
                >
                  {stat.trend === "up" && <TrendingUp size={12} />}
                  {stat.trend === "down" && <TrendingDown size={12} />}
                  {stat.trend === "neutral" && <Minus size={12} />}
                  <span>{stat.trendValue}</span>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                {stat.label}
              </p>
            </div>

            {stat.trendLabel && (
              <div className="mt-3 text-xs text-slate-400">
                <span className="opacity-80">{stat.trendLabel}</span>
              </div>
            )}

            {/* Decoration: Subtle background chart line */}
            <div className="absolute bottom-0 right-0 w-24 h-12 opacity-5 pointer-events-none">
              <svg
                viewBox="0 0 100 40"
                className="w-full h-full fill-current text-slate-900"
              >
                <path d="M0 40 L0 30 Q 20 10 40 30 T 100 20 L 100 40 Z" />
              </svg>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
