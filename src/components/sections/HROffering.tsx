// src/components/sections/HROffering.tsx
import React from "react";
import Link from "next/link";
import { Layers, ArrowRight, FileDown } from "lucide-react";
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
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-teal-500/15 text-teal-200 border border-teal-400/25 backdrop-blur-sm mb-4 shadow-sm">
            <Layers className="w-3.5 h-3.5 text-teal-300" />
            <span>Enterprise HR Platform</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white mb-4">
            One Unified Platform,{" "}
            <span className="text-teal-200">Every HR Need Covered.</span>
          </h2>

          <p className="text-base sm:text-lg text-teal-100/80 leading-relaxed max-w-2xl mx-auto">
            Explore 20+ specialized modules designed to manage your entire employee lifecycle with precision and Malaysian regulatory compliance.
          </p>
        </div>

        {/* Module grid */}
        <DetailedFeatures />

        {/* Closing CTAs */}
        <div className="mt-12 lg:mt-16 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/company/contact-us"
            className="group inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 px-7 py-3.5 rounded-full font-semibold transition-all duration-200 shadow-lg shadow-black/15 hover:shadow-xl hover:-translate-y-0.5"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <a
            href="/Module%20Brochure%20Kaizen%20REV.2.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white px-7 py-3.5 rounded-full font-medium transition-all duration-200 backdrop-blur-sm"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Brochure</span>
          </a>
        </div>
      </Container>
    </section>
  );
};

export default HROffering;
