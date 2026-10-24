import styles from "./Urgency.module.scss";
import ArrowIcon from "./ArrowIcon";

// Antes decía «La academia lleva 1 año cerrada… antes de que cerremos puertas», que no era verdad.
// Desde el 24-10 avisa de la subida real (Carlos); desde el 1-12 ya no sale.
export default function Urgency({ subio = false }: { subio?: boolean }) {
  if (subio) return null;
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.goldBar}>
            <strong>esto es importante</strong>
          </div>

          <div className={styles.cardContent}>
            <h2 className={styles.title}>
              <strong>El 1 de diciembre la Comunidad sube a 199€.</strong> Hasta
              el 30 de noviembre entras por 99€.
            </h2>

            <p className={styles.subtitle}>
              Un solo pago, y el acceso es para siempre
            </p>

            <a href="#registro" className={styles.ctaBtn}>
              <span>Entrar por 99€</span>
              <ArrowIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
