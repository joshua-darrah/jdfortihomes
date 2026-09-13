import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Read the JDFortiHomes policy for tour-fee refunds and booking-related payments."
};

export default function RefundsPage() {
  return (
    <LegalPage
      eyebrow="Payments"
      title="Tour Fee and Refund Policy"
      intro={`Last updated: 13 September 2026. This policy explains refunds for the JDFortiHomes tour fee. It does not govern rent, deposits or other amounts paid directly to a property owner or representative.`}
    >
      <h2>1. What the tour fee covers</h2>
      <p>
        The JDFortiHomes tour fee covers the service of arranging a guided visit to a
        selected property. It is separate from rent, security deposits, agency fees,
        utility charges and other property-related payments.
      </p>
      <p>
        Paying the tour fee does not reserve the property and does not guarantee that
        the customer will enter into a tenancy agreement.
      </p>

      <h2>2. Full refunds</h2>
      <p>
        A customer is entitled to a full refund of the tour fee when JDFortiHomes is
        unable to provide the requested tour because of a JDFortiHomes-side failure,
        or when the relevant property representative cannot provide the confirmed tour
        and no suitable alternative appointment is accepted.
      </p>
      <p>
        A full refund is also available where the same tour fee was paid more than once
        for the same booking and the duplicate payment is verified.
      </p>

      <h2>3. Rescheduling</h2>
      <p>
        When a confirmed tour cannot take place at the agreed time, JDFortiHomes may
        offer a new appointment. A customer may choose the rescheduled tour instead of
        a refund where a suitable appointment is available.
      </p>

      <h2>4. When a refund is not normally available</h2>
      <p>
        The tour fee is normally non-refundable when the customer does not attend a
        confirmed tour, arrives too late for the agreed appointment, provides materially
        incorrect booking information, or has already received the requested tour
        service.
      </p>
      <p>
        This does not remove any refund, cancellation or consumer right that cannot
        lawfully be excluded.
      </p>

      <h2>5. Payment errors</h2>
      <p>
        If you believe you have made an incorrect or duplicate payment, contact
        JDFortiHomes promptly. We will verify the booking and payment information before
        processing an approved refund.
      </p>

      <h2>6. How to request a refund</h2>
      <p>
        Email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> with your
        booking reference, payment date, reason for the request and payment evidence.
        Never send a PIN, password, one-time authentication code or card security code.
      </p>

      <h2>7. Refund processing</h2>
      <p>
        Approved refunds are processed within ten business days after the refund is
        approved. The actual time for the funds to appear can depend on the payment
        provider or financial institution used for the original payment.
      </p>

      <h2>8. Property payments are separate</h2>
      <p>
        This policy applies only to payments made for the JDFortiHomes tour service.
        Rent, deposits, agency charges and other money paid directly to a landlord,
        property owner or representative are governed by the relevant agreement and
        applicable law and are not refunded by JDFortiHomes under this policy.
      </p>

      <h2>9. Contact</h2>
      <p>
        Refund requests and payment enquiries: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
      </p>
    </LegalPage>
  );
}
