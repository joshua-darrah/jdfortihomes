import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the JDFortiHomes terms for accommodation discovery and property-tour bookings."
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro={`Last updated: 13 September 2026. These Terms of Service govern your use of ${siteConfig.name}, including property discovery, property-tour requests, bookings and related services.`}
    >
      <h2>1. About JDFortiHomes</h2>
      <p>
        JDFortiHomes is an accommodation discovery and property-tour platform in
        Ghana. The platform helps people find accommodation listings and request
        guided visits to properties.
      </p>
      <p>
        Unless a listing or separate written agreement expressly states otherwise,
        JDFortiHomes is not the landlord, property owner, tenant, estate agent,
        property manager or guarantor of a property displayed on the platform.
      </p>

      <h2>2. Using the platform</h2>
      <p>
        You must provide accurate information when making a booking or contacting
        JDFortiHomes. You must use the platform lawfully and must not attempt to
        access another person's account, booking, payment proof or personal
        information.
      </p>
      <p>
        Fraud, impersonation, harassment, abusive behaviour, unauthorised access,
        misleading information and attempts to interfere with the operation or
        security of the platform are prohibited.
      </p>

      <h2>3. Property listings</h2>
      <p>
        Property listings may contain information supplied by property owners,
        representatives or JDFortiHomes administrators. Listings can include rent,
        location, amenities, photographs, videos, availability and other details.
      </p>
      <p>
        Property information can change. A listing on JDFortiHomes does not by
        itself guarantee that the property is still available, that the stated price
        remains unchanged, or that every description, photograph or amenity is
        current. You should inspect the property and confirm important details before
        entering a tenancy agreement or making rent, deposit or other property
        payments.
      </p>

      <h2>4. Sponsored listings and advertisements</h2>
      <p>
        Some property listings may be promoted through paid advertising or sponsored
        placement on JDFortiHomes. Sponsored placement means that a property owner,
        representative or advertiser has paid for promotional visibility; it does not
        mean that JDFortiHomes guarantees the property, the advertiser, its price,
        availability, condition or suitability.
      </p>
      <p>
        Sponsored listings remain subject to the same platform requirements as other
        published listings, including requirements relating to accurate information
        and authorised property media.
      </p>

      <h2>5. Property tours and bookings</h2>
      <p>
        A booking is a request for a guided property visit. Submitting a booking does
        not create a tenancy agreement, reserve a property, transfer ownership or
        guarantee that you will obtain the property.
      </p>
      <p>
        A tour becomes confirmed only when JDFortiHomes or the relevant property
        representative confirms the appointment. JDFortiHomes may contact you using
        the information provided in your booking to arrange, confirm, reschedule or
        cancel a tour.
      </p>

      <h2>6. Tour fees and payments</h2>
      <p>
        JDFortiHomes may charge a tour fee for arranging a guided property visit.
        The current fee is displayed during the booking process. The tour fee is
        separate from rent, deposits, agency charges and other amounts charged by a
        property owner or representative.
      </p>
      <p>
        Payment instructions displayed by JDFortiHomes must be followed carefully.
        A payment proof upload is evidence of a claimed payment and does not by itself
        confirm that the payment has been received or that a tour has been confirmed.
      </p>
      <p>
        JDFortiHomes will never ask you to provide a password, mobile-money PIN,
        one-time authentication code, card PIN, CVV or other secret security
        credential through the booking form or by email.
      </p>

      <h2>7. Property payments and tenancy decisions</h2>
      <p>
        Rent, deposits, agency fees and other property-related payments are separate
        from the JDFortiHomes tour fee unless JDFortiHomes expressly states otherwise.
        Before paying a property owner or representative, you are responsible for
        verifying the person's identity and authority, inspecting the property,
        checking the agreed terms and reading the tenancy agreement carefully.
      </p>
      <p>
        JDFortiHomes does not guarantee the ownership, legality, physical condition,
        availability or suitability of every property listed on the platform.
      </p>

      <h2>8. Payment evidence and uploaded content</h2>
      <p>
        You must only upload payment evidence, photographs, documents or other content
        that you are authorised to provide. Do not upload unnecessary confidential
        information or another person's personal information without a lawful reason.
      </p>
      <p>
        JDFortiHomes may remove content or restrict access where content is unlawful,
        misleading, infringing, abusive, fraudulent or harmful to the platform or its
        users.
      </p>

      <h2>9. Intellectual property</h2>
      <p>
        JDFortiHomes and its original software, branding, interface, text and other
        original materials are protected by applicable intellectual-property laws.
        You may use the platform for its intended accommodation-discovery purpose but
        may not copy, reproduce, modify, distribute or commercially exploit JDFortiHomes
        materials without permission.
      </p>
      <p>
        Property photographs, videos, logos and other media remain subject to the
        rights of their respective owners or licence holders.
      </p>

      <h2>10. Suspension and termination</h2>
      <p>
        JDFortiHomes may suspend or restrict access to the platform where necessary to
        protect users, property representatives, personal information or the security
        and operation of the service. This includes cases involving suspected fraud,
        abuse, unlawful activity, unauthorised access or security threats.
      </p>

      <h2>11. Service availability and liability</h2>
      <p>
        JDFortiHomes aims to keep the platform available and accurate, but temporary
        interruptions may occur because of maintenance, network failures, hosting
        issues, third-party services or events outside reasonable control.
      </p>
      <p>
        To the extent permitted by law, JDFortiHomes is not responsible for losses
        arising from inaccurate third-party listing information, the conduct of a
        landlord or property representative, a user's decision to rent or pay for a
        property, payments made outside the platform, or events beyond JDFortiHomes'
        reasonable control. Nothing in these terms limits a right or liability that
        cannot lawfully be limited or excluded.
      </p>

      <h2>12. Complaints and disputes</h2>
      <p>
        If you have a complaint about a booking, property listing, tour or payment,
        contact JDFortiHomes at the email address below with your booking reference
        and relevant details. We will review the matter and communicate the outcome
        using the contact information provided.
      </p>
      <p>
        These terms do not prevent you from exercising any rights or remedies available
        to you under applicable Ghanaian law.
      </p>

      <h2>13. Changes to these terms</h2>
      <p>
        JDFortiHomes may update these terms when the platform, services or applicable
        requirements change. The date at the top of this page identifies the current
        version. Continued use of the platform after an update constitutes acceptance
        of the updated terms to the extent permitted by law.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These terms are governed by the laws of the Republic of Ghana. Any dispute
        relating to the use of JDFortiHomes will be handled through the appropriate
        dispute-resolution process and courts with jurisdiction in Ghana, subject to
        any mandatory legal rights available to the parties.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions, complaints or notices concerning these terms can be sent to{" "}
        <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
      </p>
    </LegalPage>
  );
}
