// src/app/(public)/company/contact-us/page.tsx
"use client";

import React, { useState } from "react";
import { CheckCircle, AlertCircle, Send } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { PublicSettings } from "@/lib/public-settings";
import { useSettings } from "@/components/layout/SettingsProvider";
import ContactInfoCards from "./ContactInfoCards";
import ContactForm, { type SubmitStatus } from "./ContactForm";

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
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-[#008080] text-white">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
              Let&apos;s Start a Conversation
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
              Whether you have questions about our modules or need a custom
              solution, our team is ready to help you transform your HR.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          {/* Status Message */}
          {submitStatus.type && (
            <div
              className={`mb-10 p-4 rounded-xl flex items-start gap-3 shadow-sm ${
                submitStatus.type === "success"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              {submitStatus.type === "success" ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-base font-medium ${
                  submitStatus.type === "success"
                    ? "text-green-800"
                    : "text-red-800"
                }`}
              >
                {submitStatus.message}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Column: Contact Info & Map */}
            <ContactInfoCards settings={settings} />

            {/* Right Column: Contact Form */}
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 relative overflow-hidden lg:sticky lg:top-32">
              {/* Decorative background blur */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none opacity-50"></div>

              <div className="relative">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-sm">
                    <Send className="w-10 h-10 transform -rotate-12 ml-1" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
                    Send Us a Message
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Fill out the form below and we&apos;ll get back to you
                    shortly.
                  </p>
                </div>

                <ContactForm onStatus={setSubmitStatus} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUsPage;
