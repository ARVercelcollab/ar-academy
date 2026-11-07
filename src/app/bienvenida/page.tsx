"use client";

import { useEffect, useState, useRef, useMemo, useSyncExternalStore, Suspense } from "react";

// sessionStorage no avisa de cambios en la misma pestaña: basta con leerlo una vez.
const sinCambios = () => () => {};
function leerCompra(): string {
  try {
    return sessionStorage.getItem("workshop_compra") || "";
  } catch {
    return "";
  }
}
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.scss";

function BienvenidaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(60);
  const hasRedirected = useRef(false);

  // Desde el 7-11 llegan por sessionStorage, no por la URL (src/components/RegistrationForm.tsx).
  const crudo = useSyncExternalStore(sinCambios, leerCompra, () => "");
  const guardado = useMemo(() => {
    try {
      return (JSON.parse(crudo || "{}") || {}) as { nombre?: string; email?: string };
    } catch {
      return {};
    }
  }, [crudo]);
  const name = searchParams.get("name") || guardado.nombre || "";
  const email = searchParams.get("email") || guardado.email || "";

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
          Tu pago se ha completado correctamente.
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
          <a href="mailto:admin@ariannyrivasacademy.com">
            admin@ariannyrivasacademy.com
          </a>
        </p>

        <p className={styles.redirect}>
          Volviendo a la página principal en {Math.max(countdown, 0)}s
        </p>
      </div>
    </main>
  );
}

export default function Bienvenida() {
  return (
    <Suspense>
      <BienvenidaContent />
    </Suspense>
  );
}
