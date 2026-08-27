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

          <p className={styles.nota}>
            EL ENLACE PARA ENTRAR A LA CLASE VA POR AHÍ. SI NO ENTRAS AL GRUPO, ES FÁCIL QUE SE TE
            PASE LA HORA.
          </p>

          {/*
            Aviso obligado, y va aquí porque este es el momento en que ella decide entrar:
            en un grupo de WhatsApp corriente todas las participantes ven el número de todas.
            El consentimiento del formulario cubre que le escribamos nosotras, no que su
            teléfono quede visible para el resto. Decirlo cuesta algunas altas y evita un
            problema que después no se deshace.
          */}
          <p className={styles.avisoGrupo}>
            Como en cualquier grupo de WhatsApp, las demás participantes pueden ver tu número.
            Dentro escribimos solo nosotras.
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
