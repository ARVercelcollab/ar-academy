import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 768, 1024, 1200, 1440],
  },
  compress: true,
  // CORS en los assets estáticos para que herramientas de session-replay
  // (Microsoft Clarity) puedan reconstruir la página con sus estilos. Sin esto,
  // el visor de Clarity (otro origen) no puede leer los chunks CSS de Next y la
  // grabación se ve sin CSS.
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
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
