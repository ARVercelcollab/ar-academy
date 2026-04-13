"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.scss";

function BienvenidaContent() {
  const searchParams = useSearchParams();

  const name = searchParams.get("name") || "";
  const email = searchParams.get("email") || "";

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          Ya casi estás dentro de <strong>AR Academy</strong>
        </h1>
        <p className={styles.text}>
          Hemos abierto Skool en una pestaña nueva para que completes tu
          suscripción y accedas a la comunidad.
          <br />
          Si no se ha abierto automáticamente, pulsa el botón de abajo.
        </p>

        <a
          href="https://www.skool.com/ariannyrivasacademy/about"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaButton}
        >
          IR A SKOOL
        </a>

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
          Si tienes cualquier problema para completar el pago o acceder a la
          comunidad, escríbenos a{" "}
          <a href="mailto:ariannyrivasacademy@gmail.com">
            ariannyrivasacademy@gmail.com
          </a>{" "}
          y te ayudaremos personalmente.
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
