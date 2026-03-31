"use client";

import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import styles from "./RegistrationForm.module.scss";
import ArrowIcon from "./ArrowIcon";
import StripeLogo from "./StripeLogo";
import { trackEvent } from "@/lib/tracking";

export { trackEvent };

type Step = "register" | "payment";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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
  { code: "+53", label: "CU" },
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

interface UserData {
  name: string;
  email: string;
  phone: string;
}

function PaymentStep({
  userData,
  onBack,
  onSuccess,
  onError,
}: {
  userData: UserData;
  onBack: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const { error: setupError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: "if_required",
    });

    if (setupError) {
      setError(setupError.message || "Error al validar la tarjeta");
      setLoading(false);
      return;
    }

    if (!setupIntent?.payment_method) {
      setError("No se pudo validar el método de pago");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...userData,
          paymentMethodId:
            typeof setupIntent.payment_method === "string"
              ? setupIntent.payment_method
              : setupIntent.payment_method.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        trackEvent("Purchase", { content_name: "AR Academy", currency: "USD", value: 27 });
        window.location.href = "/bienvenida";
        return;
      } else if (data.requiresAction && data.clientSecret) {
        const { error: confirmError } = await stripe.confirmPayment({
          clientSecret: data.clientSecret,
          confirmParams: {
            return_url: window.location.origin + "?success=true",
          },
        });
        if (confirmError) {
          setError(
            confirmError.message || "Error en la verificación 3D Secure"
          );
        } else {
          onSuccess();
        }
      } else {
        setError(data.error || "Error al procesar el pago");
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    }

    setLoading(false);
  };

  return (
    <div className={styles.paymentStep}>
      <div className={styles.paymentHeader}>
        <StripeLogo className={styles.stripeLogo} />
      </div>
      <PaymentElement
        options={{
          layout: "tabs",
          terms: { card: "never" },
        }}
      />
      {error && <p className={styles.errorMsg}>{error}</p>}
      <div className={styles.paymentActions}>
        <button
          className={styles.backBtn}
          onClick={onBack}
          type="button"
          disabled={loading}
        >
          VOLVER
        </button>
        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={loading || !stripe}
        >
          <span>{loading ? "PROCESANDO..." : "CONTRATAR"}</span>
          {!loading && <ArrowIcon />}
        </button>
      </div>
    </div>
  );
}

const stripeAppearance = {
  theme: "flat" as const,
  variables: {
    fontFamily: "aktiv-grotesk, sans-serif",
    fontWeightNormal: "300",
    fontWeightMedium: "500",
    fontSizeBase: "14px",
    colorPrimary: "#161616",
    colorBackground: "#ffffff",
    colorText: "#161616",
    colorTextPlaceholder: "#969696",
    borderRadius: "0px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid #ccc",
      padding: "10px 14px",
      fontSize: "14px",
      letterSpacing: "-0.28px",
    },
    ".Input:focus": {
      border: "1px solid #666",
      boxShadow: "none",
    },
    ".Label": {
      fontSize: "14px",
      fontWeight: "300",
      letterSpacing: "-0.14px",
      textTransform: "uppercase" as const,
    },
    ".Tab": {
      border: "1px solid #ccc",
      fontWeight: "300",
    },
    ".Tab--selected": {
      backgroundColor: "#161616",
      color: "#eeeeee",
      border: "1px solid #161616",
    },
  },
};

export default function RegistrationForm() {
  const [step, setStep] = useState<Step>("register");
  const [prefix, setPrefix] = useState("+34");
  const [clientSecret, setClientSecret] = useState("");
  const [success, setSuccess] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    acceptTerms: false,
    acceptData: false,
  });

  // Preload SetupIntent on mount so step 2 is instant
  useEffect(() => {
    fetch("/api/create-setup", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
      })
      .catch(() => {});
  }, []);

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

  const scrollToForm = () => {
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleContinue = () => {
    if (validate()) {
      trackEvent("Lead", { content_name: "AR Academy", currency: "USD", value: 27 });
      trackEvent("InitiateCheckout", { content_name: "AR Academy", currency: "USD", value: 27 });
      setStep("payment");
      scrollToForm();
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  if (success) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.successMessage}>
          <h3>¡Bienvenida a AR Academy!</h3>
          <p>
            Tu suscripción se ha activado correctamente. Revisa tu correo
            electrónico para acceder a la comunidad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {notification && (
        <div
          className={`${styles.notification} ${notification.type === "error" ? styles.notificationError : styles.notificationSuccess}`}
        >
          {notification.message}
        </div>
      )}

      <div className={styles.formContainer} ref={formRef}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${step === "register" ? styles.active : ""}`}
            onClick={() => {
              setStep("register");
              scrollToForm();
            }}
          >
            1. CREAR CUENTA
          </button>
          <button
            className={`${styles.tab} ${step === "payment" ? styles.active : ""}`}
          >
            2. EL PAGO
          </button>
        </div>

        <div className={styles.formBody}>
          {step === "register" ? (
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
                  value={formData.phone}
                  onChange={handleChange}
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
              {errors.general && (
                <span className={styles.errorMsg}>{errors.general}</span>
              )}

              <button className={styles.submitBtn} onClick={handleContinue}>
                <span>CONTINUAR</span>
                <ArrowIcon />
              </button>
            </div>
          ) : clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: stripeAppearance,
                locale: "es",
              }}
            >
              <PaymentStep
                userData={{
                  name: formData.name,
                  email: formData.email,
                  phone: `${prefix}${formData.phone}`,
                }}
                onBack={() => {
                  setStep("register");
                  scrollToForm();
                }}
                onSuccess={() => {
                  setSuccess(true);
                  showNotification(
                    "success",
                    "¡Pago procesado correctamente! Bienvenida a AR Academy."
                  );
                  scrollToForm();
                }}
                onError={(msg) => showNotification("error", msg)}
              />
            </Elements>
          ) : (
            <div className={styles.loadingPayment}>
              <p>Cargando formulario de pago...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
