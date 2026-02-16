import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow loading PDF worker from CDN
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },

  // Use empty turbopack config (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
