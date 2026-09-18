// src/components/sections/AwardClient.tsx
"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Container from "../layout/Container";

interface AwardClientProps {
  image1: string;
  image2: string;
}

const AwardClient = ({ image1, image2 }: AwardClientProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const images = [image1, image2];

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="py-20 lg:py-32 bg-white">
      <Container>
        {/* Mobile Carousel - Only visible on mobile */}
        <div className="lg:hidden mb-12 relative overflow-hidden rounded-lg">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {images.map((img, index) => (
              <div key={index} className="w-full flex-shrink-0">
                <div className="relative mx-auto max-w-sm aspect-[3/4] bg-slate-50 rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={img}
                    alt={`Award ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 384px"
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentSlide === index ? "bg-slate-900 w-8" : "bg-slate-300"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-20">
          {/* Left Image - Hidden on mobile */}
          <div className="hidden lg:flex w-64 h-80 items-center justify-center flex-shrink-0">
            <div className="relative w-full h-full bg-slate-50 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={image1}
                alt="msc_apicta logo"
                fill
                sizes="256px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Center Content */}
          <div className="max-w-2xl flex-1">
            <div className="inline-block px-5 py-2 mb-8 text-xs font-semibold tracking-widest text-slate-700 uppercase bg-slate-100 rounded">
              Award Winning Excellence
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-slate-900 mb-8 tracking-tight leading-tight">
              MSC-APICTA Malaysia <br className="hidden md:block" />
              <span className="font-semibold text-slate-900">Award Winner</span>
            </h2>

            <div className="space-y-6 text-slate-600 leading-relaxed">
              <p className="text-lg md:text-xl">
                KaiZen stands as the only HR solution in Malaysia to be
                nominated twice in consecutive years and ultimately crowned{" "}
                <span className="font-semibold text-slate-900">WINNER</span> of
                the prestigious MSC-APICTA Malaysia Award for Best Software
                Applications category.
              </p>

              <p className="text-base md:text-lg">
                This rare distinction reflects not only the unmatched strength
                of our product, but also its relevance, innovation, and enduring
                impact within the HR technology industry.
              </p>
            </div>
          </div>

          {/* Right Image - Hidden on mobile */}
          <div className="hidden lg:flex w-80 h-96 items-center justify-center flex-shrink-0">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-slate-100 rounded transform rotate-3"></div>
              <div className="relative w-full h-full rounded shadow-xl overflow-hidden">
                <Image
                  src={image2}
                  alt="msc_apicta award brochure"
                  fill
                  sizes="320px"
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AwardClient;
