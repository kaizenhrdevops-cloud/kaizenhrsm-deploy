// src/components/blog/StickySidebar.tsx
"use client";
import React, { useState } from "react";
import { Linkedin, Twitter, Mail, Link2, Check, ChevronRight } from "lucide-react";
import { typeH3, typeSmall } from "@/components/ui/typography";

type TOCItem = {
  id: string;
  text: string;
  level: number;
};

type StickySidebarProps = {
  toc: TOCItem[];
  activeSection: string;
  postTitle: string;
};

// ✅ FIX: Changed to a named export
export const StickySidebar = ({ toc, activeSection, postTitle }: StickySidebarProps) => {
  const [copiedLink, setCopiedLink] = useState(false);
  
  const sharePost = (platform: string) => {
    const url = window.location.href;
    const text = postTitle || "";

    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
        break;
      case "email":
        window.location.href = `mailto:?subject=${text}&body=${url}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        break;
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Social Share */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Share this post</h3>
        <div className="flex gap-3">
          <button
            onClick={() => sharePost("twitter")}
            className="p-3 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <Twitter size={20} className="text-gray-700" />
          </button>
          <button
            onClick={() => sharePost("linkedin")}
            className="p-3 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <Linkedin size={20} className="text-gray-700" />
          </button>
          <button
            onClick={() => sharePost("email")}
            className="p-3 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <Mail size={20} className="text-gray-700" />
          </button>
          <button
            onClick={() => sharePost("copy")}
            className="p-3 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            {copiedLink ? <Check size={20} className="text-green-600" /> : <Link2 size={20} className="text-gray-700" />}
          </button>
        </div>
      </div>

      {/* Table of Contents - Hidden on mobile */}
      {toc.length > 0 && (
        <div className="hidden lg:block bg-gray-50 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">In this article</h3>
          <nav className="space-y-2">
            {toc.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`block text-left text-sm hover:text-[#008080] transition-colors ${
                  item.level === 3 ? "pl-4" : ""
                } ${activeSection === item.id ? "text-[#008080] font-medium" : "text-gray-600"}`}
              >
                <ChevronRight size={14} className="inline mr-1" />
                {item.text}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* CTA Box */}
      <div className="bg-gradient-to-br from-[#008080] to-[#20b2aa] rounded-lg p-6 text-white">
        <h3 className={`${typeH3} mb-2`}>Need HR Solutions?</h3>
        <p className={`${typeSmall} mb-4 text-white/90`}>
          Transform your HR management with KaizenHR. Let's discuss how we can help.
        </p>
        <a
          href="/company/contact-us"
          className="inline-block w-full text-center bg-white text-[#008080] px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
        >
          Contact Us
        </a>
      </div>
    </div>
  );
};