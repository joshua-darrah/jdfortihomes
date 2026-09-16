import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import { demoListings } from "@/lib/demo-listings";

export type ListingWithTourFee = Pick<Listing, "id" | "title" | "location" | "city"> & { tourFee: number };

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

async function getTourFee(listing: Listing) {
  if (!supabase) return listing.agent_fee ?? 50;
  const { data } = await supabase.rpc("get_public_tour_fee", {
    listing_record_id: listing.id
  });
  return Number(data ?? listing.agent_fee ?? 50);
}

async function getAvailableListings(): Promise<ListingWithTourFee[]> {
  if (!supabase) {
    return demoListings.map((item) => ({
      id: item.id,
      title: item.title,
      location: item.location,
      city: item.city,
      tourFee: item.agent_fee ?? 50
    }));
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id, title, location, city, agent_fee, status, visibility_starts_at, visibility_ends_at")
    .eq("status", "published")
    .or("visibility_starts_at.is.null,visibility_starts_at.lte." + new Date().toISOString())
    .or("visibility_ends_at.is.null,visibility_ends_at.gt." + new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  const listings = data as Array<Pick<Listing, "id" | "title" | "location" | "city"> & { agent_fee: number | null }>;
  const { data: fees } = await supabase.rpc("get_public_tour_fees", {
    listing_record_ids: listings.map((item) => item.id)
  });
  const feeMap = new Map<string, number>(
    (fees || []).map((item: { listing_id: string; tour_fee: number }) => [
      item.listing_id,
      Number(item.tour_fee)
    ])
  );

  return listings.map((item) => ({
    ...item,
    tourFee: feeMap.get(item.id) ?? Number(item.agent_fee ?? 50)
  }));
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

  const [tourFee, availableListings] = await Promise.all([
    getTourFee(listing),
    getAvailableListings()
  ]);

  return (
    <main className="form-page">
      <div className="container form-wrap">
        <div className="eyebrow">Property tour</div>
        <h1 style={{ fontSize: 44, marginBottom: 8 }}>Book a guided visit</h1>
        <p className="location" style={{ lineHeight: 1.7, marginBottom: 24 }}>
          You are starting a tour booking with <strong>{listing.title}</strong> in{" "}
          {listing.location}, {listing.city}. You can add more properties before submitting.
        </p>
        <BookingForm
          listing={listing}
          tourFee={tourFee}
          availableListings={availableListings.length ? availableListings : [{ ...listing, tourFee }]}
        />
      </div>
    </main>
  );
}
