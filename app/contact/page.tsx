import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Contact JDFortiHomes", description: "Contact JDFortiHomes about accommodation enquiries, property tours, bookings, listings and privacy requests." };


import { siteConfig } from "@/lib/site-config";

export default function ContactPage() {
  return (
    <main className="legal-page">
      <div className="container legal-wrap">
        <div className="eyebrow">Contact</div>
        <h1>Contact JDFortiHomes</h1>
        <p className="legal-intro">
          For accommodation enquiries, booking questions, corrections to listing
          information, privacy requests or complaints, contact the team using
          the details below.
        </p>
        <div className="contact-grid">
          <section className="panel">
            <h2>JDFortiHomes</h2>
            <p>
              JDFortiHomes is an accommodation discovery and property-tour platform in Ghana.
            </p>
            <a className="button accent" href={`mailto:${siteConfig.email}`}>Email JDFortiHomes</a>
            <dl className="contact-details">
              <div><dt>Email</dt><dd><a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a></dd></div>
              <div><dt>Country</dt><dd>{siteConfig.country}</dd></div>
            </dl>
          </section>
          <section className="panel">
            <h2>Before contacting us</h2>
            <p>
              Please include your booking reference when asking about a tour.
              Do not send passwords, card PINs, full bank credentials or other
              information that is not needed to resolve your request.
            </p>
            <p>
              If your request concerns personal data, you can also read our
              <Link href="/privacy"> privacy policy</Link> for the information we
              need to handle your request.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
