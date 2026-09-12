import { LegalPage } from "@/components/LegalPage";

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      title="Cookies and Browser Storage Policy"
      intro="Last updated: 11 September 2026. JDFortiHomes currently does not use advertising, behavioural tracking or analytics cookies. This page describes the limited browser storage used by the current application."
    >
      <h2>1. Essential storage</h2>
      <p>
        The public site does not need advertising cookies to operate. The application
        may use browser storage for essential functionality, including remembering
        that you have acknowledged this notice and maintaining an authenticated
        administrator session.
      </p>

      <h2>2. No analytics currently enabled</h2>
      <p>
        The current codebase does not include Google Analytics, Meta Pixel, advertising
        trackers or other optional analytics scripts. If analytics are added later,
        the privacy and consent experience should be updated before deployment.
      </p>

      <h2>3. Third-party content</h2>
      <p>
        Demo property images may be loaded from Unsplash. These are external image
        resources rather than embedded tracking widgets. Production listings should
        use media for which JDFortiHomes has the necessary rights or permission.
      </p>

      <h2>4. Managing storage</h2>
      <p>
        You can clear browser storage through your browser settings. Clearing
        essential authentication storage can sign an administrator out and clearing
        the consent value can cause this notice to appear again.
      </p>

      <h2>5. Changes</h2>
      <p>
        If optional cookies or tracking technologies are introduced, this policy will
        be updated and the consent mechanism will be changed where required.
      </p>
    </LegalPage>
  );
}
