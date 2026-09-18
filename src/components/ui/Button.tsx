import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-blue-300",
  secondary:
    "border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 disabled:text-gray-400 disabled:bg-gray-100",
  danger:
    "bg-red-600 text-white font-medium hover:bg-red-700 disabled:bg-red-300",
  ghost: "text-gray-600 font-medium hover:bg-gray-100 hover:text-gray-900",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-sm rounded-md",
  lg: "px-6 py-3 text-base rounded-lg",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** When set, renders a Next.js Link with button styling. */
  href?: string;
};

/**
 * Shared button. Replaces the 67 hand-styled `px-4 py-2` buttons
 * scattered across admin + public pages.
 */
export default function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  href,
  title,
  "aria-label": ariaLabel,
  ...rest
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 transition-colors",
    "disabled:opacity-60 disabled:cursor-not-allowed",
    VARIANTS[variant],
    SIZES[size],
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        title={title}
        aria-label={ariaLabel}
        className={classes}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      title={title}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
