"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";
import styles from "./page.module.scss";

function GraciasContent() {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "";
  const email = searchParams.get("email") || "";

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
    <main className={styles.page}>
      <div className={styles.content}>
        <div className={styles.container}>
        <h1 className={styles.title}>
          ¡Enhorabuena, eres parte de{" "}
          <span className={styles.titleAccent}>AR Academy!</span>
        </h1>

        <p className={styles.text}>
          Tu suscripción se ha activado correctamente.
          <br />
          Revisa tu correo electrónico para acceder a la comunidad.
        </p>

        {(name || email) && (
          <div className={styles.details}>
            {name && (
              <p>
                <span className={styles.label}>Nombre:</span> {name}
              </p>
            )}
            {email && (
              <p>
                <span className={styles.label}>Correo:</span> {email}
              </p>
            )}
          </div>
        )}

        <p className={styles.support}>
          Si tienes algún problema o no recibes el email, contacta con nosotros
          en{" "}
          <a href="mailto:ariannyrivasacademy@gmail.com">
            ariannyrivasacademy@gmail.com
          </a>
        </p>

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
            <source src="/vid/agradecimiento.mp4" type="video/mp4" />
          </video>
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
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function GraciasPage() {
  return (
    <Suspense>
      <GraciasContent />
    </Suspense>
  );
}
