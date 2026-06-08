"use client";

// Aviso de actividad reciente, en tono editorial y sobrio (NO el típico banner
// push de "Nombre, Ciudad · hace 3 min" que parece anuncio). Mensajes suaves y
// variados, avatar con inicial en vez del clásico punto verde de semáforo, y
// estética de la marca (blanco, tipografía fina, acento wine). Los datos son
// ilustrativos; si se valida, se puede conectar a inscripciones reales.

import { useState, useEffect, useRef } from "react";
import styles from "./UrgencyToast.module.scss";

type Activity = { initial: string; city: string };

// Aviso de actividad reciente: "Una chica acaba de acceder a la comunidad desde
// [ciudad]". Ciudades variadas (ES + LATAM + US) para reflejar el alcance real
// del público. Datos ilustrativos.
const ACTIVITIES: Activity[] = [
  { initial: "M", city: "Miami" },
  { initial: "V", city: "Valencia" },
  { initial: "B", city: "Bogotá" },
  { initial: "C", city: "Ciudad de México" },
  { initial: "M", city: "Madrid" },
  { initial: "B", city: "Buenos Aires" },
  { initial: "S", city: "Santiago" },
  { initial: "L", city: "Lima" },
];

export default function UrgencyToast() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    let i = 0;

    const cycle = () => {
      setIndex(i % ACTIVITIES.length);
      setVisible(true);

      // visible ~6s, luego oculto un buen rato para no agobiar
      timers.current.push(setTimeout(() => setVisible(false), 6000));
      timers.current.push(
        setTimeout(() => {
          i += 1;
          cycle();
        }, 6000 + 16000),
      );
    };

    // primer aviso tras 20s, sin prisa (que dé tiempo a ver el hero/vídeo)
    const start = setTimeout(cycle, 20000);
    timers.current.push(start);

    const snapshot = timers.current;
    return () => snapshot.forEach(clearTimeout);
  }, []);

  const current = ACTIVITIES[index];

  return (
    <div
      className={`${styles.toast} ${visible ? styles.visible : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className={styles.avatar} aria-hidden="true">
        {current.initial}
      </span>
      <p className={styles.text}>
        Una chica acaba de acceder a la comunidad desde{" "}
        <strong>{current.city}</strong>
      </p>
    </div>
  );
}
