"use client";
import React, { useState, useEffect } from "react";
import Container from "../layout/Container";
import { typeBody, typeDisplay, typeH3 } from "../ui/typography";
import { Smartphone, Building2, Globe } from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "28 Years Experience",
    description:
      "Award-winning HR solution with decades of expertise and proven track record in the market",
    gradient: "from-blue-600 to-indigo-700",
  },
  {
    icon: Globe,
    title: "Tier 1 Enterprise App",
    description:
      "Total HR Solutions for your Global Workforce management needs across different regions",
    gradient: "from-emerald-600 to-teal-700",
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    description:
      "Access your HR services anytime, anywhere with our intuitive mobile application",
    gradient: "from-violet-600 to-purple-700",
  },
];

const WhyChooseKaizen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }
    if (isRightSwipe) {
      setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-slate-50 to-white">
      <Container>
        <div className="text-center mb-16 lg:mb-20">
          <h2 className={`${typeDisplay} text-slate-900 mb-4`}>
            Why Choose Kaizen?
          </h2>
          <div className="w-24 h-1 bg-slate-900 mx-auto"></div>
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden relative">
          <div
            className="overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-100">
                      <div
                        className={`bg-gradient-to-br ${feature.gradient} rounded-2xl p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center`}
                      >
                        <Icon
                          size={40}
                          className="text-white"
                          strokeWidth={1.5}
                        />
                      </div>
                      <h3 className={`${typeH3} text-slate-900 mb-4`}>
                        {feature.title}
                      </h3>
                      <p className={`${typeBody} text-slate-600`}>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === index
                    ? "bg-slate-900 w-8"
                    : "bg-slate-300 w-2"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:grid grid-cols-1 md:grid-cols-3 gap-8 xl:gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-xl p-10 border border-slate-100 hover:border-slate-200 transition-all duration-300 hover:shadow-xl"
              >
                <div
                  className={`bg-gradient-to-br ${feature.gradient} rounded-2xl p-7 w-28 h-28 mx-auto mb-8 flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}
                >
                  <Icon size={48} className="text-white" strokeWidth={1.5} />
                </div>
                <h3 className={`${typeH3} text-slate-900 mb-4 text-center`}>
                  {feature.title}
                </h3>
                <p className={`${typeBody} text-slate-600 text-center`}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default WhyChooseKaizen;
