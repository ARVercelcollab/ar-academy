import type { Metadata } from "next";
import styles from "./page.module.scss";
import ArrowIcon from "@/components/ArrowIcon";
import Footer from "@/components/Footer";
import { CLASE } from "@/lib/masterclass";

export const metadata: Metadata = {
  title: "Tu plaza está reservada · AR Academy",
  robots: { index: false, follow: false },
};

export default function GraciasPage() {
  return (
    <main className={styles.main}>
      <section className={styles.bloque}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>TU PLAZA ESTÁ RESERVADA</p>
          <h1 className={styles.h1}>SOLO FALTA UN PASO</h1>

          <p className={styles.texto}>
            TE HE GUARDADO TU PLAZA PARA EL {CLASE.fechaLarga} A LAS {CLASE.hora}. AHORA ENTRA AL
            GRUPO DE WHATSAPP: ES DONDE TE MANDO EL ENLACE DE ACCESO Y LOS RECORDATORIOS.
          </p>

          <a
            className={styles.btn}
            href={CLASE.grupoWhatsApp || "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>ENTRAR AL GRUPO DE WHATSAPP</span>
            <ArrowIcon />
          </a>

          {/*
            Se le pide que nos mueva a Principal AQUÍ y no solo dentro del correo: acaba de
            registrarse, está motivada y tiene el móvil en la mano. Hecho en este momento,
            arregla la entrega de los once correos de la semana — no solo la del primero. Y el
            primer envío de un dominio recién estrenado cae en Promociones casi siempre.
          */}
          <p className={styles.nota}>
            REVISA TU CORREO: TE ACABO DE MANDAR LAS 5 PLANTILLAS. SI HA CAÍDO EN PROMOCIONES,
            ARRÁSTRALO A PRINCIPAL — ESTA SEMANA TE ESCRIBO VARIAS VECES.
          </p>

          <div className={styles.recordatorio}>
            <p>
              APÚNTATELO: <strong>{CLASE.fechaLarga}, {CLASE.hora}</strong> (HORA DE ESPAÑA).
            </p>
            <p>
              Y TRAE <strong>PAPEL Y BOLI</strong>. VAS A NECESITARLO.
            </p>
          </div>
        </div>
      </section>

      <Footer variante="evento" />
    </main>
  );
}
