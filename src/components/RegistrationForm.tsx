"use client";

import { useState, useRef } from "react";
import styles from "./RegistrationForm.module.scss";
import ArrowIcon from "./ArrowIcon";
import { trackEvent } from "@/lib/tracking";

export { trackEvent };

const SKOOL_URL = "https://www.skool.com/ariannyrivasacademy/about";

const phonePrefixes = [
  { code: "+34", label: "ES" },
  { code: "+49", label: "DE" },
  { code: "+43", label: "AT" },
  { code: "+32", label: "BE" },
  { code: "+359", label: "BG" },
  { code: "+385", label: "HR" },
  { code: "+45", label: "DK" },
  { code: "+421", label: "SK" },
  { code: "+386", label: "SI" },
  { code: "+372", label: "EE" },
  { code: "+358", label: "FI" },
  { code: "+33", label: "FR" },
  { code: "+30", label: "GR" },
  { code: "+36", label: "HU" },
  { code: "+353", label: "IE" },
  { code: "+39", label: "IT" },
  { code: "+371", label: "LV" },
  { code: "+370", label: "LT" },
  { code: "+352", label: "LU" },
  { code: "+356", label: "MT" },
  { code: "+47", label: "NO" },
  { code: "+31", label: "NL" },
  { code: "+48", label: "PL" },
  { code: "+351", label: "PT" },
  { code: "+44", label: "UK" },
  { code: "+420", label: "CZ" },
  { code: "+40", label: "RO" },
  { code: "+46", label: "SE" },
  { code: "+41", label: "CH" },
  { code: "+1", label: "US" },
  { code: "+1", label: "CA" },
  { code: "+54", label: "AR" },
  { code: "+591", label: "BO" },
  { code: "+55", label: "BR" },
  { code: "+56", label: "CL" },
  { code: "+57", label: "CO" },
  { code: "+506", label: "CR" },
  { code: "+593", label: "EC" },
  { code: "+503", label: "SV" },
  { code: "+502", label: "GT" },
  { code: "+504", label: "HN" },
  { code: "+52", label: "MX" },
  { code: "+505", label: "NI" },
  { code: "+507", label: "PA" },
  { code: "+595", label: "PY" },
  { code: "+51", label: "PE" },
  { code: "+1809", label: "DO" },
  { code: "+598", label: "UY" },
  { code: "+58", label: "VE" },
];

export default function RegistrationForm() {
  const [prefix, setPrefix] = useState("+34");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    acceptTerms: false,
    acceptData: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Introduce tu nombre completo";
    if (!formData.email.trim())
      newErrors.email = "Introduce tu correo electrónico";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Introduce un correo electrónico válido";
    if (!formData.phone.trim())
      newErrors.phone = "Introduce tu número de teléfono";
    if (!formData.acceptTerms)
      newErrors.acceptTerms = "Debes aceptar los términos y condiciones";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);

    trackEvent("Lead", {
      content_name: "AR Academy",
      currency: "USD",
      value: 27,
    });

    fetch("/api/submit-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: `${prefix}${formData.phone}`,
      }),
      keepalive: true,
    }).catch((err) => console.error("Lead submission failed:", err));

    window.open(SKOOL_URL, "_blank", "noopener,noreferrer");

    const params = new URLSearchParams({
      name: formData.name,
      email: formData.email,
    });
    window.location.href = `/bienvenida?${params.toString()}`;
  };

  return (
    <div className={styles.formContainer} ref={formRef}>
      <div className={styles.formBody}>
        <div className={styles.registerStep}>
          <label className={styles.fieldLabel}>NOMBRE COMPLETO</label>
          <input
            className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
            type="text"
            name="name"
            placeholder="LAURA MARTÍNEZ"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && (
            <span className={styles.errorMsg}>{errors.name}</span>
          )}

          <label className={styles.fieldLabel}>CORREO ELECTRÓNICO</label>
          <input
            className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
            type="email"
            name="email"
            placeholder="LAURA.MARTINEZ@GMAIL.COM"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && (
            <span className={styles.errorMsg}>{errors.email}</span>
          )}

          <label className={styles.fieldLabel}>TELÉFONO</label>
          <div className={styles.phoneRow}>
            <select
              className={styles.phonePrefix}
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            >
              {phonePrefixes.map((p, i) => (
                <option key={`${p.label}-${i}`} value={p.code}>
                  {p.label} {p.code}
                </option>
              ))}
            </select>
            <input
              className={`${styles.phoneInput} ${errors.phone ? styles.inputError : ""}`}
              type="tel"
              name="phone"
              placeholder="612 345 678"
              autoComplete="tel-national"
              inputMode="numeric"
              value={formData.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9\s]/g, "");
                setFormData((prev) => ({ ...prev, phone: val }));
                if (errors.phone) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.phone;
                    return next;
                  });
                }
              }}
            />
          </div>
          {errors.phone && (
            <span className={styles.errorMsg}>{errors.phone}</span>
          )}

          <div className={styles.checkboxGroup}>
            <label
              className={`${styles.checkboxLabel} ${errors.acceptTerms ? styles.checkboxError : ""}`}
            >
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
              />
              <span>
                He leído y acepto los{" "}
                <strong>términos y condiciones</strong>.
              </span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="acceptData"
                checked={formData.acceptData}
                onChange={handleChange}
              />
              <span>
                Entiendo y acepto que mis datos sean almacenados y utilizados
                para fines informativos, incluyendo la posibilidad de ser
                compartidos con terceros con los que exista una relación
                contractual, como clientes, socios o colaboradores.
              </span>
            </label>
          </div>
          {errors.acceptTerms && (
            <span className={styles.errorMsg}>{errors.acceptTerms}</span>
          )}

          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={loading}
          >
            <span>{loading ? "ENVIANDO..." : "ACCEDER A LA COMUNIDAD"}</span>
            {!loading && <ArrowIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}
