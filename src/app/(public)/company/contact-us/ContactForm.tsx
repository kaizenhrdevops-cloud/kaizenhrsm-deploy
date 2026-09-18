"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { loadTurnstile } from "@/lib/turnstile-client";

export type SubmitStatus = {
  type: "success" | "error" | null;
  message: string;
};

const EMPTY_FORM = {
  fullName: "",
  contactNumber: "",
  company: "",
  email: "",
  companySize: "",
  message: "",
};

const inputClassName =
  "w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all duration-300 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm";

const COMPANY_SIZES = [
  { value: "1-50", label: "1-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1,000 employees" },
  { value: "1000-1500", label: "1,000-1,500 employees" },
  { value: "1501-2000", label: "1,501-2,000 employees" },
  { value: "2001-3000", label: "2,001-3,000 employees" },
  { value: "3000+", label: "3,000+ employees" },
];

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-800">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * Contact form with Turnstile + submit. Extracted from contact-us page.
 * Reports result up via onStatus so the page can show the banner.
 */
export default function ContactForm({
  onStatus,
}: {
  onStatus: (status: SubmitStatus) => void;
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Explicit widget render via the shared loader (one script tag app-wide).
  useEffect(() => {
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!sitekey) return;

    let cancelled = false;

    const renderWidget = () => {
      if (
        cancelled ||
        !window.turnstile ||
        !turnstileRef.current ||
        widgetIdRef.current ||
        !sitekey
      ) {
        return;
      }
      try {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey,
          callback: (token: string) => setCaptchaToken(token),
          "error-callback": () => {
            setCaptchaToken(null);
            onStatus({
              type: "error",
              message: "Captcha verification failed. Please try again.",
            });
          },
          "expired-callback": () => setCaptchaToken(null),
        });
      } catch {
        // Submit will surface an error if the widget is missing.
      }
    };

    void loadTurnstile().then(() => {
      // The shared loader may resolve just before window.turnstile lands.
      if (window.turnstile) {
        renderWidget();
        return;
      }
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        if (cancelled || window.turnstile || tries > 50) {
          clearInterval(timer);
          renderWidget();
        }
      }, 100);
    });

    return () => {
      cancelled = true;
      // Remove the widget on unmount so StrictMode / Fast Refresh remounts
      // don't keep a stale id ("Cannot find Widget cf-chl-widget-...").
      if (widgetIdRef.current && typeof window !== "undefined" && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore — widget may already be gone
        }
      }
      widgetIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onStatus({ type: null, message: "" });

    if (!captchaToken) {
      onStatus({
        type: "error",
        message: "Please complete the captcha verification",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData,
          captchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit form");
      }

      onStatus({
        type: "success",
        message:
          "Thank you! Your message has been sent successfully. We'll get back to you soon.",
      });

      setFormData(EMPTY_FORM);
      setCaptchaToken(null);

      // The token is single-use — reset the widget so the next submit
      // gets a fresh challenge instead of reusing an expired token.
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // ignore
        }
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: unknown) {
      onStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField label="Full Name" required>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className={inputClassName}
            placeholder="Enter your full name"
          />
        </FormField>
        <FormField label="Contact Number" required>
          <input
            type="tel"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className={inputClassName}
            placeholder="+60 12-345 6789"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <FormField label="Company" required>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className={inputClassName}
            placeholder="Your company name"
          />
        </FormField>
        <FormField label="Business Email" required>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className={inputClassName}
            placeholder="your.email@company.com"
          />
        </FormField>
      </div>

      <FormField label="Company Size" required>
        <div className="relative">
          <select
            name="companySize"
            value={formData.companySize}
            onChange={handleInputChange}
            required
            disabled={isSubmitting}
            className={`${inputClassName} appearance-none cursor-pointer`}
          >
            <option value="" disabled className="text-gray-400">
              Select company size
            </option>
            {COMPANY_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </FormField>

      <FormField label="Message">
        <textarea
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          rows={5}
          disabled={isSubmitting}
          className={inputClassName}
          placeholder="Tell us about your HR needs..."
        />
      </FormField>

      {/* Cloudflare Turnstile (visible, explicitly rendered) */}
      <div className="flex justify-center py-2">
        <div ref={turnstileRef}></div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !captchaToken}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none text-lg"
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Sending...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Send Message
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-6">
        By submitting, you agree to our{" "}
        <a href="#" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
