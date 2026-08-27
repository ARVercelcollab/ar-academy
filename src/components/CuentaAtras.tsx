"use client";

import { useEffect, useState } from "react";
import styles from "./CuentaAtras.module.scss";
import { CLASE } from "@/lib/masterclass";

const UNIDADES = ["DÍAS", "HORAS", "MIN", "SEG"] as const;

/** Cuenta atrás real contra la fecha de la clase. La hora existe: no hay urgencia inventada. */
export default function CuentaAtras() {
  const [partes, setPartes] = useState<number[] | null>(null);
  const [empezada, setEmpezada] = useState(false);

  useEffect(() => {
    const objetivo = new Date(CLASE.fechaISO).getTime();

    const pinta = () => {
      const ms = objetivo - Date.now();
      if (ms <= 0) {
        setEmpezada(true);
        return;
      }
      setPartes([
        Math.floor(ms / 86400000),
        Math.floor(ms / 3600000) % 24,
        Math.floor(ms / 60000) % 60,
        Math.floor(ms / 1000) % 60,
      ]);
    };

    pinta();
    const id = setInterval(pinta, 1000);
    return () => clearInterval(id);
  }, []);

  if (empezada) return <span className={styles.enDirecto}>EN DIRECTO AHORA</span>;

  // Nada hasta que monta en cliente: el servidor no puede saber la hora del visitante.
  if (!partes) return <span className={styles.hueco} aria-hidden="true" />;

  return (
    <span className={styles.caja} suppressHydrationWarning>
      {partes.map((v, i) => (
        <span key={UNIDADES[i]} className={styles.unidad}>
          <span className={styles.numero}>{String(v).padStart(2, "0")}</span>
          <span className={styles.etiqueta}>{UNIDADES[i]}</span>
        </span>
      ))}
    </span>
  );
}
