import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
};

export default withNextIntl(nextConfig);
