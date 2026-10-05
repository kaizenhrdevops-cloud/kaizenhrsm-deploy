"use client";

import { useState, useEffect } from "react";
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
  addMonths,
  subMonths,
  setHours,
  setMinutes,
  getDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  Sparkles,
  AlertCircle,
  Check,
} from "lucide-react";

type DateTimePickerProps = {
  value: string; // ISO string or datetime-local string
  onChange: (value: string) => void;
  minDate?: Date;
};

// Formats a Date into standard "YYYY-MM-DDTHH:mm" for internal sync
function toLocalDatetimeString(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const COMMON_MINUTE_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const QUICK_TIME_PRESETS = [
  { label: "10:00 AM", h: 10, m: 0 },
  { label: "02:00 PM", h: 14, m: 0 },
  { label: "05:00 PM", h: 17, m: 0 },
  { label: "10:00 PM", h: 22, m: 0 },
  { label: "11:00 PM", h: 23, m: 0 },
];

export default function DateTimePicker({
  value,
  onChange,
  minDate = new Date(),
}: DateTimePickerProps) {
  // Parse incoming value or fallback to today at 10 PM
  const parseInitialDate = () => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    const fallback = new Date();
    fallback.setHours(22, 0, 0, 0);
    return fallback;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(parseInitialDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(selectedDate));

  // Sync state if external value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        setCurrentMonth(startOfMonth(d));
      }
    }
  }, [value]);

  const updateDateTime = (newDate: Date) => {
    setSelectedDate(newDate);
    onChange(toLocalDatetimeString(newDate));
  };

  // Date selection
  const handleSelectDay = (day: Date) => {
    const updated = new Date(selectedDate);
    updated.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    updateDateTime(updated);
  };

  // Time components
  const hours24 = selectedDate.getHours();
  const minutes = selectedDate.getMinutes();
  const isPM = hours24 >= 12;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  const handleHourChange = (new12Hour: number) => {
    let new24 = new12Hour % 12;
    if (isPM) new24 += 12;
    const updated = setHours(selectedDate, new24);
    updateDateTime(updated);
  };

  const handleMinuteChange = (newMin: number) => {
    const updated = setMinutes(selectedDate, Math.max(0, Math.min(59, newMin)));
    updateDateTime(updated);
  };

  const handleAmPmToggle = (targetIsPm: boolean) => {
    if (targetIsPm === isPM) return;
    let new24 = hours12 % 12;
    if (targetIsPm) new24 += 12;
    const updated = setHours(selectedDate, new24);
    updateDateTime(updated);
  };

  const handleQuickPresetTime = (h: number, m: number) => {
    let updated = setHours(selectedDate, h);
    updated = setMinutes(updated, m);
    updateDateTime(updated);
  };

  // Quick date shortcuts
  const handleQuickDate = (type: "today" | "tomorrow" | "friday" | "monday") => {
    const now = new Date();
    let target = new Date();
    if (type === "today") {
      target = now;
    } else if (type === "tomorrow") {
      target = addDays(now, 1);
    } else if (type === "friday") {
      const day = now.getDay();
      const diff = (5 - day + 7) % 7 || 7;
      target = addDays(now, diff);
    } else if (type === "monday") {
      const day = now.getDay();
      const diff = (1 - day + 7) % 7 || 7;
      target = addDays(now, diff);
    }
    const updated = new Date(selectedDate);
    updated.setFullYear(target.getFullYear(), target.getMonth(), target.getDate());
    setCurrentMonth(startOfMonth(target));
    updateDateTime(updated);
  };

  // Calendar grid calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday
  const todayStart = startOfDay(minDate);

  const isPastTime = selectedDate.getTime() <= Date.now();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Top Header & Timezone Indicator */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
          <CalendarIcon size={14} className="text-teal-600 dark:text-teal-400" />
          <span>Interactive Date &amp; Time Picker</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 font-medium text-[11px]">
          <span>🇲🇾</span>
          <span>Malaysia Time (MYT, GMT+8)</span>
        </span>
      </div>

      {/* Quick Date Shortcuts Bar */}
      <div className="px-4 pt-3 flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/50 pb-3">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
          Quick Date:
        </span>
        <button
          type="button"
          onClick={() => handleQuickDate("today")}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
            isToday(selectedDate)
              ? "bg-teal-600 text-white border-teal-600 shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => handleQuickDate("tomorrow")}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
            isSameDay(selectedDate, addDays(new Date(), 1))
              ? "bg-teal-600 text-white border-teal-600 shadow-xs"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          Tomorrow
        </button>
        <button
          type="button"
          onClick={() => handleQuickDate("friday")}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          This Friday
        </button>
        <button
          type="button"
          onClick={() => handleQuickDate("monday")}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          Next Monday
        </button>
      </div>

      {/* Main Grid: Left = Calendar, Right = Time Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
        {/* LEFT COLUMN: Calendar View */}
        <div className="p-4">
          {/* Month / Year Navigator */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots before first day */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {daysInMonth.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isDayToday = isToday(day);
              const isPastDay = isBefore(day, todayStart);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isPastDay}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto rounded-lg text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-teal-600 text-white font-bold shadow-xs scale-105"
                      : isPastDay
                      ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                      : isDayToday
                      ? "border border-teal-500 text-teal-600 dark:text-teal-400 font-bold hover:bg-teal-50 dark:hover:bg-teal-950/30"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Time Controls */}
        <div className="p-4 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Select Time
              </span>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                {format(selectedDate, "hh:mm a")}
              </span>
            </div>

            {/* Big Interactive Time Display & Steppers */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-center gap-3">
              {/* Hour Dropdown / Spinner */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">
                  Hour
                </span>
                <select
                  value={hours12}
                  onChange={(e) => handleHourChange(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-base font-bold text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xl font-bold text-slate-400 mt-3">:</span>

              {/* Minute Dropdown / Input */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">
                  Minute
                </span>
                <select
                  value={minutes}
                  onChange={(e) => handleMinuteChange(Number(e.target.value))}
                  className="px-2.5 py-1.5 text-base font-bold text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <option key={m} value={m}>
                      {m.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              {/* AM / PM Segmented Switcher */}
              <div className="flex flex-col items-center ml-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold mb-0.5">
                  Period
                </span>
                <div className="grid grid-cols-2 p-0.5 bg-slate-200 dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleAmPmToggle(false)}
                    className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      !isPM
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmPmToggle(true)}
                    className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      isPM
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Time Presets */}
            <div className="mt-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Popular Send Times:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TIME_PRESETS.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => handleQuickPresetTime(t.h, t.m)}
                    className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-teal-300 border border-transparent hover:border-teal-200 dark:hover:border-teal-800 transition-colors cursor-pointer"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Time Confirmation / Warning Footer */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPastTime ? (
            <AlertCircle size={15} className="text-amber-500 shrink-0" />
          ) : (
            <Check size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
          )}
          <div>
            <span className="text-slate-500 dark:text-slate-400">Scheduled for: </span>
            <strong className="text-slate-900 dark:text-white font-semibold">
              {format(selectedDate, "EEEE, MMMM d, yyyy 'at' hh:mm a")} (MYT)
            </strong>
          </div>
        </div>

        {isPastTime && (
          <span className="text-amber-600 dark:text-amber-400 font-medium text-[11px]">
            Selected time is in the past!
          </span>
        )}
      </div>
    </div>
  );
}
