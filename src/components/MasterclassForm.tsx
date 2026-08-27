"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./MasterclassForm.module.scss";
import ArrowIcon from "./ArrowIcon";
import { phonePrefixes } from "@/lib/phonePrefixes";
import { CLASE } from "@/lib/masterclass";
import { trackEvent } from "@/lib/tracking";

type Errores = Partial<Record<"name" | "email" | "phone" | "instagram" | "terms" | "general", string>>;

export default function MasterclassForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [prefix, setPrefix] = useState("+34");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errores>({});
  const [loading, setLoading] = useState(false);

  const validar = () => {
    const e: Errores = {};
    if (!name.trim()) e.name = "Escribe tu nombre";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = "Revisa tu correo";
    if (phone.replace(/\D/g, "").length < 6) e.phone = "Revisa tu número";
    if (!instagram.trim()) e.instagram = "Escribe tu Instagram";
    if (!terms) e.terms = "Tienes que aceptar para continuar";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const enviar = async () => {
    if (loading || !validar()) return;
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/masterclass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: `${prefix}${phone.replace(/\D/g, "")}`,
          instagram: instagram.trim(),
          edicion: CLASE.edicion,
        }),
      });

      if (!res.ok) throw new Error("registro");

      trackEvent("Lead", { content_name: "Masterclass", edicion: CLASE.edicion });
      router.push("/masterclass/gracias");
    } catch {
      setErrors({ general: "No hemos podido guardar tu plaza. Inténtalo otra vez." });
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <p className={styles.cardTitle}>RESERVA TU PLAZA</p>

      <label className={styles.fieldLabel} htmlFor="mc-name">NOMBRE</label>
      <input
        id="mc-name"
        className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
        value={name}
        onChange={(ev) => setName(ev.target.value)}
        placeholder="Tu nombre"
        autoComplete="given-name"
      />
      {errors.name && <span className={styles.errorMsg}>{errors.name}</span>}

      <label className={styles.fieldLabel} htmlFor="mc-email">CORREO ELECTRÓNICO</label>
      <input
        id="mc-email"
        type="email"
        className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        placeholder="tunombre@gmail.com"
        autoComplete="email"
      />
      {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}

      <label className={styles.fieldLabel} htmlFor="mc-phone">NÚMERO DE WHATSAPP</label>
      <div className={styles.phoneRow}>
        <select
          className={styles.phonePrefix}
          value={prefix}
          onChange={(ev) => setPrefix(ev.target.value)}
          aria-label="Prefijo de país"
        >
          {phonePrefixes.map((p, i) => (
            <option key={`${p.code}-${p.label}-${i}`} value={p.code}>
              {p.label} {p.code}
            </option>
          ))}
        </select>
        <input
          id="mc-phone"
          type="tel"
          className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
          value={phone}
          onChange={(ev) => setPhone(ev.target.value)}
          placeholder="600 000 000"
          autoComplete="tel"
        />
      </div>
      {errors.phone && <span className={styles.errorMsg}>{errors.phone}</span>}

      <label className={styles.fieldLabel} htmlFor="mc-ig">TU INSTAGRAM</label>
      <input
        id="mc-ig"
        className={`${styles.input} ${errors.instagram ? styles.inputError : ""}`}
        value={instagram}
        onChange={(ev) => setInstagram(ev.target.value)}
        placeholder="@tuusuario"
      />
      <span className={styles.hint}>
        Para reconocerte si ya hemos hablado por ahí y no escribirte dos veces.
      </span>
      {errors.instagram && <span className={styles.errorMsg}>{errors.instagram}</span>}

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={terms}
          onChange={(ev) => setTerms(ev.target.checked)}
        />
        <span>
          He leído y acepto la <a href="/legal/politica-privacidad">política de privacidad</a>, y quiero recibir
          el acceso y los recordatorios de la clase por WhatsApp y por email.
        </span>
      </label>
      {errors.terms && <span className={styles.errorMsg}>{errors.terms}</span>}
      {errors.general && <span className={styles.errorMsg}>{errors.general}</span>}

      <button className={styles.submitBtn} onClick={enviar} disabled={loading} type="button">
        <span>{loading ? "GUARDANDO TU PLAZA…" : "RESERVAR MI PLAZA GRATIS"}</span>
        {!loading && <ArrowIcon />}
      </button>

      <p className={styles.micro}>
        GRATIS · EN DIRECTO<br />
        SI NO PUEDES EN VIVO, TE MANDO LA GRABACIÓN
      </p>
    </div>
  );
}
