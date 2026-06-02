"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import RegistrationForm from "@/components/RegistrationForm";
import styles from "./page.module.scss";

export default function EmpezarPage() {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

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

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <div className={styles.container}>
          <h1 className={styles.title}>
            <span className={styles.titleAccent}>
              Hay chicas que lo piensan.
              <br />
              Y hay chicas que lo hacen.
            </span>
            <br />
            Si llegaste hasta aquí, ya sabes en cuál lado estás.
          </h1>

          <p className={styles.text}>
            AR Academy: la academia donde construyes tu carrera como modelo
            profesional y creadora de contenido desde cero, con dirección exacta
            y comprobada.
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
              poster="https://res.cloudinary.com/dpxilazgm/video/upload/so_0,f_auto,q_auto/v1780416974/ArAcademy-VSL-LLAMADA_V03_1_c23pt4.jpg"
              onClick={!isMuted ? togglePlay : undefined}
            >
              <source
                src="https://res.cloudinary.com/dpxilazgm/video/upload/f_auto,q_auto,vc_auto/v1780416974/ArAcademy-VSL-LLAMADA_V03_1_c23pt4.mp4"
                type="video/mp4"
              />
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

          {!showForm ? (
            <button className={styles.ctaBtn} onClick={handleStart}>
              Quiero empezar ahora
            </button>
          ) : (
            <div className={styles.formWrapper} ref={formRef}>
              <RegistrationForm />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
