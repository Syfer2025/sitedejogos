import type { NextConfig } from "next";

// ── Security Headers ─────────────────────────────────────────────────────────
// Applied to every response. Adjust CSP if you add new external services.
const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Block clickjacking via legacy header (CSP frame-ancestors below is primary)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },

  // Stop browser from sending Referer on cross-origin downgrade
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Force HTTPS for 2 years, include subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // Restrict browser features — games need fullscreen, block everything else
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },

  // Content-Security-Policy
  // Notes:
  //  - script-src: 'unsafe-inline'+'unsafe-eval' required by Next.js hydration and Google AdSense
  //  - frame-src *: games are hosted on arbitrary third-party domains
  //  - img-src https: blob: data: : thumbnails come from gamemonetize/igdb/user-uploads
  //  - connect-src 'self' https: : API calls and AdSense measurement
  //  - object-src 'none': block Flash/plugins
  //  - base-uri 'self': prevent <base> tag injection
  //  - form-action 'self': prevent forms from submitting to external sites
  //  - frame-ancestors 'self': primary clickjacking protection
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://adservice.google.com https://partner.googleadservices.com https://www.googletagmanager.com https://www.googletagservices.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "frame-src *",
      "connect-src 'self' https:",
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

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
  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
