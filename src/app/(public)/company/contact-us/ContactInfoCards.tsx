"use client";

import { MapPin, Mail, Phone } from "lucide-react";
import type { PublicSettings } from "@/lib/public-settings";

function InfoCard({
  icon,
  iconClass,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group flex items-start gap-6 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner transition-colors duration-300 ${iconClass}`}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

/**
 * Left column: contact info cards + map. Extracted from contact-us page.
 */
export default function ContactInfoCards({
  settings,
}: {
  settings: PublicSettings;
}) {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Contact Information
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed max-w-md">
          We&apos;re here to help. Reach out to us via phone, email, or visit
          our office for a coffee and a chat.
        </p>
      </div>

      <div className="space-y-6">
        <InfoCard
          icon={<MapPin className="w-7 h-7" />}
          iconClass="bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
          title="Our Office Address"
        >
          <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
            {settings.contact_address}
          </p>
        </InfoCard>

        <InfoCard
          icon={<Mail className="w-7 h-7" />}
          iconClass="bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white"
          title="Email Us"
        >
          <a
            href={`mailto:${settings.contact_email}`}
            className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors block"
          >
            {settings.contact_email}
          </a>
        </InfoCard>

        <InfoCard
          icon={<Phone className="w-7 h-7" />}
          iconClass="bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white"
          title="Call Us"
        >
          <a
            href={`tel:${settings.contact_phone}`}
            className="text-gray-600 hover:text-blue-600 font-medium text-base transition-colors block"
          >
            {settings.contact_phone}
          </a>
        </InfoCard>
      </div>

      <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-gray-100">
        <iframe
          src={settings.integration_google_maps_embed}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full object-cover"
        ></iframe>
      </div>
    </div>
  );
}
