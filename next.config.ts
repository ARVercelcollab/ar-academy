import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 768, 1024, 1200, 1440],
  },
  compress: true,
  // CORS en los assets estáticos para que herramientas de session-replay
  // (Microsoft Clarity) puedan reconstruir la página con sus estilos. Sin acceso
  // cross-origin, el visor de Clarity (otro origen) no puede leer los CSS/recursos
  // de estilo y la grabación se ve sin CSS. Cubrimos los chunks de Next y los
  // assets públicos (imágenes usadas en CSS, etc.).
  // Ref: https://learn.microsoft.com/en-us/clarity/session-recordings/troubleshooting-recordings
  async headers() {
    const corsHeader = [
      { key: "Access-Control-Allow-Origin", value: "*" },
    ];
    return [
      { source: "/_next/static/:path*", headers: corsHeader },
      { source: "/img/:path*", headers: corsHeader },
      { source: "/:file(.*\\.(?:css|woff|woff2|ttf|otf|svg))", headers: corsHeader },
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
  // /plan es la landing del plan personalizado. Es un HTML que se basta solo (fuentes,
  // estilos y el quiz van dentro) y vive en public/plan/index.html; su formulario
  // escribe en GHL a través de /api/plan/lead. Next sirve public/ por ruta exacta, así
  // que /plan necesita esta regla para llegar al index. Hasta el 2026-09-17 esto era
  // una reescritura a un subdominio aparte; se trajo aquí para tener una sola casa.
  async rewrites() {
    return [{ source: "/plan", destination: "/plan/index.html" }];
  },
};

export default nextConfig;
