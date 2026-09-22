// src/app/admin/dashboard/components/SubscriberChart.tsx
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";

type ChartData = {
  date: string;
  count: number;
};

export default function SubscriberChart({ data }: { data: ChartData[] }) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">
          Subscriber Growth
        </h3>
        <div className="h-[300px] w-full animate-pulse bg-slate-100 dark:bg-slate-700/50 rounded-lg" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">
          Subscriber Growth
        </h3>
        <div className="h-[300px] w-full flex items-center justify-center text-slate-400 text-sm">
          No subscriber data yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-6">
      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 sm:mb-6">
        Subscriber Growth
      </h3>
      <div className="w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 300} minWidth={0} debounce={50}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: isMobile ? 10 : 12 }}
              tickMargin={10}
              interval={isMobile ? 4 : "preserveStartEnd"}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              width={isMobile ? 30 : 60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ color: "#3b82f6", fontWeight: 600 }}
              labelStyle={{
                color: "#0f172a",
                fontWeight: 600,
                marginBottom: "4px",
              }}
              cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
