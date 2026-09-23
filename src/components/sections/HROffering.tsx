// src/components/sections/HROffering.tsx
import React from "react";
import Container from "../layout/Container";
import DetailedFeatures from "./DetailedFeatures";

const HROffering = () => {
  return (
    <section className="relative py-20 lg:py-28 bg-[#004747] text-white overflow-hidden">
      {/* Architectural subtle grid pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.14] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_60%,transparent_100%)] pointer-events-none"
      />

      {/* Atmospheric vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[#003b3b] via-transparent to-[#003636] pointer-events-none"
      />

      <Container className="relative z-10">
        <div className="text-center mb-12 lg:mb-16 max-w-3xl mx-auto">
          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            Our Comprehensive HR Offering
          </h2>

          <p className="text-base sm:text-lg text-teal-100/90 leading-relaxed max-w-2xl mx-auto">
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
