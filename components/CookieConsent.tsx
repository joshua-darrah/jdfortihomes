"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "jdfortihomes-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(STORAGE_KEY) !== "accepted");
  }, []);

  if (!visible) return null;

  return (
    <aside className="cookie-banner" aria-label="Cookie and storage notice">
      <div>
        <strong>Privacy and cookies</strong>
        <p>
          JDFortiHomes uses essential browser storage for site functionality and your
          privacy preference. We do not use advertising or behavioural-tracking cookies.
        </p>
        <Link href="/cookies">Read the cookies policy</Link>
      </div>
      <button
        className="button accent small"
        type="button"
        onClick={() => {
          window.localStorage.setItem(STORAGE_KEY, "accepted");
          setVisible(false);
        }}
      >
        Accept
      </button>
    </aside>
  );
}
