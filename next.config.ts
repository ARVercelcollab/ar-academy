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
  // /plan sirve la landing del plan personalizado, que vive en su propio
  // proyecto de Vercel (plan-ar-academy → plan.ariannyrivasacademy.com). Es una
  // reescritura, no una redirección: la URL se queda en /plan y Vercel trae el
  // contenido del subdominio por debajo. La segunda regla cubre /plan/api/lead,
  // la función que escribe en GHL; sin ella el formulario apuntaría a este
  // proyecto, que no la tiene. Ref: 00-contexto/decisiones.md (2026-09-17).
  async rewrites() {
    return [
      { source: "/plan", destination: "https://plan.ariannyrivasacademy.com/" },
      {
        source: "/plan/:path*",
        destination: "https://plan.ariannyrivasacademy.com/:path*",
      },
    ];
  },
};

export default nextConfig;
