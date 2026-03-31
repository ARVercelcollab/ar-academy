"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.scss";

export default function Bienvenida() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

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
          Volviendo a la página principal en {countdown}s
        </p>
      </div>
    </main>
  );
}
