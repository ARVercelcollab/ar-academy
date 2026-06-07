"use client";

// Aviso de actividad reciente, en tono editorial y sobrio (NO el típico banner
// push de "Nombre, Ciudad · hace 3 min" que parece anuncio). Mensajes suaves y
// variados, avatar con inicial en vez del clásico punto verde de semáforo, y
// estética de la marca (blanco, tipografía fina, acento wine). Los datos son
// ilustrativos; si se valida, se puede conectar a inscripciones reales.

import { useState, useEffect, useRef } from "react";
import styles from "./UrgencyToast.module.scss";

type Activity = { initial: string; text: string };

const ACTIVITIES: Activity[] = [
  { initial: "V", text: "Una chica de Valencia acaba de empezar su formación" },
  { initial: "M", text: "Nueva alumna desde Málaga se unió esta mañana" },
  { initial: "S", text: "Alguien de Sevilla está completando su inscripción" },
  { initial: "B", text: "Una futura modelo de Bilbao acaba de entrar" },
  { initial: "Z", text: "Nueva alumna desde Zaragoza se unió hoy" },
  { initial: "C", text: "Alguien de A Coruña está viendo esta página ahora" },
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

    // primer aviso tras 7s, sin prisa
    const start = setTimeout(cycle, 7000);
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
      <p className={styles.text}>{current.text}</p>
    </div>
  );
}
