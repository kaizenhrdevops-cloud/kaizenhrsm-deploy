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
  Send,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

const iconMap = {
  FileText,
  Users,
  Mail,
  Activity,
  ShieldAlert,
  Server,
  Send,
};

const colorStyles: Record<
  string,
  {
    iconBg: string;
    text: string;
    borderHover: string;
  }
> = {
  blue: {
    iconBg:
      "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400 dark:border dark:border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    borderHover:
      "group-hover:border-blue-400/50 dark:group-hover:border-blue-500/40",
  },
  green: {
    iconBg:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border dark:border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    borderHover:
      "group-hover:border-emerald-400/50 dark:group-hover:border-emerald-500/40",
  },
  yellow: {
    iconBg:
      "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    borderHover:
      "group-hover:border-amber-400/50 dark:group-hover:border-amber-500/40",
  },
  purple: {
    iconBg:
      "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400 dark:border dark:border-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    borderHover:
      "group-hover:border-purple-400/50 dark:group-hover:border-purple-500/40",
  },
  red: {
    iconBg:
      "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 dark:border dark:border-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    borderHover:
      "group-hover:border-rose-400/50 dark:group-hover:border-rose-500/40",
  },
  gray: {
    iconBg:
      "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:border dark:border-slate-700/50",
    text: "text-slate-700 dark:text-slate-300",
    borderHover:
      "group-hover:border-slate-400/50 dark:group-hover:border-slate-600/50",
  },
};

export default function DashboardStatsGrid({
  stats,
}: {
  stats: DashboardStat[];
}) {
  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat, index) => {
        const Icon = iconMap[stat.iconName] || Activity;
        const styles = colorStyles[stat.color] || colorStyles.gray;
        // On 2-col mobile with an odd total (e.g. 5 cards), make the last card span full width for balanced layout
        const isLastOdd = stats.length % 2 !== 0 && index === stats.length - 1;

        return (
          <Link
            key={index}
            href={stat.href}
            className={`group relative flex flex-col justify-between p-4 sm:p-5 bg-white dark:bg-[#111A2E]/85 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-sm hover:shadow-md dark:shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 ${styles.borderHover} ${
              isLastOdd ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            {/* Top row: Icon + Trend Pill */}
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div
                className={`p-2 sm:p-2.5 rounded-xl transition-transform group-hover:scale-105 duration-200 ${styles.iconBg}`}
              >
                <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>

              <div className="flex items-center gap-1.5">
                {stat.trend && (
                  <div
                    className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-full border transition-colors ${
                      stat.trend === "up"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25"
                        : stat.trend === "down"
                          ? "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25"
                          : "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60"
                    }`}
                  >
                    {stat.trend === "up" && (
                      <TrendingUp size={11} className="stroke-[2.5]" />
                    )}
                    {stat.trend === "down" && (
                      <TrendingDown size={11} className="stroke-[2.5]" />
                    )}
                    {stat.trend === "neutral" && (
                      <Minus size={11} className="stroke-[2.5]" />
                    )}
                    <span className="truncate max-w-[85px] sm:max-w-none">
                      {stat.trendValue}
                    </span>
                  </div>
                )}

                <ArrowUpRight
                  size={14}
                  className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
                />
              </div>
            </div>

            {/* Middle: Number & Title */}
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {stat.value}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                {stat.label}
              </p>
            </div>

            {/* Bottom: Subtitle / Context */}
            {stat.trendLabel && (
              <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between">
                <span className="truncate">{stat.trendLabel}</span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
