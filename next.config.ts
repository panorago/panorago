import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
