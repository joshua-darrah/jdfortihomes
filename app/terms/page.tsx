import { LegalPage } from "@/components/LegalPage";
import { siteConfig } from "@/lib/site-config";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro={`Last updated: 11 September 2026. These terms govern your use of ${siteConfig.name}. They are written for the current accommodation-discovery and property-tour workflow and should be reviewed by Ghanaian legal counsel before commercial launch.`}
    >
      <h2>1. What JDFortiHomes does</h2>
      <p>
        JDFortiHomes provides a platform for discovering accommodation listings
        and requesting guided property tours. Unless a listing or separate written
        agreement expressly says otherwise, JDFortiHomes is not the landlord,
        property owner, tenant, estate agent or guarantor of a property shown on
        the platform.
      </p>

      <h2>2. Listing information</h2>
      <p>
        Listings may be supplied by property representatives or administrators.
        Information such as rent, availability, amenities, address, photographs,
        videos and property descriptions can change. You must verify important
        information during the tour and before making any rental payment or
        entering a tenancy agreement. A listing or tour request is not a promise
        that a property will remain available.
      </p>

      <h2>3. Tours and bookings</h2>
      <p>
        A booking is a request for a guided visit. It is not a tenancy agreement,
        reservation of the property, transfer of ownership or guarantee that you
        will obtain the property. A tour is only confirmed after JDFortiHomes or
        the relevant property representative confirms it.
      </p>

      <h2>4. Payments</h2>
      <p>
        The current platform workflow may require a manual tour fee. Payment
        instructions shown on the booking page must be checked carefully. Never
        send a password, PIN, one-time authentication code or card security code.
        A payment proof upload is evidence of a claimed payment; it does not by
        itself mean that a payment has been verified or that a tour is confirmed.
      </p>

      <h2>5. User responsibilities</h2>
      <p>
        You must provide accurate information, use the platform lawfully, avoid
        fraudulent or abusive activity, and only upload payment evidence and other
        content that you are authorised to provide. You must not attempt to access
        another person's account, booking, files or personal information.
      </p>

      <h2>6. Property and transaction decisions</h2>
      <p>
        You are responsible for inspecting a property, asking the questions needed
        for your circumstances, checking the identity and authority of the person
        offering the property, and reviewing any tenancy agreement before signing
        or paying a landlord or other third party. JDFortiHomes does not guarantee
        the condition, legality, ownership, availability or suitability of every
        property listed.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        JDFortiHomes and its original software, branding, text and interface are
        protected by applicable intellectual-property laws. Property media uploaded
        by users or representatives remains subject to the rights of its respective
        owner or licence holder. Do not upload media unless you have the necessary
        rights or permission.
      </p>

      <h2>8. Suspension and termination</h2>
      <p>
        We may restrict or suspend access where reasonably necessary to protect the
        platform, users, property representatives or personal data, including in
        response to suspected fraud, abuse, security incidents or unlawful use.
      </p>

      <h2>9. Availability and liability</h2>
      <p>
        The platform is provided subject to reasonable availability and maintenance.
        To the extent permitted by law, JDFortiHomes does not accept responsibility
        for losses caused by inaccurate third-party listing information, a landlord
        or property representative's conduct, a user's own decisions, payment made
        outside the platform, or events beyond reasonable control. Nothing in these
        terms excludes a liability that cannot lawfully be excluded in Ghana.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these terms when the service or law changes. The updated date
        at the top of this page will show when the current version took effect.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These terms are intended to operate under the laws of Ghana, subject to any
        mandatory rights or remedies available to you under applicable law.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these terms can be sent to <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
      </p>
    </LegalPage>
  );
}
