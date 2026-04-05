"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./Hero.module.scss";
import RegistrationForm from "./RegistrationForm";

export default function Hero() {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [fullLoaded, setFullLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const full = document.createElement("video");
    full.src = "/vid/ari_landing.mp4";
    full.preload = "auto";
    full.oncanplaythrough = () => setFullLoaded(true);
    full.load();
  }, []);

  useEffect(() => {
    if (fullLoaded && videoRef.current) {
      const current = videoRef.current;
      const currentTime = current.currentTime;
      const wasMuted = current.muted;
      current.src = "/vid/ari_landing.mp4";
      current.currentTime = currentTime;
      current.muted = wasMuted;
      current.play().catch(() => {});
    }
  }, [fullLoaded]);

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

  return (
    <section className={styles.hero}>
      <div className={styles.headerArea}>
        <p className={styles.subtitle}>
          La chica que entra a una habitación y todos voltean no llegó ahí
          sola. AR Academy es el lugar donde eso empieza a construirse.
        </p>
        <h1 className={styles.title}>
          Empieza aquí: la guía y el entorno que necesitas para{" "}
          <span className={styles.titleAccent}>
            construir tu carrera como modelo profesional
          </span>
        </h1>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.left}>
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
            >
              <source src="/vid/ari_landing_15seg.mp4" type="video/mp4" />
            </video>
            {isMuted ? (
              <button
                className={styles.soundBtn}
                onClick={handleActivateSound}
              >
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

          <p className={styles.preText}>
            Te han dicho que para ser modelo necesitas medir 1.80, talla cero y
            una genética perfecta.
          </p>
          <h2 className={styles.mentira}>Mentira.</h2>
          <p className={styles.paragraph}>
            <strong>Más de 100 alumnas</strong> empezaron sin ninguna de esas
            cosas. Hoy trabajan con marcas, cobran por su imagen y{" "}
            <strong>construyeron una carrera</strong> que antes solo veían en
            Instagram.
          </p>
        </div>

        <div id="registro" className={styles.right}>
          <div className={styles.priceCard}>
            <span className={styles.priceLabel}>Únete hoy</span>
            <div className={styles.priceRow}>
              <span className={styles.price}>
                <strong>$27</strong>/mes
              </span>
              <span className={styles.priceOld}>$97</span>
            </div>
            <p className={styles.priceSubtext}>
              Menos de lo que cuesta una sesión de fotos que no te lleva a
              ningún lado
            </p>
          </div>
          <div className={styles.accessBadge}>
            ACCESO ABIERTO POR TIEMPO LIMITADO
          </div>
          <p className={styles.accessInfo}>
            Entra hoy, la comunidad te espera desde el primer minuto.
            <br />
            Acceso a todos los eventos presenciales.
          </p>
          <RegistrationForm />
        </div>
      </div>
    </section>
  );
}
