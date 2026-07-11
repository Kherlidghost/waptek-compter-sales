import type { NextConfig } from "next";

// Trusted external hostnames used by this project.
// Update if you add new image domains or third-party scripts.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: supabaseHostname },
    ],
  },

  // ── HTTP Security Headers ──────────────────────────────────────────────────
  // Applied to every response via Next.js headers config.
  // CSP is intentionally permissive on script-src for Next.js RSC/hydration;
  // tighten further once a nonce-based approach is added.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent embedding in iframes (clickjacking)
          { key: "X-Frame-Options", value: "DENY" },
          // Limit referrer information sent to third parties
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features not needed by this app
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=()",
          },
          // Force HTTPS for 1 year (Vercel already enforces HTTPS; belt-and-suspenders)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Content Security Policy
          // - default-src 'self': baseline
          // - script-src: Next.js requires 'unsafe-inline' + 'unsafe-eval' for dev;
          //   in production Next.js inlines bootstrap scripts so 'unsafe-inline' is needed.
          // - style-src: Tailwind inlines styles
          // - img-src: Supabase storage + Unsplash (seed images) + data URIs
          // - connect-src: Supabase API + auth
          // - frame-ancestors 'none': belt-and-suspenders clickjacking protection
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: blob: https://${supabaseHostname} https://images.unsplash.com`,
              `connect-src 'self' https://${supabaseHostname} https://api.supabase.co wss://${supabaseHostname}`,
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
