// Configuración de vídeo en Bunny Stream.
//
// Los vídeos se sirven como HLS adaptativo (.m3u8) desde el CDN de la Video
// Library. Bunny transcodifica cada vídeo a varias calidades y el reproductor
// (hls.js / HLS nativo en Safari) elige la que aguanta la conexión del usuario,
// así un móvil en 4G no descarga el 4K entero. Esto sustituye a los .mp4 que
// servíamos desde Cloudinary.
//
// Para cambiar un vídeo: súbelo a la library en Bunny y pega aquí su nuevo GUID.
// El hostname es el "CDN Hostname" de la library (Stream → library → API).

const HOSTNAME = "vz-171fc963-c2a.b-cdn.net";

// GUID de cada vídeo dentro de la library de Bunny Stream.
const VIDEO_IDS = {
  heroLargo: "42d50ee9-4a64-4136-ac87-f3d6ec07f87e", // ari_landing
  hero15seg: "7d41c4f7-b1b6-454a-8189-16999d41577b", // ari_landing_15seg
  comunidad: "4ad1756f-b993-479d-90a9-c9ee7f97c103", // COMUNIDAD_1
  llamada: "e9eede1b-ec82-4e69-88dd-1ac8eadc29a2", // LLAMADA_1
} as const;

export type BunnyVideo = keyof typeof VIDEO_IDS;

/** URL del playlist HLS adaptativo de un vídeo. */
export function hlsUrl(video: BunnyVideo): string {
  return `https://${HOSTNAME}/${VIDEO_IDS[video]}/playlist.m3u8`;
}

/** Poster (primer fotograma) que Bunny genera para cada vídeo. */
export function posterUrl(video: BunnyVideo): string {
  return `https://${HOSTNAME}/${VIDEO_IDS[video]}/thumbnail.jpg`;
}
