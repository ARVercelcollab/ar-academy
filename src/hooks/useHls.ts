"use client";

import { useEffect, RefObject } from "react";

// Conecta un <video> a una fuente HLS (.m3u8) de Bunny Stream.
//
// - Safari / iOS reproducen HLS de forma nativa: basta con poner el src.
// - Chrome / Firefox / Edge no soportan HLS nativo → usamos hls.js, que va
//   alimentando el <video> con los segmentos y elige la calidad según la
//   conexión (adaptive bitrate).
//
// En ambos casos el elemento sigue siendo un <video> normal: los eventos
// (timeupdate, play, pause), currentTime, duration, etc. funcionan igual, así
// que la barra de progreso y los controles custom no cambian.
export function useHls(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Safari/iOS: HLS nativo.
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    // Resto de navegadores: hls.js. Se importa dinámicamente para no añadirlo
    // al bundle inicial (es código que solo corre en cliente).
    let hls: import("hls.js").default | null = null;
    let cancelled = false;

    import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
      } else {
        // Fallback improbable: ni HLS nativo ni hls.js (algún navegador muy
        // viejo). Dejamos el src directo por si hay MP4 fallback en Bunny.
        video.src = src;
      }
    });

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
    };
  }, [videoRef, src]);
}
