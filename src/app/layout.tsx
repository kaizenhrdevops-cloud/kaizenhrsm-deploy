// src/app/layout.tsx
import type { Metadata } from "next";
import {
  Dancing_Script,
  Geist,
  Geist_Mono,
  Inter,
  Merriweather,
  Nunito,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Roboto_Slab,
  Space_Grotesk,
} from "next/font/google";
import "@/app/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const robotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  subsets: ["latin"],
  display: "swap",
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
  display: "swap",
});

const FONT_VARIABLES = [
  geistSans.variable,
  geistMono.variable,
  inter.variable,
  plusJakarta.variable,
  spaceGrotesk.variable,
  nunito.variable,
  playfair.variable,
  merriweather.variable,
  robotoSlab.variable,
  dancingScript.variable,
].join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://kaizenhrms.com",
  ),
  title: {
    default: "KaizenHR — Malaysia's Tier 1 Enterprise HR Solution",
    template: "%s | KaizenHR",
  },
  description: "Revolutionize HR Management with KaizenHR",
  openGraph: {
    type: "website",
    siteName: "KaizenHR",
    title: "KaizenHR — Malaysia's Tier 1 Enterprise HR Solution",
    description: "Revolutionize HR Management with KaizenHR",
  },
  twitter: {
    card: "summary_large_image",
    title: "KaizenHR — Malaysia's Tier 1 Enterprise HR Solution",
    description: "Revolutionize HR Management with KaizenHR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${FONT_VARIABLES} antialiased bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-[#0B0F19] dark:via-[#0B0F19] dark:to-black min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
