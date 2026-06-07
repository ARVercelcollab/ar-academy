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
import ArrowIcon from "./ArrowIcon";

export default function HeroReordered() {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [fullLoaded, setFullLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);

  const fullVideoSrc =
    "https://res.cloudinary.com/dpxilazgm/video/upload/f_auto,q_auto/v1780416534/ari_landing_qfx7nf.mp4";

  useEffect(() => {
    const full = document.createElement("video");
    full.src = fullVideoSrc;
    full.preload = "auto";
    full.oncanplaythrough = () => setFullLoaded(true);
    full.load();
  }, []);

  useEffect(() => {
    if (fullLoaded && videoRef.current) {
      const current = videoRef.current;
      const currentTime = current.currentTime;
      const wasMuted = current.muted;
      current.src = fullVideoSrc;
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
      <div className={styles.container}>
        {/* 1 · HERO */}
        <span className={styles.proofBadge}>+300 alumnas lo demuestran</span>
        <h1 className={styles.title}>
          La chica que entra a una habitación y todos voltean.
        </h1>
        <p className={styles.heroSub}>Se construye. No se nace.</p>

        {/* 2 · PRE-VIDEO */}
        <div className={styles.preVideo}>
          <p className={styles.preText}>
            Te han dicho que necesitas medir 1.80, talla cero y una genética
            perfecta.
          </p>
          <h2 className={styles.mentira}>Mentira.</h2>
          <p className={styles.preText}>
            Arianny te cuenta la verdad que las agencias no quieren que sepas.
          </p>
          <span className={styles.arrowDown}>↓</span>
        </div>

        {/* 3 · VIDEO */}
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
            <source
              src="https://res.cloudinary.com/dpxilazgm/video/upload/f_auto,q_auto/v1780416531/ari_landing_15seg_s3ryik.mp4"
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

        {/* 4 · POST-VIDEO */}
        <p className={styles.paragraph}>
          <strong>Más de 300 mujeres</strong> empezaron exactamente donde estás
          tú.
        </p>
        <blockquote className={styles.quote}>
          Sin medir 1.80.
          <br />
          Sin agencia detrás.
          <br />
          Sin la genética que &quot;se supone&quot; necesitas.
        </blockquote>
        <p className={styles.paragraph}>
          Hoy trabajan con marcas y viven de lo que antes solo veían en
          Instagram.
        </p>
        <p className={styles.decideLine}>
          <em>
            Esto no es para las que sueñan.
            <br />
            Es para las que deciden.
          </em>
        </p>

        {/* 5 · CTA → formulario (mismo patrón que /empezar) */}
        {!showForm ? (
          <button className={styles.ctaBtn} onClick={handleStart}>
            <span>QUIERO EMPEZAR AHORA</span>
            <ArrowIcon />
          </button>
        ) : (
          <div className={styles.formWrapper} ref={formRef}>
            <RegistrationForm />
          </div>
        )}
      </div>
    </section>
  );
}
