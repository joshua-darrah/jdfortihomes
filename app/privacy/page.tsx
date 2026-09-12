import { LegalPage } from "@/components/LegalPage";
import { siteConfig } from "@/lib/site-config";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro={`Last updated: 11 September 2026. This notice explains how ${siteConfig.name} handles the limited personal information needed to operate property-tour bookings and related support.`}
    >
      <h2>1. Who controls the information</h2>
      <p>
        JDFortiHomes is responsible for the personal information processed through
        this platform and uses it only for the purposes described in this notice.
      </p>

      <h2>2. Information we collect</h2>
      <p>For a tour booking, the platform currently collects only information needed to process the request:</p>
      <ul>
        <li>full name;</li>
        <li>phone number;</li>
        <li>email address;</li>
        <li>preferred tour date and time;</li>
        <li>the selected property;</li>
        <li>payment method and payment proof supplied by you; and</li>
        <li>optional additional information that you choose to include.</li>
      </ul>
      <p>
        We do not ask for passwords, card PINs, authentication codes or other
        unnecessary financial credentials. Please do not include them in forms or
        uploaded files.
      </p>

      <h2>3. Why we use the information</h2>
      <ul>
        <li>to receive and manage tour requests;</li>
        <li>to communicate about a booking or property tour;</li>
        <li>to review submitted payment evidence;</li>
        <li>to prevent abuse and protect the security of the platform;</li>
        <li>to keep necessary business and transaction records; and</li>
        <li>to respond to support, privacy or legal requests.</li>
      </ul>

      <h2>4. Legal basis and consent</h2>
      <p>
        We aim to process personal information lawfully, transparently and only to
        the extent necessary for the stated purpose. Where consent is required, the
        booking form asks for it before submission. You can contact us to ask about
        withdrawal, correction or deletion where applicable. Some records may need
        to be retained where required for a transaction, security, accounting or
        legal purpose.
      </p>

      <h2>5. Sharing</h2>
      <p>
        We may share booking information with the property representative who needs
        it to arrange the requested tour. We may also use infrastructure providers
        such as Supabase to host the application's database, authentication and
        file storage. We do not sell booking information or use it for advertising.
      </p>

      <h2>6. Payment proofs</h2>
      <p>
        Uploaded payment proofs are stored in a private storage area and are intended
        to be accessible only to authorised administrators. They should contain only
        the information necessary to demonstrate the payment. Where possible, hide
        unrelated account information before uploading a proof.
      </p>

      <h2>7. Retention</h2>
      <p>
        We intend to keep personal information only for as long as reasonably needed
        for the booking, support, security, accounting and legal purposes for which
        it was collected. A specific retention schedule should be approved by the
        operator before launch and applied to old bookings and payment proofs.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Subject to applicable Ghanaian law, you may ask us to explain our processing,
        correct inaccurate information, object to certain processing, or request
        deletion/destruction where we are no longer required to retain the data.
        Send requests to <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
      </p>

      <h2>9. Security</h2>
      <p>
        We use access controls and private storage for sensitive booking files and
        limit collection to information needed for the service. No internet service
        can guarantee absolute security, so users should also protect their own
        devices and avoid submitting unnecessary confidential information.
      </p>

      <h2>10. Third-party services and transfers</h2>
      <p>
        The current application uses Supabase for authentication, database and
        storage infrastructure. External services may process information in other
        jurisdictions. JDFortiHomes should review the provider's current terms,
        security documentation and applicable transfer requirements before launch.
      </p>

      <h2>11. Ghana data protection compliance</h2>
      <p>
        This policy is intended to reflect data-minimisation, purpose-limitation,
        transparency and security principles under Ghana's Data Protection Act,
        2012 (Act 843). JDFortiHomes should complete any registration, appointment,
        documentation and compliance steps required by the Data Protection
        Commission before processing personal data commercially. See the Data Protection Commission's current compliance guidance at <a href="https://dpc.gov.gh" target="_blank" rel="noreferrer">dpc.gov.gh</a>.
      </p>

      <h2>12. Contact</h2>
      <p>
        Privacy questions and requests: <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
      </p>
    </LegalPage>
  );
}
