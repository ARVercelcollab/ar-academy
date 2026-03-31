"use client";

import { useState, useEffect } from "react";
import styles from "./CookieBanner.module.scss";

const COOKIE_NAME = "cookie_consent";

function getConsent(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + COOKIE_NAME + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setConsent(value: "accepted" | "rejected") {
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/** Check if the user has accepted cookies. Use this before loading analytics/tracking. */
export function hasConsentedCookies(): boolean {
  return getConsent() === "accepted";
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) {
      setVisible(true);
    }
  }, []);

  function handleAccept() {
    setConsent("accepted");
    setVisible(false);
  }

  function handleReject() {
    setConsent("rejected");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.container}>
        <p className={styles.text}>
          Utilizamos cookies propias y de terceros para mejorar tu experiencia.
          No se activan cookies de seguimiento hasta que aceptes.{" "}
          <a href="/legal/politica-cookies" className={styles.link}>
            Política de cookies
          </a>
        </p>
        <div className={styles.buttons}>
          <button className={styles.btnReject} onClick={handleReject}>
            Rechazar
          </button>
          <button className={styles.btnAccept} onClick={handleAccept}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
