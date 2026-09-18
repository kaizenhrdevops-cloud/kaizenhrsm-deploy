import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  experimental: {
    optimizePackageImports: ["lucide-react", "react-icons", "recharts"],
  },

  images: {
    // CMS-uploaded images live in Supabase Storage (admin "Card image"
    // uploader + section media). Without this, next/image throws for the
    // remote host and the image never renders.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },

  eslint: {
    // ESLint checks are clean (0 errors) and enforced on production builds.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Type errors now fail the build (tsc is clean as of free-tier pass).
    ignoreBuildErrors: false,
  },

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
