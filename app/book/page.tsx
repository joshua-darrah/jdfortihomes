import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import { demoListings } from "@/lib/demo-listings";

async function getListing(id: string): Promise<Listing | null> {
  if (!supabase) return demoListings.find((item) => item.id === id) || null;
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .or("visibility_starts_at.is.null,visibility_starts_at.lte." + new Date().toISOString())
    .or("visibility_ends_at.is.null,visibility_ends_at.gt." + new Date().toISOString())
    .maybeSingle();
  return data as Listing | null;
}

export default async function BookPage({
  searchParams
}: {
  searchParams: Promise<{ listing?: string }>;
}) {
  const params = await searchParams;
  if (!params.listing) notFound();

  const listing = await getListing(params.listing);
  if (!listing) notFound();

  return (
    <main className="form-page">
      <div className="container form-wrap">
        <div className="eyebrow">Property tour</div>
        <h1 style={{ fontSize: 44, marginBottom: 8 }}>Book a guided visit</h1>
        <p className="location" style={{ lineHeight: 1.7, marginBottom: 24 }}>
          You are booking a tour for <strong>{listing.title}</strong> in{" "}
          {listing.location}, {listing.city}.
        </p>
        <BookingForm listing={listing} />
      </div>
    </main>
  );
}
