import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CookieConsent } from "@/components/CookieConsent";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "JDFortiHomes | Find accommodation and book a property tour",
  description:
    "JDFortiHomes helps people discover accommodation and request guided property tours in Ghana.",
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <Header />
        <div id="main-content">{children}</div>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
