import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.igdb.com",
      },
      {
        protocol: "https",
        hostname: "img.gamemonetize.com",
      },
    ],
    minimumCacheTTL: 2592000, // 30 days
    formats: ["image/webp"],
    unoptimized: true,
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
