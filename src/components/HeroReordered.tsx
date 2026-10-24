"use client";

// Variante de STAGING del Hero siguiendo el mockup que pidió el cliente:
// UNA columna, vídeo arriba, copy nuevo, y botón "QUIERO EMPEZAR AHORA" que
// revela el formulario (mismo patrón que /empezar) en vez de mostrar el precio
// y el form de Stripe siempre visibles.
//
// IMPORTANTE: los TAMAÑOS y la TIPOGRAFÍA salen de Hero.module.scss (los estilos
// reales de /comunidad), NO de los px del HTML del mockup. Del mockup solo se
// toma el ORDEN y el COPY.

import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./HeroReordered.module.scss";
import RegistrationForm from "./RegistrationForm";
import { useHls } from "@/hooks/useHls";
import { hlsUrl } from "@/lib/bunny";

export default function HeroReordered() {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // HLS adaptativo desde Bunny (ver nota en Hero.tsx: ya no hace falta el truco
  // de precargar el corto y swapear al largo).
  useHls(videoRef, hlsUrl("heroLargo"));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      if (!dragging && video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [dragging]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, []);

  const seekTo = useCallback((clientX: number) => {
    const bar = progressRef.current;
    const video = videoRef.current;
    if (!bar || !video || !video.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setProgress(ratio * 100);
  }, []);

  const handleActivateSound = useCallback(() => {
    setIsMuted(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const handleStart = useCallback(() => {
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  // Los CTAs de las secciones de abajo (Pricing, Urgency) apuntan a #registro.
  // Como aquí el form está oculto tras el botón, hay que abrirlo al navegar a esa
  // ancla. Interceptamos el click en cualquier <a href="#registro"> (más fiable
  // que hashchange, que no dispara si el hash ya era #registro) y, además,
  // cubrimos la carga directa con #registro en la URL.
  useEffect(() => {
    const reveal = () => {
      setShowForm(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a[href="#registro"]')) reveal();
    };

    if (window.location.hash === "#registro") reveal();
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <section className={styles.hero} id="registro">
      {/* Fuera la barra de «plazas limitadas» (Carlos, 2026-10-24). El espaciador se queda como
          margen de arriba, para que el hero no cambie de sitio. */}
      <div className={styles.scarcitySpacer} aria-hidden="true" />

      <div className={styles.container}>
        {/* 1 · HERO */}
        <h1 className={styles.title}>
          La chica que entra a una habitación y todos voltean.
        </h1>
        <p className={styles.heroSub}>Se construye. No se nace.</p>
        <span className={styles.proofBadge}>
          +400 alumnas iniciaron exactamente donde estás tú
        </span>

        {/* VIDEO (el bloque pre-vídeo se eliminó: era redundante con el vídeo) */}
        <div className={styles.videoWrapper}>
          <video
            ref={videoRef}
            className={styles.video}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            onClick={!isMuted ? togglePlay : undefined}
          />
          {isMuted ? (
            <button className={styles.soundBtn} onClick={handleActivateSound}>
              haz click y activa el sonido
            </button>
          ) : (
            <div className={styles.customControls}>
              <button
                className={styles.playPauseBtn}
                onClick={togglePlay}
                type="button"
              >
                {isPlaying ? (
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                    <rect x="0" y="0" width="4" height="16" fill="#fff" />
                    <rect x="10" y="0" width="4" height="16" fill="#fff" />
                  </svg>
                ) : (
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                    <path d="M0 0L14 8L0 16V0Z" fill="#fff" />
                  </svg>
                )}
              </button>
              <div
                className={styles.progressBar}
                ref={progressRef}
                onClick={(e) => seekTo(e.clientX)}
                onMouseDown={(e) => {
                  setDragging(true);
                  seekTo(e.clientX);
                  const onMove = (ev: MouseEvent) => seekTo(ev.clientX);
                  const onUp = () => {
                    setDragging(false);
                    window.removeEventListener("mousemove", onMove);
                    window.removeEventListener("mouseup", onUp);
                  };
                  window.addEventListener("mousemove", onMove);
                  window.addEventListener("mouseup", onUp);
                }}
              >
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* CTA con precio (sube justo tras el vídeo, como el boceto) */}
        {!showForm ? (
          <>
            <p className={styles.ctaHint}>
              Haz clic en el botón amarillo para acceder
            </p>
            <button className={styles.priceCta} onClick={handleStart}>
              <span className={styles.priceCtaMain}>
                <strong>199€</strong> pago único
              </span>
            </button>
            <p className={styles.afterCta}>
              <strong>Un solo pago, acceso para siempre.</strong>
              <br />
              <em>
                Saldrás siendo otra mujer: más segura, más auténtica, más
                {" "}profesional.
              </em>
            </p>
          </>
        ) : (
          <div className={styles.formWrapper} ref={formRef}>
            <RegistrationForm />
          </div>
        )}
      </div>

      {/* Banda de beneficios full-width: carrusel en bucle (marquee) */}
      <div className={styles.benefitsBar}>
        <div className={styles.benefitsTrack}>
          {/* Dos copias seguidas para que el bucle sea continuo y sin saltos */}
          {[0, 1].map((copy) => (
            <div className={styles.benefitsGroup} key={copy} aria-hidden={copy === 1}>
              <span>Sin medir 1,75</span>
              <span>Sin agencias detrás</span>
              <span>Sin experiencia previa</span>
              <span>Vive de tu imagen</span>
              <span>Monetiza tu contenido</span>
              <span>+600 campañas</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
