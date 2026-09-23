// src/components/sections/HROffering.tsx
import React from "react";
import Container from "../layout/Container";
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
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-light tracking-tight text-white leading-tight mb-3">
            Our Comprehensive{" "}
            <span className="font-semibold">HR Offering</span>
          </h2>
          <div className="w-16 h-[3px] bg-yellow-400 mx-auto mb-5 rounded-full" />
          <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed">
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
