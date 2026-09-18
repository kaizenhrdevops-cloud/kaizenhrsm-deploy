"use client";

import Button from "./Button";
import { cn } from "@/lib/utils";

export type PageItem = number | "dots";

/**
 * Build the 1..N page list with ellipsis (same algorithm the
 * developments page hand-rolled). Centralized so all 6 paginations
 * behave identically.
 */
export function getPageItems(
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): PageItem[] {
  const totalNumbers = siblingCount + 5;
  if (totalNumbers >= totalPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const left = Math.max(currentPage - siblingCount, 1);
  const right = Math.min(currentPage + siblingCount, totalPages);
  const showLeftDots = left > 2;
  const showRightDots = right < totalPages - 2;

  if (!showLeftDots && showRightDots) {
    const leftRange = Array.from({ length: 3 + 2 * siblingCount }, (_, i) => i + 1);
    return [...leftRange, "dots", totalPages];
  }
  if (showLeftDots && !showRightDots) {
    const rightRange = Array.from(
      { length: 3 + 2 * siblingCount },
      (_, i) => totalPages - (3 + 2 * siblingCount) + 1 + i
    );
    return [1, "dots", ...rightRange];
  }
  const middle = Array.from({ length: right - left + 1 }, (_, i) => left + i);
  return [1, "dots", ...middle, "dots", totalPages];
}

/**
 * Shared pagination with always-visible colors (dark text on white,
 * blue active page). Replaces the 6 hand-rolled copies — one of which
 * shipped near-invisible text on white background.
 */
export default function Pagination({
  currentPage,
  totalPages,
  onChange,
  className = "",
}: {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  const items = getPageItems(currentPage, totalPages);

  return (
    <div className={cn("flex justify-center items-center gap-2", className)}>
      <Button
        disabled={currentPage === 1}
        onClick={() => onChange(Math.max(1, currentPage - 1))}
      >
        Previous
      </Button>

      <div className="flex gap-2">
        {items.map((item, i) =>
          item === "dots" ? (
            <span key={`dots-${i}`} className="px-2 py-2 text-gray-400">
              ...
            </span>
          ) : (
            <Button
              key={item}
              variant={currentPage === item ? "primary" : "secondary"}
              onClick={() => onChange(item)}
            >
              {item}
            </Button>
          )
        )}
      </div>

      <Button
        disabled={currentPage === totalPages}
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
      >
        Next
      </Button>
    </div>
  );
}
