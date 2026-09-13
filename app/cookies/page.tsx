import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn how JDFortiHomes uses essential browser storage and cookies."
};

export default function CookiesPage() {
  return (
    <LegalPage
      eyebrow="Cookies"
      title="Cookies and Browser Storage Policy"
      intro="Last updated: 13 September 2026. JDFortiHomes uses limited essential browser storage to operate the website and remember your privacy preference. The current platform does not use advertising or behavioural-tracking cookies."
    >
      <h2>1. What cookies and browser storage are</h2>
      <p>
        Cookies are small pieces of information stored by a website in your browser.
        Browser storage, including local storage, allows a website to remember small
        amounts of information on your device. JDFortiHomes uses essential browser
        storage rather than advertising or behavioural-tracking storage.
      </p>

      <h2>2. Essential JDFortiHomes storage</h2>
      <p>
        The public website uses local browser storage to remember that you have
        acknowledged the privacy and cookies notice. This prevents the notice from
        appearing on every page visit.
      </p>
      <p>
        The administrator area also uses the browser storage mechanism provided by
        the Supabase authentication client to maintain an authenticated administrator
        session. This storage is necessary for secure access to the private admin area.
      </p>

      <h2>3. Analytics and advertising</h2>
      <p>
        JDFortiHomes does not currently use Google Analytics, Meta Pixel, advertising
        cookies, cross-site behavioural advertising or similar optional tracking
        technologies.
      </p>

      <h2>4. Third-party media</h2>
      <p>
        Some demonstration property images may be loaded from Unsplash. Loading an
        external image can result in a request to the external provider, but JDFortiHomes
        does not use those images as an advertising or behavioural-tracking system.
      </p>

      <h2>5. Managing browser storage</h2>
      <p>
        You can clear cookies and browser storage through your browser settings. If you
        clear JDFortiHomes' essential storage, the privacy notice may appear again and
        an administrator may need to authenticate again.
      </p>

      <h2>6. Changes to this policy</h2>
      <p>
        If JDFortiHomes introduces analytics, advertising or other non-essential
        tracking technologies, this policy and the site's consent experience will be
        updated to explain those technologies and how they are used.
      </p>
    </LegalPage>
  );
}
