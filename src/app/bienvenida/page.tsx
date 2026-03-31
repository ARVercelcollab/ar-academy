"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.scss";

export default function Bienvenida() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(20);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown <= 0 && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push("/");
    }
  }, [countdown, router]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          ¡Bienvenida a <strong>AR Academy!</strong>
        </h1>
        <p className={styles.text}>
          Tu suscripción se ha activado correctamente.
          <br />
          Revisa tu correo electrónico para acceder a la comunidad.
        </p>
        <p className={styles.redirect}>
          Volviendo a la página principal en {Math.max(countdown, 0)}s
        </p>
      </div>
    </main>
  );
}
