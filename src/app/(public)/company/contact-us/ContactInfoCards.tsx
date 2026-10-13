"use client";

// CHANGED: ArrowUpRight added; typeH3 import removed (no longer used)
import { MapPin, Mail, Phone, ArrowUpRight } from "lucide-react";
import type { PublicSettings } from "@/lib/public-settings";
import { typeBody, typeH2, typeLead } from "@/components/ui/typography";

// CHANGED: whole card is now a link (maps / mailto / tel). Icons all use the
// brand teal #008080 instead of blue/green/purple. Small teal title on top,
// the actual value is the dark, larger text so it scans first.
function InfoCard({
  icon,
  title,
  href,
  external,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-5 rounded-2xl border border-[#F1F5FA] bg-white p-5 shadow-sm transition-all duration-300 hover:border-[#008080]/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008080]"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#008080]/10 text-[#008080] transition-colors duration-300 group-hover:bg-[#008080] group-hover:text-white">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-sm font-semibold text-[#008080]">{title}</p>
        <div className={`${typeBody} break-words font-medium text-gray-900`}>
          {children}
        </div>
      </div>
      <ArrowUpRight className="h-5 w-5 flex-shrink-0 text-gray-300 transition-colors duration-300 group-hover:text-[#008080]" />
    </a>
  );
}

/**
 * Left column: heading + contact info cards.
 * CHANGED: the map is no longer in here. It moved to <ContactMap /> below so
 * it can sit full-width under the form.
 */
export default function ContactInfoCards({
  settings,
}: {
  settings: PublicSettings;
}) {
  // CHANGED: address card opens Google Maps search for the address
  const address = settings.contact_address ?? "";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address.replace(/\n/g, " "),
  )}`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className={`${typeH2} mb-4 text-gray-900`}>Contact Information</h2>
        <p className={`${typeLead} max-w-md text-gray-600`}>
          We&apos;re here to help. Reach out to us via phone, email, or visit
          our office for a coffee and a chat.
        </p>
      </div>

      <div className="space-y-4">
        <InfoCard
          icon={<MapPin className="h-6 w-6" />}
          title="Our Office Address"
          href={mapsUrl}
          external
        >
          <span className="whitespace-pre-line font-normal text-gray-700">
            {settings.contact_address}
          </span>
        </InfoCard>

        <InfoCard
          icon={<Mail className="h-6 w-6" />}
          title="Email Us"
          href={`mailto:${settings.contact_email}`}
        >
          {settings.contact_email}
        </InfoCard>

        <InfoCard
          icon={<Phone className="h-6 w-6" />}
          title="Call Us"
          href={`tel:${settings.contact_phone}`}
        >
          {settings.contact_phone}
        </InfoCard>
      </div>
    </div>
  );
}

// CHANGED: new named export. Map is now its own full-width block.
export function ContactMap({ settings }: { settings: PublicSettings }) {
  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-3xl border border-[#F1F5FA] bg-[#F1F5FA] shadow-lg md:h-[420px]">
      <iframe
        title="KaiZenHR office location"
        src={settings.integration_google_maps_embed}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen={true}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full"
      ></iframe>
    </div>
  );
}
