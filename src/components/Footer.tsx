import Image from "next/image";
import styles from "./Footer.module.scss";

/**
 * `variante` cambia SOLO el texto legal.
 *  - "suscripcion" (por defecto): la Comunidad de 27 €/mes. Es lo que había; no se toca.
 *  - "evento": registro gratuito a una clase en directo. Sin pago, sin Stripe, sin suscripción
 *    — decirlo ahí sería falso y la finalidad del tratamiento es otra.
 */
export default function Footer({
  variante = "suscripcion",
}: {
  variante?: "suscripcion" | "evento";
}) {
  const esEvento = variante === "evento";

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
              {esEvento ? (
                <>
                  AR Academy — Arianny Rivas · NIF: Y4869806F
                  <br />
                  Calle San Vicente Mártir 338, Valencia (España)
                  <br />
                  administracion@ariannyrivasacademy.com
                </>
              ) : (
                <>
                  Arianny Rivas — AR Model Agency · NIF: Y4869806F
                  <br />
                  Calle San Vicente Mártir 338, Valencia (España)
                  <br />
                  info@ariannyrivasagency.com · +34 661 855 612
                </>
              )}
            </p>

            <p>
              {esEvento ? (
                <>
                  Los datos personales recogidos a través de este formulario serán
                  tratados por Arianny Rivas — AR Model Agency como responsable del
                  tratamiento, con la finalidad de gestionar tu inscripción a la clase
                  en directo, enviarte el acceso y los recordatorios por WhatsApp y por
                  email, y mantenerte informada sobre la formación de AR Academy. La
                  base legal es tu consentimiento explícito (Art. 6.1.a RGPD), que
                  puedes retirar en cualquier momento. Tus datos se conservarán mientras
                  no solicites su supresión.{" "}
                </>
              ) : (
                <>
                  Los datos personales recogidos a través de este sitio web serán
                  tratados por Arianny Rivas — AR Model Agency como responsable del
                  tratamiento, con la finalidad de gestionar tu suscripción a AR
                  Academy, procesar el pago y darte acceso a la plataforma. La base
                  legal es la ejecución del contrato de suscripción (Art. 6.1.b
                  RGPD) y tu consentimiento explícito (Art. 6.1.a RGPD). Tus datos
                  se conservarán mientras la suscripción esté activa y, una vez
                  cancelada, durante los plazos legales exigidos.{" "}
                </>
              )}
              No se realizan
              transferencias internacionales fuera del EEE sin garantías
              adecuadas. Puedes ejercer tus derechos de acceso, rectificación,
              supresión, oposición, limitación y portabilidad escribiendo a{" "}
              {esEvento
                ? "administracion@ariannyrivasacademy.com"
                : "info@ariannyrivasagency.com"}{" "}
              con el asunto &quot;Derechos RGPD&quot;. Si consideras que tus derechos no han sido atendidos,
              puedes presentar una reclamación ante la Agencia Española de
              Protección de Datos (www.aepd.es).
            </p>

            {esEvento ? (
              <p>
                La clase es gratuita y no se solicita ningún dato de pago. El contenido
                de esta página no constituye una garantía de resultados. Los resultados
                pueden variar según la dedicación y el esfuerzo de cada alumna.
              </p>
            ) : (
              <p>
                Los pagos se procesan de forma segura mediante Stripe, Inc. Los
                datos de tu tarjeta nunca pasan por nuestros servidores. Al
                contratar aceptas una suscripción mensual de 27€/mes que puedes
                cancelar en cualquier momento desde tu perfil, sin permanencia ni
                penalización. El contenido de esta página no constituye una
                garantía de resultados. Los resultados pueden variar según la
                dedicación y el esfuerzo de cada alumna.
              </p>
            )}
          </div>

          <div className={styles.links}>
            <a href="/legal/aviso-legal">Aviso legal</a>
            <a href="/legal/politica-privacidad">Política de privacidad</a>
            <a href="/legal/politica-cookies">Política de cookies</a>
            {!esEvento && (
              <a href="/legal/politica-devolucion">Política de devolución</a>
            )}
          </div>

          <p className={styles.copy}>
            © {new Date().getFullYear()} {esEvento ? "AR Academy" : "AR Model Agency"}.
            Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
