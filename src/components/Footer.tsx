import Image from "next/image";
import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.logos}>
          <Image
            src="/img/logos-footer.svg"
            alt="AR Agency & AR Academy"
            width={235}
            height={47}
          />
        </div>

        <div className={styles.content}>
          <div className={styles.legal}>
            <p className={styles.company}>
              Arianny Rivas — AR Model Agency · NIF: Y4869806F
              <br />
              Calle Dolores Alcaide 4, puerta 12, 46007 Valencia (España)
              <br />
              info@ariannyrivasagency.com · +34 661 855 612
            </p>

            <p>
              Los datos personales recogidos a través de este sitio web serán
              tratados por Arianny Rivas — AR Model Agency como responsable del
              tratamiento, con la finalidad de gestionar tu suscripción a AR
              Academy, procesar el pago y darte acceso a la plataforma. La base
              legal es la ejecución del contrato de suscripción (Art. 6.1.b
              RGPD) y tu consentimiento explícito (Art. 6.1.a RGPD). Tus datos
              se conservarán mientras la suscripción esté activa y, una vez
              cancelada, durante los plazos legales exigidos. No se realizan
              transferencias internacionales fuera del EEE sin garantías
              adecuadas. Puedes ejercer tus derechos de acceso, rectificación,
              supresión, oposición, limitación y portabilidad escribiendo a
              info@ariannyrivasagency.com con el asunto &quot;Derechos
              RGPD&quot;. Si consideras que tus derechos no han sido atendidos,
              puedes presentar una reclamación ante la Agencia Española de
              Protección de Datos (www.aepd.es).
            </p>

            <p>
              Los pagos se procesan de forma segura mediante Stripe, Inc. Los
              datos de tu tarjeta nunca pasan por nuestros servidores. Al
              contratar aceptas una suscripción mensual de $27/mes que puedes
              cancelar en cualquier momento desde tu perfil, sin permanencia ni
              penalización. El contenido de esta página no constituye una
              garantía de resultados. Los resultados pueden variar según la
              dedicación y el esfuerzo de cada alumna.
            </p>
          </div>

          <div className={styles.links}>
            <a href="/legal/aviso-legal">Aviso legal</a>
            <a href="/legal/politica-privacidad">Política de privacidad</a>
            <a href="/legal/politica-cookies">Política de cookies</a>
            <a href="/legal/politica-devolucion">Política de devolución</a>
          </div>

          <p className={styles.copy}>
            © {new Date().getFullYear()} AR Model Agency. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
