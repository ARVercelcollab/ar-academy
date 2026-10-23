import styles from "./Pricing.module.scss";
import ArrowIcon from "./ArrowIcon";

export default function Pricing() {
  return (
    <section className={styles.section}>
      {/* Wine block — invitation */}
      <div className={styles.wineBlock}>
        <h2 className={styles.invitationTitle}>
          <strong>Invitación gratis</strong> a todos nuestros eventos
          presenciales.
        </h2>
      </div>

      {/* Dark block — pricing */}
      <div className={styles.darkBlock}>
        <div className={styles.priceArea}>
          <span className={styles.priceLabel}>por solo</span>
          <div className={styles.priceRow}>
            <span className={styles.price}>
              <strong>99€</strong> pago único
            </span>
          </div>
          <p className={styles.priceOld}>(acceso para siempre)</p>

          <div className={styles.buttons}>
            <a href="#registro" className={styles.btnOutline}>
              <span>ver video</span>
              <ArrowIcon />
            </a>
            <a href="#registro" className={styles.btnFilled}>
              <span>ACCEDE A LA COMUNIDAD</span>
              <ArrowIcon />
            </a>
          </div>
        </div>

        <div className={styles.savingsBar}>
          <p>
            <strong>Un solo pago y es tuya para siempre.</strong> Sin cuotas cada mes
          </p>
        </div>
      </div>
    </section>
  );
}
