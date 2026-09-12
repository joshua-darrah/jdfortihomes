# JDFortiHomes Security, Privacy and Accessibility Audit

Audit date: 11 September 2026

## Fixed in this version

### Booking security
- Fixed the React `event.currentTarget.elements` null error by capturing the form element before asynchronous work.
- Public booking creation now goes through `/api/bookings`.
- Payment proof upload is server-side and the `payment-proofs` bucket is private.
- The Supabase service-role key is server-only.
- Booking input lengths and payment-proof file type/size are validated server-side.
- Published-property status is checked server-side before accepting a booking.
- A basic server-side rate limiter and honeypot are included to reduce automated abuse.
- Failed booking creation removes an already-uploaded payment proof.

### Admin
- Admin access continues to use the `is_admin()` security-definer helper to avoid recursive profile RLS.
- Payment proofs are shown through short-lived signed URLs to authorised administrators.
- Booking details include customer information, property, date/time, payment method, notes, status, consent record and payment proof.
- Listing media uploads validate MIME type and size on the client and the Supabase bucket also has file-size/MIME limits.
- Publishing requires an administrator to confirm media rights.
- Admin and booking pages are marked `noindex`.

### Privacy
- No analytics or advertising scripts are included.
- No third-party iframe embeds are included.
- Google Fonts was removed to avoid an unnecessary external font request.
- Booking collection is limited to the information needed to arrange and support a tour.
- Terms and Privacy Policy acceptance are recorded with the booking.
- Payment proofs are private.
- Contact information uses the JDFortiHomes contact supplied for this project; no invented phone number or physical address is shown.

### Accessibility
- Skip link added.
- Form controls have associated labels.
- Search filter controls have accessible labels.
- Gallery controls are keyboard-operable buttons with accessible names and pressed state.
- Images have meaningful alternative text; decorative thumbnails use empty alt text.
- Tables have captions and status controls have unique accessible labels.
- Error and success messages use alert/status semantics.
- Visible focus indicators added.
- Colour contrast was adjusted for body text, accent buttons and focus states.
- Reduced-motion support added.
- Core navigation remains available on small screens.
- Skeleton loaders added for listings and admin data.

## Legal-risk controls

The site now states that:
- a listing is not a guarantee of availability or ownership;
- a tour request is not a tenancy agreement;
- customers must verify property information before paying rent/deposits;
- the tour fee is separate from rent/deposits;
- third-party property media must be authorised before publication;
- the refund policy applies to the JDFortiHomes tour fee, not automatically to money paid directly to a property owner; and
- liability exclusions do not attempt to remove rights that cannot legally be excluded.

## Remaining launch controls that cannot be solved only in source code

1. Obtain qualified Ghanaian legal review of the Terms, Privacy, Cookies and Refund Policy.
2. Complete any Data Protection Commission registration, Data Protection Supervisor appointment and related compliance work required for JDFortiHomes.
3. Replace demo properties and Unsplash demo imagery with authorised real inventory/media.
4. Configure real payment instructions.
5. Configure the production Supabase service-role key only in the server environment.
6. Test the deployed site with keyboard-only navigation, a screen reader, Lighthouse and axe.
7. Test Supabase RLS with separate admin and non-admin accounts.
8. Define and implement JDFortiHomes' actual data-retention/deletion schedule.
9. Establish a real customer-support and refund process.
10. Deploy behind HTTPS and keep all secrets out of source control.

This audit is an engineering review, not a legal certification, WCAG certification or guarantee that a legal claim can never occur.
