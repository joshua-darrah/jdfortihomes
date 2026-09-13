import type { MetadataRoute } from "next";
import { demoListings } from "@/lib/demo-listings";
import { supabase } from "@/lib/supabase";
import { getSiteUrl } from "@/lib/seo";

const publicPages = [
  "/",
  "/find-a-place",
  "/contact",
  "/terms",
  "/privacy",
  "/cookies",
  "/refunds"
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date().toISOString();

  const entries: MetadataRoute.Sitemap = publicPages.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/find-a-place" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path === "/find-a-place" ? 0.9 : 0.5
  }));

  if (!supabase) {
    return entries;
  }

  const { data } = await supabase
    .from("listings")
    .select("id, updated_at")
    .eq("status", "published")
    .or(`visibility_starts_at.is.null,visibility_starts_at.lte.${now}`)
    .or(`visibility_ends_at.is.null,visibility_ends_at.gt.${now}`);

  const listingEntries: MetadataRoute.Sitemap = (data || []).map((listing) => ({
    url: `${siteUrl}/listing/${listing.id}`,
    lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8
  }));

  return [...entries, ...listingEntries];
}
