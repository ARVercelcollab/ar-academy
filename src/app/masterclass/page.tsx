import type { Metadata } from "next";
import styles from "./page.module.scss";
import MasterclassForm from "@/components/MasterclassForm";
import CuentaAtras from "@/components/CuentaAtras";
import Footer from "@/components/Footer";
import { CLASE, HORAS_LOCALES } from "@/lib/masterclass";

export const metadata: Metadata = {
  title: "Masterclass gratuita · AR Academy",
  description:
    "Todo lo que necesitas en 2026/27 para que una marca te contrate. Consigue que te paguen sin agencias y sin contactos. Masterclass gratuita en directo, sábado 5 de septiembre a las 19:00.",
};

const REGALOS = [
  {
    cuando: "TE LLEGA AHORA MISMO",
    ya: true,
    titulo: "5 plantillas para escribirle a una marca",
    texto:
      "El primer mensaje, la respuesta a un brief, la negociación de la tarifa y el «no» educado.",
    icono: "mensaje" as const,
  },
  {
    cuando: "EN LA MASTERCLASS",
    titulo: "Las tarifas reales de 4 castings",
    texto:
      "Lo que se paga por una jornada y lo que se cobra aparte por los derechos de imagen.",
    icono: "documento" as const,
  },
  {
    cuando: "EN LA MASTERCLASS",
    titulo: "La checklist del book, en 12 puntos",
    texto: "Qué tiene que llevar y en qué orden. Y los errores que arruinan un book caro.",
    icono: "lista" as const,
  },
];

const ICONOS = {
  mensaje: (
    <path d="M20 14.5A2.5 2.5 0 0 1 17.5 17H9l-4 3.5V17h-.5A2.5 2.5 0 0 1 2 14.5v-8A2.5 2.5 0 0 1 4.5 4h13A2.5 2.5 0 0 1 20 6.5zM7 9h8M7 12.5h5" />
  ),
  documento: (
    <path d="M6 3h9l4 4v14H6zM15 3v4h4M9.5 12h5M9.5 15.5h5" />
  ),
  lista: (
    <path d="M4 6.5l2 2 3.5-3.5M4 13l2 2 3.5-3.5M4 19.5l2 2 3.5-3.5M13.5 7H20M13.5 13.5H20M13.5 20H20" />
  ),
};

export default function MasterclassPage() {
  return (
    <main className={styles.main}>
      <div className={styles.topBar}>
        <span className={styles.barraTexto}>
          LLEGAS A TIEMPO PARA LA MASTERCLASS
        </span>
        <span className={styles.barraCorto}>EMPIEZA EN</span>
        <CuentaAtras />
      </div>

      <section className={styles.hero}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>MASTERCLASS GRATUITA · {CLASE.fechaLarga}</p>
          <h1 className={styles.h1}>
            TE DOY <em className={styles.destacado}>GRATIS</em> TODO LO QUE NECESITAS EN 2026/27 PARA{" "}
            <em className={styles.destacado}>QUE UNA MARCA TE CONTRATE</em>
          </h1>
          <p className={styles.sub}>
            CONSIGUE QUE TE PAGUEN SIN AGENCIAS Y SIN CONTACTOS.
          </p>

          <MasterclassForm />

          <p className={styles.sinTodo}>
            SIN EXPERIENCIA. SIN IMPORTAR TU CIUDAD. SIN ENCAJAR EN ESTEREOTIPOS.
          </p>
        </div>
      </section>

      <section className={styles.regalos}>
        <div className={styles.container}>
          <div className={styles.tarjetaRegalos}>
            <p className={styles.eyebrowRegalos}>AL INSCRIBIRTE</p>
            <h2 className={styles.h2}>TE LLEVAS TRES COSAS MÁS</h2>

            <ul className={styles.listaRegalos}>
              {REGALOS.map((r) => (
                <li key={r.titulo} className={styles.regalo}>
                  <span className={styles.icono} aria-hidden="true">
                    <svg viewBox="0 0 24 24">{ICONOS[r.icono]}</svg>
                  </span>
                  <div>
                    <span className={`${styles.cuando} ${r.ya ? styles.cuandoYa : ""}`}>
                      {r.cuando}
                    </span>
                    <h3 className={styles.regaloTitulo}>{r.titulo}</h3>
                    <p className={styles.regaloTexto}>{r.texto}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className={styles.pieRegalos}>
              Las plantillas te llegan al correo en cuanto reserves. Lo demás te lo doy en la
              masterclass.
            </p>
          </div>
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
