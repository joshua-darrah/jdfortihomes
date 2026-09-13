export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export const siteKeywords = [
  "JDFortiHomes",
  "accommodation in Ghana",
  "rooms for rent in Ghana",
  "apartments in Ghana",
  "houses for rent in Ghana",
  "student accommodation Ghana",
  "property tours Ghana",
  "find a place to rent Ghana"
];
