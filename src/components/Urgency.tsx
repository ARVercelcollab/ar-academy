import styles from "./Urgency.module.scss";
import ArrowIcon from "./ArrowIcon";

export default function Urgency() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.goldBar}>
            <strong>esto es importante</strong>
          </div>

          <div className={styles.cardContent}>
            <h2 className={styles.title}>
              <strong>La academia lleva 1 año cerrada.</strong> Está abierta
              ahora por tiempo limitado.
            </h2>

            <p className={styles.subtitle}>
              Únete ahora antes de que cerremos puertas
            </p>

            <a href="#registro" className={styles.ctaBtn}>
              <span>UNIRME A la academia</span>
              <ArrowIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
