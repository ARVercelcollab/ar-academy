import styles from "./FinalCta.module.scss";
import RegistrationForm from "./RegistrationForm";

export default function FinalCta() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.left}>
          <h2 className={styles.title}>Sí, quiero empezar hoy</h2>

          <div className={styles.benefits}>
            <p>Acceso inmediato.</p>
            <p><strong>Cancela cuando quieras.</strong></p>
            <p>Funciona en todo el mundo.</p>
          </div>

          <p className={styles.badge}>
            inicia tu formación hoy mismo
          </p>
        </div>

        <div className={styles.right}>
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
