"use client";

import { useState } from "react";
import styles from "./Hero.module.scss";
import RegistrationForm from "./RegistrationForm";

export default function Hero() {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <section className={styles.hero}>
      <div className={styles.headerArea}>
        <p className={styles.subtitle}>
          Para chicas que sienten que podrían vivir de su imagen...
          <br />
          pero no saben por dónde empezar.
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
          <div
            className={styles.videoWrapper}
            onClick={() => setIsMuted(!isMuted)}
          >
            <video
              className={styles.video}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              poster="/video-poster.jpg"
            >
              {/* <source src="/intro.mp4" type="video/mp4" /> */}
            </video>
            <button
              className={styles.soundBtn}
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
            >
              haz click y activa el sonido
            </button>
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
