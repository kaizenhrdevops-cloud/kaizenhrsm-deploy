// src/app/(public)/company/contact-us/page.tsx
"use client";

import React, { useState } from "react";
import { CheckCircle, AlertCircle, Send } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { PublicSettings } from "@/lib/public-settings";
import { useSettings } from "@/components/layout/SettingsProvider";
// CHANGED: also import the new ContactMap export
import ContactInfoCards, { ContactMap } from "./ContactInfoCards";
import ContactForm, { type SubmitStatus } from "./ContactForm";
import {
  typeBody,
  typeDisplay,
  typeH2,
  typeLead,
} from "@/components/ui/typography";

const ContactUsPage = () => {
  // Settings come from (public)/layout's provider (one cached read per
  // request) with local fallbacks — no own fetch.
  const ctx = useSettings();
  const [settings] = useState<PublicSettings>({
    contact_address:
      "Suite D-05-01, 5th Floor, Block D,\nPlaza Mont Kiara,\n50480 Kuala Lumpur, Malaysia",
    contact_email: "inquiry@kaizenhrms.com",
    contact_phone: "+603-62010242",
    integration_google_maps_embed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.72930091868!2d101.64939557528581!3d3.165847553049145!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc48f1965b1f3f%3A0xd37a5feb10a562f9!2sKaiZenHR%20Sdn%20Bhd!5e0!3m2!1sen!2smy!4v1763520954012!5m2!1sen!2smy",
    ...ctx,
  });

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>({
    type: null,
    message: "",
  });

  return (
    // CHANGED: page background is now brand #F8FAFB
    <div className="min-h-screen bg-[#F8FAFB]">
      <Navbar />

      <main>
        {/* CHANGED: Hero uses brand teal (#008080) with a soft #1853E9 glow in
            the top-right, instead of blue-900 -> teal. Gradient is inline
            style so the rgba/radial syntax can't be mangled by Tailwind. */}
        <div
          className="relative overflow-hidden text-white"
          style={{
            backgroundImage:
              "radial-gradient(60% 90% at 90% 0%, rgba(24,83,233,0.45) 0%, transparent 60%), linear-gradient(135deg, #005c5c 0%, #008080 55%, #12a3a0 100%)",
          }}
        >
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
          {/* CHANGED: centering math with the 80px fixed navbar.
              Below lg (no overlap): pt = pb + 80px  -> pt 144 / pb 64.
              At lg the form card overlaps the hero by 64px (lg:-mt-32 on the
              card minus the 64px top padding of the content area), so
              pt = pb + (80 - 64) -> pt 144 / pb 128 (lg:pb-32).
              If you change the overlap, keep pt - pb = 80px - overlap. */}
          <div className="relative mx-auto flex min-h-[400px] max-w-7xl flex-col items-center justify-center px-4 pb-16 pt-[calc(80px+4rem)] text-center sm:px-6 md:min-h-[460px] lg:px-8 lg:pb-32">
            <h1 className={`${typeDisplay} mb-6`}>
              Let&apos;s Start a Conversation
            </h1>
            <p className={`${typeLead} max-w-3xl text-white/85`}>
              Whether you have questions about our modules or need a custom
              solution, our team is ready to help you transform your HR.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-16 lg:px-8">
          {/* CHANGED: status message moved INTO the form card (see below), so
              the whole page no longer jumps down after submitting. */}

          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16">
            {/* CHANGED: sticky moved from the form to the info column. The
                form is the taller side, so the info stays in view while the
                visitor scrolls down the form. */}
            <div className="lg:sticky lg:top-28">
              <ContactInfoCards settings={settings} />
            </div>

            {/* CHANGED: form card overlaps the hero on desktop (lg:-mt-32),
                plain white card, no purple/blue blur blobs. */}
            <div className="relative z-10 overflow-hidden rounded-3xl border border-[#F1F5FA] bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 md:p-10 lg:-mt-32">
              {/* CHANGED: compact left-aligned header (icon beside title)
                  so the card is shorter and fits a laptop screen better */}
              <div className="mb-8 flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#008080]/10 text-[#008080]">
                  <Send className="ml-0.5 h-5 w-5 -rotate-12" />
                </div>
                <div>
                  <h2 className={`${typeH2} mb-1 text-gray-900`}>
                    Send Us a Message
                  </h2>
                  <p className={`${typeBody} text-gray-600`}>
                    Fill out the form below and we&apos;ll get back to you
                    shortly.
                  </p>
                </div>
              </div>

              {/* CHANGED: status message now lives in the card; success uses
                  brand teal instead of green */}
              {submitStatus.type && (
                <div
                  role={submitStatus.type === "success" ? "status" : "alert"}
                  className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
                    submitStatus.type === "success"
                      ? "border-[#008080]/30 bg-[#008080]/10"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  {submitStatus.type === "success" ? (
                    <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#008080]" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
                  )}
                  <p
                    className={`${typeBody} font-medium ${
                      submitStatus.type === "success"
                        ? "text-[#006060]"
                        : "text-red-800"
                    }`}
                  >
                    {submitStatus.message}
                  </p>
                </div>
              )}

              <ContactForm onStatus={setSubmitStatus} />
            </div>
          </div>

          {/* CHANGED: map is now full-width under both columns */}
          <div className="mt-16 md:mt-20">
            <ContactMap settings={settings} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUsPage;
