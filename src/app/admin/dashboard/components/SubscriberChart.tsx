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
import { TrendingUp, Users, Calendar } from "lucide-react";

type ChartData = {
  date: string;
  count: number;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-[#0B132B]/95 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/80 shadow-xl rounded-xl px-3 py-2 text-xs backdrop-blur-md">
        <p className="font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-blue-600 dark:text-blue-400 font-bold text-sm mt-0.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          {payload[0].value.toLocaleString()}{" "}
          <span className="font-normal text-xs text-slate-500 dark:text-slate-400">
            subscribers
          </span>
        </p>
      </div>
    );
  }
  return null;
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

  const currentCount = data && data.length > 0 ? data[data.length - 1].count : 0;
  const initialCount = data && data.length > 0 ? data[0].count : 0;
  const netGrowth = currentCount - initialCount;

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-[#111A2E]/85 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-sm p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
            Subscriber Growth
          </h3>
        </div>
        <div className="h-[220px] sm:h-[280px] w-full animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111A2E]/85 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-sm p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
            Subscriber Growth
          </h3>
        </div>
        <div className="h-[220px] sm:h-[280px] w-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
          <Users size={32} className="text-slate-300 dark:text-slate-600" />
          <p>No subscriber data recorded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111A2E]/85 backdrop-blur-sm rounded-2xl border border-slate-200/80 dark:border-slate-800/90 shadow-sm p-4 sm:p-6 transition-all">
      {/* Header with Title + Net Growth Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
              Subscriber Growth
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
              <Calendar size={11} />
              Last 30 Days
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cumulative verified active subscribers over time
          </p>
        </div>

        {/* Growth badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <TrendingUp size={13} />
            <span>
              {netGrowth >= 0 ? `+${netGrowth}` : netGrowth} net (30d)
            </span>
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="w-full min-w-0 overflow-hidden">
        <ResponsiveContainer
          width="100%"
          height={isMobile ? 220 : 280}
          minWidth={0}
          debounce={50}
        >
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: isMobile ? -25 : -15,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="subscriberGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#64748b"
              strokeOpacity={0.15}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: isMobile ? 10 : 11 }}
              tickMargin={8}
              interval={isMobile ? 5 : "preserveStartEnd"}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: isMobile ? 10 : 11 }}
              allowDecimals={false}
              width={isMobile ? 35 : 45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#subscriberGradient)"
              activeDot={{
                r: 5,
                fill: "#3b82f6",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
