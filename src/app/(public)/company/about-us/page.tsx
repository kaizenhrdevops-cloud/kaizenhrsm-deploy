import React from "react";
// CHANGED: Award icon added (works fine in a server component)
import { Award } from "lucide-react";
import Container from "@/components/layout/Container";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";

import {
  typeBody,
  typeDisplay,
  typeH2,
  typeLead,
} from "@/components/ui/typography";
import { getPublicSettings } from "@/lib/public-settings";

const AboutUs = async () => {
  // Fetch settings on the server
  const settings = await getPublicSettings();

  // Calculate years of experience
  // Default to 1997 if not set
  // CHANGED: "|| 1997" so a bad value can't render "NaN" in the big stat below
  const foundingYear =
    parseInt(settings.company_founding_year || "1997") || 1997;
  const currentYear = new Date().getFullYear();
  const yearsExperience = currentYear - foundingYear;

  // CHANGED: stats strip. Every number comes from the existing copy
  // (years from the founding year, "more than 20 modules", the award).
  const stats = [
    { value: `${yearsExperience}+`, label: "years in HR technology" },
    { value: "20+", label: "fully integrated modules" },
    { value: "MSC-APICTA", label: "Best Software Applications award winner" },
  ];

  return (
    // CHANGED: page background is brand #F8FAFB
    <div className="min-h-screen bg-[#F8FAFB]">
      <Navbar />

      <main>
        {/* CHANGED: Hero now matches the contact-us page: brand teal #008080
            with a soft #1853E9 glow, white text. Gradient is inline style so
            the radial syntax can't be mangled by Tailwind. */}
        <div
          className="relative overflow-hidden text-white"
          style={{
            backgroundImage:
              "radial-gradient(60% 90% at 90% 0%, rgba(24,83,233,0.45) 0%, transparent 60%), linear-gradient(135deg, #005c5c 0%, #008080 55%, #12a3a0 100%)",
          }}
        >
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
          {/* CHANGED: centering math with the 80px fixed navbar. The image
              below overlaps the hero by 96px (-mt-24), so
              pt - pb = 80px - 96px = -16px -> pt 144px / pb 160px.
              If you change the overlap, keep pt - pb = 80px - overlap. */}
          <Container className="relative pb-40 pt-[calc(80px+4rem)] text-center">
            <h1 className={`${typeDisplay} text-white`}>About Us</h1>
            <p className={`mx-auto mt-6 max-w-3xl text-white/85 ${typeLead}`}>
              From a pioneering idea to Malaysia’s most comprehensive HR
              solution.
            </p>
          </Container>
        </div>

        {/* CHANGED: team image moved out of the hero and now overlaps the
            bottom of it, with a white border instead of the plain shadow.
            Stats strip sits right under it. */}
        <Container className="relative z-10 -mt-24">
          <div className="mx-auto max-w-5xl">
            <div className="relative h-64 overflow-hidden rounded-3xl border-4 border-white shadow-2xl ring-1 ring-[#F1F5FA] md:h-[26rem]">
              <Image
                src="/images/hrsm-modules/mobile_app.png"
                alt="Kaizen HRMS Team collaborating"
                fill
                priority
                sizes="(min-width: 1024px) 1024px, 100vw"
                className="object-cover"
              />
            </div>

            <div className="mt-8 grid grid-cols-1 divide-y divide-[#F1F5FA] rounded-2xl border border-[#F1F5FA] bg-white shadow-sm md:grid-cols-3 md:divide-x md:divide-y-0">
              {stats.map((stat) => (
                <div key={stat.label} className="p-6 md:p-8">
                  <p className="text-3xl font-bold text-[#008080] md:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>

        {/* CHANGED: Content section is now two columns on desktop: a sticky
            "Our story" heading on the left, and a narrower reading column on
            the right (the old max-w-4xl made lines too long to read). */}
        <div className="py-16 lg:py-24">
          <Container>
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <h2 className={`${typeH2} text-gray-900 lg:sticky lg:top-28`}>
                  Our story
                </h2>
              </div>

              <div
                className={`space-y-6 text-gray-700 lg:col-span-8 ${typeBody}`}
              >
                <p>
                  Established in {foundingYear}, kaizen HRMS has been a trusted
                  name in HR technology for over {yearsExperience} years,
                  embedding best practices into every module we deliver. We
                  began with a clear mission: to simplify HR with a foundational
                  suite of Payroll, Personnel, Leave, and Claims modules. From
                  the outset, we understood the importance of precision,
                  compliance, and user-friendly design, empowering HR
                  professionals to focus on people, not paperwork.
                </p>
                <p>
                  Today, our vision has grown into a comprehensive platform of
                  more than 20 fully integrated modules, spanning Core HR,
                  Compensation & Benefits, Strategic HR Management, and advanced
                  innovations like Business Analytics. This expansion reflects
                  our commitment to keeping pace with evolving business needs
                  while shaping the future of HR.
                </p>

                {/* CHANGED: award callout uses brand teal and an icon instead
                    of the blue-600 left border + blue-50 background */}
                <div className="my-10 flex items-start gap-4 rounded-2xl border border-[#008080]/20 bg-[#008080]/5 p-6">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#008080] text-white">
                    <Award className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-gray-900">
                    Kaizen HRMS is proud to be the only Malaysian HR solution
                    nominated twice consecutively and ultimately winning the
                    prestigious MSC-APICTA Award for Best Software Applications,
                    a recognition that underscores our product strength,
                    innovation, and industry relevance.
                  </p>
                </div>

                <p>
                  With nearly{" "}
                  {yearsExperience > 25
                    ? "three decades"
                    : `${yearsExperience} years`}{" "}
                  of proven excellence, kaizen HRMS is widely recognized as{" "}
                  {settings.company_slogan ||
                    "Malaysia’s Tier 1 Enterprise HR Solution"}
                  , helping leading organizations across industries build
                  smarter, more productive, and engaged workforces.
                </p>
              </div>
            </div>
          </Container>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
