import type { Metadata } from "next";
import "./globals.scss";
import CookieBanner from "@/components/CookieBanner";
import MetaPixel from "@/components/MetaPixel";

export const metadata: Metadata = {
  title: "AR Academy – Tu carrera como modelo profesional",
  description:
    "Empieza aquí: la guía y el entorno que necesitas para construir tu carrera como modelo profesional. Más de 100 alumnas activas.",
  icons: {
    icon: [
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link
          rel="preload"
          href="https://use.typekit.net/af/44d038/00000000000000007753ca34/31/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n3&v=3"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://use.typekit.net/af/36c3c6/00000000000000007753ca29/31/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n5&v=3"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://use.typekit.net/cbv1cvv.css"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://use.typekit.net/cbv1cvv.css"
        />
      </head>
      <body>
        {children}
        <MetaPixel />
        <CookieBanner />
      </body>
    </html>
  );
}
