// src/components/sections/Trial.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "../layout/Container";
import { Check, ArrowRight } from "lucide-react";
import { getPublicSettings } from "@/lib/public-settings";

const Trial = async () => {
  const settings = await getPublicSettings();
  const imageSrc =
    settings.marketing_trial_image || "/images/hrsm-modules/personnel_hub.png";

  return (
    <div className="py-24 bg-white overflow-hidden">
      <Container>
        {/* Adjusted gap-8 to bring image closer to text */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Column: Text Content */}
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-extrabold text-blue-600 tracking-tight leading-tight">
                Don’t Just Settle for a Demo —{" "}
                <br className="hidden xl:block" />
                <span className="text-slate-900">
                  Experience the Difference!
                </span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                While most vendors only show you a glimpse, we let you truly
                experience our HR solution with a{" "}
                <span className="font-semibold text-slate-900">
                  risk-free, 3-month trial
                </span>
                . No commitment, full support, and complete guidance included.
              </p>
            </div>

            {/* Interactive Checklist */}
            <div className="space-y-2">
              {[
                "Use your own data",
                "Run a full Payroll UAT",
                "See real results, not just promises",
              ].map((item, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-4 p-3 -ml-3 rounded-xl hover:bg-blue-50/50 transition-all duration-300 cursor-default"
                >
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Check className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <span className="text-lg text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Content & CTA */}
            <div className="space-y-5 pt-4 border-t border-slate-100">
              <p className="text-slate-600 leading-relaxed">
                We are confident our solution will deliver exactly what your
                business needs. After all, choosing the right HR system is a{" "}
                <span className="font-bold text-slate-900">
                  long-term investment in your people, not just a cost.
                </span>
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-slate-800 font-medium">
                  Why guess when you can be sure?
                </span>
                <Link
                  href="/company/contact-us"
                  className="group inline-flex items-center gap-1 text-blue-600 font-bold text-lg hover:text-blue-700 transition-colors"
                >
                  <span>Start your free trial today</span>
                  <ArrowRight className="w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Image Area */}
          <div className="relative flex justify-center lg:pl-12">
            <div className="relative w-full max-w-md">
              <Image
                src={imageSrc}
                alt="HR Team Collaboration"
                width={800}
                height={600}
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Trial;
