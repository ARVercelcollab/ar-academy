import Image from "next/image";
import styles from "./AboutArianny.module.scss";

export default function AboutArianny() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.left}>
          <h2 className={styles.title}>
            Soy <strong>Arianny Rivas</strong>
          </h2>

          <p className={styles.intro}>
            Después de 16 años en la industria y de ayudar a más de 300
            mujeres, entendí algo que las agencias no quieren que sepas:
          </p>

          <p className={styles.statement}>
            Hoy en día, <strong>las marcas no buscan a la mujer perfecta.</strong>
          </p>
          <p className={styles.statement}>
            Buscan mujeres con personalidad, formación y estrategia.
          </p>

          <p className={styles.description}>
            He creado <em>AR Academy</em>.{" "}
            <strong>un sistema de 3 pilares</strong> para que dejes de ser
            &quot;la chica de las fotos lindas&quot; y te conviertas en una
            modelo profesional impulsando tu negocio propio a través de mi
            metodología.
            <br />
            Te enseño los 3 pilares principales:
          </p>

          <div className={styles.pillarsBox}>
            <div className={styles.pillar}>
              <span className={styles.pillarTag}>1. Mentalidad Inquebrantable</span>
              <p className={styles.pillarText}>
                Lo que te frena no es tu físico. Es lo que crees sobre ti misma.
              </p>
            </div>

            <div className={styles.pillar}>
              <span className={styles.pillarTag}>2. Técnica</span>
              <p className={styles.pillarText}>
                Pasarela, posing y presencia que hacen que una marca te vea una
                vez y no te olvide.
              </p>
            </div>

            <div className={styles.pillar}>
              <span className={styles.pillarTag}>3. Tu marca personal</span>
              <p className={styles.pillarText}>
                Que las marcas te busquen a ti. No al revés.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.imageWrapper}>
            <Image
              src="/img/ari-img.jpeg"
              alt="Arianny Rivas - Fundadora AR Academy"
              width={1066}
              height={1600}
              className={styles.image}
              loading="lazy"
            />
          </div>
          <p className={styles.caption}>
            <strong>Arianny Rivas</strong> - Fundadora AR Academy
          </p>
        </div>
      </div>
    </section>
  );
}
