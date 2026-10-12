// src/components/sections/HROffering.tsx
import React from "react";
import Container from "../layout/Container";
import { typeH2, typeLead } from "../ui/typography";
import DetailedFeatures from "./DetailedFeatures";

const HROffering = () => {
  return (
    <section className="relative py-24 lg:py-32 bg-gradient-to-b from-[#005c5c] via-[#004a4a] to-[#003d3d] text-white overflow-hidden">
      {/* Single soft top-edge glow for depth — not centered blobs */}
      <div
        aria-hidden="true"
        className="absolute -top-24 left-0 right-0 h-48 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none"
      />

      <Container className="relative z-10">
        {/* Header block — matches the site's light/bold weight convention */}
        <div className="text-center mb-14 lg:mb-20">
          <h2 className={`${typeH2} text-white mb-3`}>
            Our Comprehensive HR Offering
          </h2>
          <div className="w-16 h-[3px] bg-yellow-400 mx-auto mb-5 rounded-full" />
          <p className={`${typeLead} text-white/70 max-w-xl mx-auto`}>
            Complete HR modules designed to streamline your workforce management
          </p>
        </div>

        {/* Module grid */}
        <DetailedFeatures />
      </Container>
    </section>
  );
};

export default HROffering;
