// src/components/sections/HeroVideoFacade.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface HeroVideoFacadeProps {
  rawUrlOrId: string;
}

function extractYouTubeId(input: string): string {
  if (!input) return "p4-USNtPYrY";
  const match = input.match(
    /(?:embed\/|v=|youtu\.be\/|\/v\/|^)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : input.trim() || "p4-USNtPYrY";
}

export default function HeroVideoFacade({ rawUrlOrId }: HeroVideoFacadeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [posterError, setPosterError] = useState(false);

  const videoId = extractYouTubeId(rawUrlOrId);
  const posterUrl = posterError
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  if (isPlaying) {
    return (
      <iframe
        className="w-full aspect-video rounded-2xl shadow-2xl"
        src={embedUrl}
        title="KaizenHR Dashboard Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  return (
    <div
      onClick={() => setIsPlaying(true)}
      className="group relative w-full aspect-video rounded-2xl shadow-2xl overflow-hidden cursor-pointer bg-slate-900 select-none transform transition-transform duration-300 hover:scale-[1.01]"
      role="button"
      tabIndex={0}
      aria-label="Play KaizenHR Overview Video"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsPlaying(true);
        }
      }}
    >
      {/* YouTube High-Res Poster with Fallback */}
      <Image
        src={posterUrl}
        alt="KaizenHR Product Overview Video Preview"
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        onError={() => setPosterError(true)}
      />

      {/* Subtle dark gradient overlay */}
      <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors duration-300" />

      {/* Centered Modern Play Button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-400 text-slate-900 flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:bg-yellow-300 group-active:scale-95">
          <Play size={28} className="fill-slate-900 ml-1" />
        </div>
      </div>

      {/* Bottom badge */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/90 font-medium px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-xs pointer-events-none">
        <span>KaizenHR Dashboard Overview</span>
        <span className="text-yellow-400">Click to Play</span>
      </div>
    </div>
  );
}
