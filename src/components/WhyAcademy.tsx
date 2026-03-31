import Image from "next/image";
import styles from "./WhyAcademy.module.scss";

export default function WhyAcademy() {
  return (
    <section className={styles.section}>
      <div className={styles.headerBlock}>
        <h2 className={styles.title}>
          ¿Por qué <strong>AR Academy funciona</strong> cuando todo lo demás no
          funcionó?
        </h2>

        <p className={styles.intro}>
          La guía que necesitabas, el camino completo y una comunidad que te
          sostiene mientras construyes tu carrera como modelo profesional.
        </p>

        <p className={styles.intro}>
          Es el único espacio donde tienes las bases del modelaje profesional,
          feedback directo de Arianny en videollamadas en vivo, y una comunidad
          de más de 100 alumnas activas que ya están donde tú quieres llegar.
        </p>

        <p className={styles.bold}>
          Todo en el mismo lugar, desde el primer día.
        </p>
      </div>

      <div className={styles.contentBlock}>
        <div className={styles.left}>
          <h3 className={styles.subtitle}>Lo que encuentras dentro:</h3>

          <div className={styles.bulletList}>
            <div className={styles.bulletItem}>
              <span className={styles.square} />
              <p className={styles.bulletText}>
                <strong>
                  Las bases completas del modelaje profesional.
                </strong>{" "}
                Para que sepas exactamente qué hacer y cómo hacerlo desde cero.
              </p>
            </div>

            <div className={styles.bulletItem}>
              <span className={styles.square} />
              <p className={styles.bulletText}>
                <strong>Videollamadas en directo con Arianny.</strong> Ella te
                ve, te corrige y te dice exactamente qué cambiar. Una vez al
                mes, en vivo.
              </p>
            </div>

            <div className={styles.bulletItem}>
              <span className={styles.square} />
              <p className={styles.bulletText}>
                La{" "}
                <strong>comunidad privada de más de 100 alumnas</strong>.
                Modelos en formación y profesionales que ya están donde tú
                quieres llegar — y que avanzan contigo cada mes.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <Image
            src="/img/academia.png"
            alt="Plataforma AR Academy"
            width={900}
            height={900}
            className={styles.image}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
