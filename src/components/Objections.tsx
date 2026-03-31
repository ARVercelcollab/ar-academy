import styles from "./Objections.module.scss";
import XIcon from "./XIcon";
import CheckIcon from "./CheckIcon";
import ArrowIcon from "./ArrowIcon";

const faqs = [
  {
    question: "No tengo experiencia previa",
    answer:
      "Perfecto. AR Academy está diseñada exactamente para eso. Más del 80% de nuestras alumnas empezaron sin haber posado nunca.",
    answerBold: "Perfecto. AR Academy está diseñada exactamente para eso.",
    answerRest:
      " Más del 80% de nuestras alumnas empezaron sin haber posado nunca.",
  },
  {
    question: "No soy de la ciudad donde se hacen los eventos",
    answer: "",
    answerBold: "La comunidad y toda la formación es online.",
    answerRest: " Los eventos presenciales son un bonus, no un requisito.",
  },
  {
    question: "¿Qué pasa si no me gusta? ¿Puedo cancelar?",
    answer: "",
    answerBold: "",
    answerRest:
      "Sí. Sin permanencia ni letra pequeña. ",
    answerBold2: "Cancelas cuando quieras desde tu perfil.",
  },
  {
    question: "Ya tengo 25 años. ¿Es demasiado tarde?",
    answer: "",
    answerBold: "",
    answerRest:
      "No. La industria ha cambiado. Las marcas buscan autenticidad y personalidad, no edad. Tenemos alumnas de 16 a 40 años construyendo carrera.",
  },
];

export default function Objections() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>¿Y si AR Academy no es para mí?</h2>

        <div className={styles.grid}>
          {faqs.map((faq, i) => (
            <div key={i} className={styles.card}>
              {/* Question row */}
              <div className={styles.row}>
                <div className={styles.iconCol}>
                  <XIcon className={styles.icon} />
                </div>
                <div className={styles.textCol}>
                  <p className={styles.questionText}>{faq.question}</p>
                </div>
              </div>
              {/* Answer row */}
              <div className={styles.row}>
                <div className={styles.iconCol}>
                  <CheckIcon className={styles.icon} />
                </div>
                <div className={styles.textCol}>
                  <p className={styles.answerText}>
                    {faq.answerBold && <strong>{faq.answerBold}</strong>}
                    {faq.answerRest}
                    {(faq as Record<string, string>).answerBold2 && (
                      <strong>{(faq as Record<string, string>).answerBold2}</strong>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

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

        <div className={styles.guaranteeBar}>
          <p className={styles.guaranteeText}>
            <strong>El riesgo es cero.</strong> La oportunidad es real.
          </p>
          <div className={styles.guaranteeSub}>
            <p>100% Garantizado SIN Preguntas</p>
          </div>
        </div>
      </div>
    </section>
  );
}
