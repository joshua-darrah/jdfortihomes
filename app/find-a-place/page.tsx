import { RealtimeListings } from "@/components/RealtimeListings";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import { demoListings } from "@/lib/demo-listings";
import { AdBanner } from "@/components/AdBanner";
import { getActiveAds } from "@/lib/ads";

async function getListings(): Promise<Listing[]> {
  if (!supabase) return demoListings;
  const { data } = await supabase.from("listings").select("*").eq("status", "published").or("visibility_starts_at.is.null,visibility_starts_at.lte." + new Date().toISOString())
    .or("visibility_ends_at.is.null,visibility_ends_at.gt." + new Date().toISOString()).order("created_at", { ascending: false });
  return (data || []) as Listing[];
}

export default async function FindAPlacePage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const params = await searchParams;
  const [listings, directoryAds] = await Promise.all([
    getListings(),
    getActiveAds("directory_top")
  ]);
  return (
    <main className="browse-page">
      <section className="browse-hero"><div className="container"><div className="eyebrow">Property directory</div><h1>Find a place</h1><p>Browse available accommodation and compare properties by location, type, price and rooms.</p></div></section>
      <section className="section">
        <div className="container">
          <AdBanner ads={directoryAds} />
          <RealtimeListings initialListings={listings} initialSearch={params.q || ""} initialType={params.type || "All types"} />
        </div>
      </section>
    </main>
  );
}
