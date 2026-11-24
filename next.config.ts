import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    minimumCacheTTL: 2678400, // catalogue photos are never edited in place
  },
  reactStrictMode: false,
};

export default nextConfig;
