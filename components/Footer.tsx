import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand-lockup">
            <img
              src="/jdfortihomes-mark.png"
              alt="JDFortiHomes"
              className="footer-brand-mark"
              width={1550}
              height={793}
            />
            <div className="brand footer-brand"><span>JD</span>Forti<span className="footer-brand-home">Homes</span></div>
          </div>
          <p>
            JDFortiHomes is an accommodation discovery and property-tour
            platform. Property availability and
            information should be verified before any rental decision or payment.
          </p>
          <p>
            Contact: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          </p>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/contact">Contact</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/cookies">Cookies</Link>
          <Link href="/refunds">Refund policy</Link>
        </nav>
      </div>
    </footer>
  );
}
