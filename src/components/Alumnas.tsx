"use client";

import Image from "next/image";
import styles from "./Alumnas.module.scss";
import ArrowIcon from "./ArrowIcon";
import { useCarouselScroll } from "@/hooks/useCarouselScroll";

const carouselImages = [
  { src: "/img/carrusel-4.jpg", width: 1114, height: 616 },
  { src: "/img/carrusel-5.jpg", width: 1099, height: 619 },
];

export default function Alumnas() {
  const allImages = [...carouselImages, ...carouselImages];
  const { wrapperRef, trackRef } = useCarouselScroll();

  return (
    <>
      <section className={styles.section}>
        <div className={styles.header}>
          <Image
            src="/img/usuarios.png"
            alt="Alumnas activas"
            width={219}
            height={48}
            className={styles.avatars}
          />
          <h2 className={styles.title}>
            Más de <strong>100 alumnas</strong> activas
          </h2>
          <p className={styles.subtitle}>
            Chicas sin experiencia previa que hoy trabajan con marcas, generan
            ingresos con su imagen y construyeron una carrera que antes solo
            veían en Instagram.
          </p>
        </div>

        <div className={styles.carouselWrapper} ref={wrapperRef}>
          <div className={styles.track} ref={trackRef}>
            {allImages.map((img, i) => (
              <div key={i} className={styles.slide}>
                <Image
                  src={img.src}
                  width={img.width}
                  height={img.height}
                  alt={`Testimonio ${(i % carouselImages.length) + 1}`}
                  className={styles.image}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p>
            <strong>Espacio libre de estereotipos.</strong> Aquí no hay un molde
            que cumplir.
          </p>
        </div>
      </section>

      <div className={styles.ctaRow}>
        <a href="#registro" className={styles.ctaBtn}>
          <span>ACCEDE A LA COMUNIDAD</span>
          <ArrowIcon />
        </a>
      </div>
    </>
  );
}
