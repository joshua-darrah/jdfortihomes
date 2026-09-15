"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
  { href: "/find-a-place", label: "Find a place" },
  { href: "/#recommendations", label: "Recommended" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/contact", label: "Contact" }
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="container nav">
        <Link
          href="/"
          className="brand-lockup"
          aria-label="JDFortiHomes home"
          onClick={closeMenu}
        >
          <img
            src="/jdfortihomes-mark.png"
            alt=""
            className="brand-mark"
            width={512}
            height={512}
          />
          <span className="brand-wordmark" aria-hidden="true">
            <span>JDForti</span><span className="brand-wordmark-home">Homes</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="mobile-menu-button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={`mobile-nav ${menuOpen ? "open" : ""}`}
      >
        <nav className="container mobile-nav-links" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
