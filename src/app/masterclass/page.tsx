import type { Metadata } from "next";
import styles from "./page.module.scss";
import MasterclassForm from "@/components/MasterclassForm";
import CuentaAtras from "@/components/CuentaAtras";
import Footer from "@/components/Footer";
import { CLASE, HORAS_LOCALES } from "@/lib/masterclass";

export const metadata: Metadata = {
  title: "Clase gratis en vivo · AR Academy",
  description:
    "Los 10 pasos para trabajar como modelo profesional, en el orden en el que hay que darlos. Clase gratis en directo el sábado 5 de septiembre a las 19:00.",
};

const REGALOS = [
  {
    cuando: "TE LLEGA AHORA MISMO",
    ya: true,
    titulo: "LAS TARIFAS REALES DE 4 CASTINGS",
    texto: "Lo que se paga por una jornada y lo que se cobra aparte por los derechos. Capturas sin retocar.",
  },
  {
    cuando: "EN LA CLASE",
    titulo: "LA CHECKLIST DEL BOOK, EN 12 PUNTOS",
    texto: "Qué tiene que llevar y en qué orden. Y los errores que arruinan un book caro.",
  },
  {
    cuando: "EN LA CLASE",
    titulo: "5 PLANTILLAS PARA ESCRIBIRLE A UNA MARCA",
    texto: "El primer mensaje, la respuesta a un brief, la negociación y el «no» educado.",
  },
];

export default function MasterclassPage() {
  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <span className={styles.dot} aria-hidden="true" />
        <span>{CLASE.fechaLarga} · {CLASE.hora}</span>
        <span className={styles.cd}><CuentaAtras /></span>
      </div>

      <section className={styles.hero}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>CLASE GRATIS EN DIRECTO</p>
          <h1 className={styles.h1}>
            CASI TODAS EMPIEZAN POR EL <strong>PASO 8</strong>. POR ESO NADIE LAS LLAMA.
          </h1>
          <p className={styles.sub}>LOS 10 PASOS, EN ORDEN. EN DIRECTO Y GRATIS.</p>

          <MasterclassForm />

          <p className={styles.sinTodo}>
            SIN EXPERIENCIA. SIN AGENCIA. SIN IMPORTAR TU CIUDAD. SIN CUERPO PERFECTO.
          </p>
        </div>
      </section>

      <section className={styles.regalos}>
        <div className={styles.container}>
          <p className={styles.eyebrowDark}>AL RESERVAR TU PLAZA, ADEMÁS</p>
          <h2 className={styles.h2}>TE LLEVAS TRES COSAS MÁS</h2>

          <ul className={styles.listaRegalos}>
            {REGALOS.map((r) => (
              <li key={r.titulo} className={styles.regalo}>
                <span className={`${styles.cuando} ${r.ya ? styles.cuandoYa : ""}`}>
                  {r.cuando}
                </span>
                <h3 className={styles.regaloTitulo}>{r.titulo}</h3>
                <p className={styles.regaloTexto}>{r.texto}</p>
              </li>
            ))}
          </ul>

          <p className={styles.pieRegalos}>
            EL PRIMERO TE LLEGA AL CORREO EN CUANTO RESERVES. LOS OTROS DOS TE LOS DOY EN LA
            CLASE.
          </p>
        </div>
      </section>

      <section className={styles.horas}>
        <div className={styles.container}>
          <h2 className={styles.h2Claro}>A QUÉ HORA TE TOCA A TI</h2>
          <ul className={styles.listaHoras}>
            {HORAS_LOCALES.map((h) => (
              <li
                key={h.donde}
                className={`${styles.hora} ${h.destacada ? styles.horaDestacada : ""}`}
              >
                <span>{h.donde}</span>
                <span className={styles.horaValor}>{h.hora}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer variante="evento" />
    </main>
  );
}
