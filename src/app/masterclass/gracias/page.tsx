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
