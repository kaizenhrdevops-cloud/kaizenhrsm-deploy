import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://kaizenhrms.com"
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-[#0B0F19] dark:via-[#0B0F19] dark:to-black min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
