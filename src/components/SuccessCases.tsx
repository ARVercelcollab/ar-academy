"use client";

import Image from "next/image";
import styles from "./SuccessCases.module.scss";
import ArrowIcon from "./ArrowIcon";

const images = [
  { src: "/img/carrusel-1.jpg", width: 1118, height: 591 },
  { src: "/img/carrusel-2.jpg", width: 1115, height: 586 },
  { src: "/img/carrusel-3.jpg", width: 1121, height: 591 },
  { src: "/img/carrusel-4.jpg", width: 1114, height: 616 },
  { src: "/img/carrusel-5.jpg", width: 1099, height: 619 },
];

export default function SuccessCases() {
  // Duplicate for infinite loop
  const allImages = [...images, ...images];

  return (
    <section className={styles.successCases}>
      <div className={styles.carouselWrapper}>
        <div className={styles.track}>
          {allImages.map((img, i) => (
            <div key={i} className={styles.slide}>
              <Image
                src={img.src}
                width={img.width}
                height={img.height}
                alt={`Caso de éxito ${(i % images.length) + 1}`}
                className={styles.image}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <a href="#registro" className={styles.ctaBtn}>
          <span>ACCEDE A LA COMUNIDAD</span>
          <ArrowIcon />
        </a>
      </div>
    </section>
  );
}
