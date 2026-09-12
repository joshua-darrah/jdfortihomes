import { LegalPage } from "@/components/LegalPage";
import { siteConfig } from "@/lib/site-config";

export default function RefundsPage() {
  return (
    <LegalPage
      eyebrow="Payments"
      title="Tour Fee and Refund Policy"
      intro={`Last updated: 11 September 2026. This policy applies to the manual tour fee used by ${siteConfig.name}. It does not determine the rent, deposit or other charges imposed by a property owner or representative.`}
    >
      <h2>1. What the tour fee covers</h2>
      <p>
        The tour fee is for arranging a guided property visit. It is separate from
        rent, security deposits, agency charges or other property-related amounts.
        Paying a tour fee does not reserve or guarantee a property.
      </p>

      <h2>2. When a refund may be available</h2>
      <p>
        If JDFortiHomes receives a tour payment but the requested tour cannot be
        arranged because of a platform-side or property-representative issue, you
        may request a refund. We may also refund a payment made in error where the
        transaction can be reasonably verified.
      </p>

      <h2>3. When a refund may not be available</h2>
      <p>
        A refund may not be available where a customer does not attend a confirmed
        tour, arrives outside the agreed time without reasonable notice, provides
        materially incorrect booking information, or the requested service was
        provided. This does not remove any rights that cannot lawfully be excluded.
      </p>

      <h2>4. How to request a refund</h2>
      <p>
        Email <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> with your
        booking reference, the date of the payment, the reason for the request and
        the relevant payment evidence. Do not send a PIN, password or one-time code.
      </p>

      <h2>5. Processing</h2>
      <p>
        We may need to verify the booking and payment before deciding a request.
        Approved refunds will be returned through an appropriate method agreed with
        the customer and permitted by the applicable payment provider and law.
      </p>

      <h2>6. Property payments are separate</h2>
      <p>
        Do not treat this policy as a promise to refund rent, deposits or other money
        paid directly to a landlord, owner or property representative. Those amounts
        are governed by the relevant agreement and applicable law.
      </p>
    </LegalPage>
  );
}
