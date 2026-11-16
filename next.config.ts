import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep production verification separate from an already running dev server.
  distDir: process.env.NODE_ENV === "development" ? ".next" : ".next-production",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
