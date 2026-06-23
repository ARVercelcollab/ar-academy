import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 768, 1024, 1200, 1440],
  },
  compress: true,
  async redirects() {
    return [
      {
        source: "/gracias",
        destination: "/sesionconfirmada",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
