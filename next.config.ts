import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    // lucide-react / date-fns are optimized by default; add heavier named-export libs.
    optimizePackageImports: ["framer-motion", "zod", "@supabase/supabase-js"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Place cards + heroes; keep srcset lean (Next 16 dropped 16px by default).
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24, // 24h — place media rarely changes
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pxgdoevtrqvkbwftnsaa.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "coverr.co",
      },
      {
        protocol: "https",
        hostname: "cdn.coverr.co",
      },
      {
        protocol: "https",
        hostname: "videos.pexels.com",
      },
    ],
  },
};

export default nextConfig;
