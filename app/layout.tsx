import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CookieConsent } from "@/components/CookieConsent";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSiteUrl, siteKeywords } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JDFortiHomes | Find accommodation in Ghana",
    template: "%s | JDFortiHomes"
  },
  description:
    "Find accommodation in Ghana, compare properties and book guided property tours with JDFortiHomes.",
  keywords: siteKeywords,
  applicationName: "JDFortiHomes",
  authors: [{ name: "JDFortiHomes" }],
  creator: "JDFortiHomes",
  publisher: "JDFortiHomes",
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: siteUrl,
    siteName: "JDFortiHomes",
    title: "JDFortiHomes | Find accommodation in Ghana",
    description:
      "Find accommodation in Ghana, compare properties and book guided property tours with JDFortiHomes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "JDFortiHomes — Find, Book, Feel at Home"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "JDFortiHomes | Find accommodation in Ghana",
    description:
      "Find accommodation in Ghana, compare properties and book guided property tours.",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "JDFortiHomes",
        url: siteUrl,
        logo: `${siteUrl}/icon.png`,
        email: "mailto:jdfortihomes@gmail.com",
        areaServed: "Ghana"
      },
      {
        "@type": "WebSite",
        name: "JDFortiHomes",
        url: siteUrl,
        description:
          "Accommodation discovery and property-tour booking platform in Ghana."
      }
    ]
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <Header />
        <div id="main-content">{children}</div>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
