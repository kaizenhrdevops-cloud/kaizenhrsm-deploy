import {
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Instagram,
  Github,
  Gitlab,
  Twitch,
  Dribbble,
  Slack,
  Globe,
  Smartphone,
} from "lucide-react";

// Platform name -> icon mapping for social links.
export const getSocialIcon = (platformName: string) => {
  const name = platformName.toLowerCase().trim();
  if (name.includes("facebook")) return Facebook;
  if (name.includes("linkedin")) return Linkedin;
  if (name.includes("twitter") || name.includes("x.com") || name === "x")
    return Twitter;
  if (name.includes("youtube")) return Youtube;
  if (name.includes("instagram")) return Instagram;
  if (name.includes("github")) return Github;
  if (name.includes("gitlab")) return Gitlab;
  if (name.includes("twitch")) return Twitch;
  if (name.includes("dribbble")) return Dribbble;
  if (name.includes("slack")) return Slack;
  if (name.includes("tiktok")) return Smartphone; // Approximate icon
  return Globe; // Default fallback
};
