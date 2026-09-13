import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read how JDFortiHomes collects, uses, protects and retains personal information for property-tour bookings and support."
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro={`Last updated: 13 September 2026. This Privacy Policy explains how ${siteConfig.name} collects, uses, stores, shares and protects personal information when you use the platform.`}
    >
      <h2>1. Information covered by this policy</h2>
      <p>
        This policy applies to personal information submitted through JDFortiHomes,
        including information provided when requesting a property tour, contacting
        support or submitting a payment proof.
      </p>

      <h2>2. Information we collect</h2>
      <p>For a property-tour booking, JDFortiHomes collects information such as:</p>
      <ul>
        <li>your full name;</li>
        <li>phone number;</li>
        <li>email address;</li>
        <li>preferred tour date and time;</li>
        <li>the property selected for the tour;</li>
        <li>payment method and payment proof supplied by you; and</li>
        <li>additional information you voluntarily provide in the booking form.</li>
      </ul>
      <p>
        The platform does not request passwords, mobile-money PINs, one-time
        authentication codes, card PINs or CVVs through the booking process. Do not
        include these credentials in messages or uploaded documents.
      </p>

      <h2>3. How we use your information</h2>
      <ul>
        <li>to receive, process and manage property-tour requests;</li>
        <li>to communicate about bookings, tours and property availability;</li>
        <li>to verify submitted payment evidence;</li>
        <li>to provide customer support and respond to complaints or requests;</li>
        <li>to prevent fraud, abuse and unauthorised activity;</li>
        <li>to maintain transaction, accounting and business records;</li>
        <li>to maintain the security and reliability of the platform; and</li>
        <li>to comply with applicable legal obligations and respond to lawful requests.</li>
      </ul>

      <h2>4. Lawful and fair processing</h2>
      <p>
        JDFortiHomes processes personal information for specific and legitimate
        purposes, collects information that is relevant to those purposes, and takes
        reasonable steps to keep information accurate and secure. Where consent is
        used as the basis for a particular processing activity, the relevant form or
        notice will request that consent.
      </p>

      <h2>5. Who receives your information</h2>
      <p>
        Booking information may be shared with the property owner or representative
        responsible for arranging the requested tour. Access is limited to information
        needed to provide the service.
      </p>
      <p>
        JDFortiHomes also uses Supabase for application infrastructure, including
        database, authentication and file storage. Information processed by a service
        provider is handled for the purposes described in this policy and protected
        through the security controls available within the platform.
      </p>
      <p>
        JDFortiHomes does not sell customer booking information to third parties and
        does not use booking information for behavioural advertising.
      </p>

      <h2>6. Payment proofs</h2>
      <p>
        Payment proofs submitted through a booking are stored in private application
        storage. They are accessible only to authorised administrators who need the
        information to verify a booking or payment.
      </p>
      <p>
        Payment proofs should contain only the information necessary to demonstrate the
        payment. Customers should hide unrelated account details and never upload a
        PIN, password, authentication code or other secret credential.
      </p>

      <h2>7. How long we keep information</h2>
      <p>
        JDFortiHomes keeps personal information for the following periods:
      </p>
      <ul>
        <li>
          <strong>Completed bookings and payment records:</strong> six years from the
          date of the relevant transaction.
        </li>
        <li>
          <strong>Cancelled, rejected or unsuccessful booking requests:</strong> twelve
          months from the last activity on the request.
        </li>
        <li>
          <strong>Customer support correspondence:</strong> two years from the last
          support activity, unless it forms part of a transaction or dispute record.
        </li>
        <li>
          <strong>Security and administrative logs:</strong> up to twenty-four months
          for security, fraud-prevention and audit purposes.
        </li>
      </ul>
      <p>
        Information is deleted or anonymised when the applicable retention period ends,
        unless a longer period is required for an active dispute, legal obligation,
        accounting or tax record, fraud investigation, security matter or enforcement
        of a legal right.
      </p>

      <h2>8. Your privacy rights</h2>
      <p>
        Subject to applicable Ghanaian law, you may request access to personal
        information held about you, correction of inaccurate information, information
        about how it is being used, or deletion/destruction where JDFortiHomes no
        longer has a lawful reason to retain it. You may also raise an objection to
        certain processing where the law gives you that right.
      </p>
      <p>
        Send a privacy request to <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        JDFortiHomes may ask for enough information to verify the request before making
        changes to personal information.
      </p>

      <h2>9. Security</h2>
      <p>
        JDFortiHomes uses reasonable technical and organisational safeguards for the
        information handled through the platform. These include access controls,
        authenticated administrator access, private storage for payment proofs and
        limited collection of personal information.
      </p>
      <p>
        No online service can guarantee absolute security. If JDFortiHomes becomes
        aware of a personal-data incident requiring notification, it will handle the
        incident and required notifications in accordance with applicable law.
      </p>

      <h2>10. International and third-party processing</h2>
      <p>
        Some technology providers used by JDFortiHomes may process or store information
        outside Ghana. Supabase provides the database, authentication and storage
        infrastructure used by the application. JDFortiHomes uses appropriate access
        controls and service configurations to protect information processed through
        these services.
      </p>

      <h2>11. Children</h2>
      <p>
        JDFortiHomes is intended for people who are legally able to enter into the
        relevant accommodation or service arrangements. The platform does not
        knowingly collect personal information from children for independent use of
        the service.
      </p>

      <h2>12. Ghana data protection</h2>
      <p>
        JDFortiHomes handles personal information in accordance with the principles of
        Ghana's Data Protection Act, 2012 (Act 843), including lawful processing,
        purpose limitation, data minimisation, transparency, accuracy, security and
        responsible retention.
      </p>
      <p>
        Information about Ghana's data-protection framework is available from the{" "}
        <a href="https://dpc.gov.gh" target="_blank" rel="noreferrer">
          Data Protection Commission
        </a>.
      </p>

      <h2>13. Changes to this policy</h2>
      <p>
        JDFortiHomes may update this policy when its services, technology or legal
        requirements change. The date at the top of this page identifies the current
        version.
      </p>

      <h2>14. Contact</h2>
      <p>
        Privacy questions and requests: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
      </p>
    </LegalPage>
  );
}
