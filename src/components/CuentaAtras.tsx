"use client";

import { useEffect, useState } from "react";
import { CLASE } from "@/lib/masterclass";

/** Cuenta atrás real contra la fecha de la clase. Nada inventado: la hora existe. */
export default function CuentaAtras() {
  const [texto, setTexto] = useState("");

  useEffect(() => {
    const objetivo = new Date(CLASE.fechaISO).getTime();
    const pinta = () => {
      const ms = objetivo - Date.now();
      if (ms <= 0) {
        setTexto("EN DIRECTO AHORA");
        return;
      }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor(ms / 3600000) % 24;
      const m = Math.floor(ms / 60000) % 60;
      setTexto(`EMPIEZA EN ${d}D ${h}H ${m}M`);
    };
    pinta();
    const id = setInterval(pinta, 30000);
    return () => clearInterval(id);
  }, []);

  // Sin texto hasta que monta en cliente: evita el desajuste de hidratación.
  return <span suppressHydrationWarning>{texto}</span>;
}
