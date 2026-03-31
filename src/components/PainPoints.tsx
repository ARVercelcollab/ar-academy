import styles from "./PainPoints.module.scss";
import XIcon from "./XIcon";
import ArrowIcon from "./ArrowIcon";

export default function PainPoints() {
  const items = [
    {
      bold: "Has buscado información por tu cuenta",
      rest: " y cada cosa que encuentras te lleva a otro lugar sin respuesta clara.",
    },
    {
      bold: "Has pensado en contactar agencias",
      rest: " pero no sabes si te van a tomar en serio (o si te van a pedir pagar por adelantado)",
    },
    {
      bold: "",
      rest: "Sientes que ",
      boldInline: "si no empezaste a los 18 ya perdiste el tren.",
    },
    {
      bold: "",
      rest: "No tienes book, no tienes contactos y ",
      boldInline: "no sabes cuál es el primer paso de verdad.",
    },
    {
      bold: "Lo has intentado sola",
      rest: " y sin feedback nunca sabes si vas en la dirección correcta.",
    },
  ];

  return (
    <section className={styles.painPoints}>
      <div className={styles.container}>
        <h2 className={styles.title}>
          ¿Te suena <strong>alguna de estas?</strong>
        </h2>

        <div className={styles.grid}>
          {items.map((item, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.iconCol}>
                <XIcon className={styles.xIcon} />
              </div>
              <div className={styles.textCol}>
                <p className={styles.text}>
                  {item.bold && <strong>{item.bold}</strong>}
                  {item.rest}
                  {item.boldInline && <strong>{item.boldInline}</strong>}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.closing}>
          <p className={styles.closingTitle}>
            <strong>
              Si te has sentido identificada con al menos una, significa que
              estás lista.
            </strong>
          </p>
          <p className={styles.closingText}>
            En mi comunidad no vas a estar sola, vas a entrar a un grupo de
            chicas que están exactamente donde tú estás, que se apoyan, que se
            celebran y que avanzan juntas, de mi mano y de más de 5 mentores.
          </p>
          <a href="#registro" className={styles.ctaBtn}>
            <span>ACCEDE A LA COMUNIDAD</span>
            <ArrowIcon />
          </a>
        </div>
      </div>
    </section>
  );
}
