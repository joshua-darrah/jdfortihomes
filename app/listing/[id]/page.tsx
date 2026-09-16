import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyGallery } from "@/components/PropertyGallery";
import { formatGhs } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { demoListings } from "@/lib/demo-listings";
import type { Listing } from "@/lib/types";
import { getSiteUrl } from "@/lib/seo";
import { ShareListingButton } from "@/components/ShareListingButton";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing || listing.status !== "published") {
    return {
      title: "Property not found",
      robots: { index: false, follow: false }
    };
  }

  const description =
    listing.description ||
    `View ${listing.title} in ${listing.location}, ${listing.city}, Ghana and request a guided property tour.`;
  const image = listing.image_urls?.[0] || listing.video_thumbnail_urls?.find(Boolean) || "/og-image.png";

  return {
    title: listing.title,
    description,
    alternates: {
      canonical: `/listing/${listing.id}`
    },
    openGraph: {
      type: "website",
      title: `${listing.title} | JDFortiHomes`,
      description,
      url: `${getSiteUrl()}/listing/${listing.id}`,
      images: [{ url: image, alt: listing.title }],
      videos: listing.video_urls?.length ? [{ url: listing.video_urls[0] }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: `${listing.title} | JDFortiHomes`,
      description,
      images: [image]
    }
  };
}

async function getListing(id: string): Promise<Listing | null> {
  if (!supabase) return demoListings.find((item) => item.id === id) || null;

  const now = new Date().toISOString();
  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .or(`visibility_starts_at.is.null,visibility_starts_at.lte.${now}`)
    .or(`visibility_ends_at.is.null,visibility_ends_at.gt.${now}`)
    .maybeSingle();

  return data as Listing | null;
}

async function getTourFee(listing: Listing) {
  if (!supabase) return listing.agent_fee ?? 50;
  const { data } = await supabase.rpc("get_public_tour_fee", { listing_record_id: listing.id });
  return Number(data ?? listing.agent_fee ?? 50);
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const listing = await getListing(id); if (!listing) notFound();
  const tourFee = await getTourFee(listing);
  return <main className="detail-hero"><div className="container"><Link className="back-link" href="/find-a-place">Back to all places</Link><div className="detail-grid"><div><PropertyGallery title={listing.title} images={listing.image_urls || []} videos={listing.video_urls || []} videoThumbnails={listing.video_thumbnail_urls || []} /><div className="detail-description"><div className="eyebrow">About this place</div><h2>{listing.title}</h2><p>{listing.description}</p><h3>What the property offers</h3><div className="amenities">{listing.amenities?.map((item) => <span className="chip" key={item}>{item}</span>)}</div></div></div>
  <aside className="detail-card">{listing.is_demo ? <span className="badge" style={{ position: "static", display: "inline-block" }}>Demo listing</span> : null}<div className="eyebrow" style={{ marginTop: 14 }}>{listing.property_type}</div><h1>{listing.title}</h1><div className="location">{listing.location}, {listing.city}, {listing.region}</div><div className="price">{formatGhs(Number(listing.monthly_rent))}<span className="location"> / month</span></div><div className="detail-meta"><div className="stat"><small>Room type</small><strong>{listing.room_type || listing.property_type}</strong></div><div className="stat"><small>Bedrooms</small><strong>{listing.bedrooms}</strong></div><div className="stat"><small>Bathrooms</small><strong>{listing.bathrooms}</strong></div><div className="stat"><small>Suitable for</small><strong>{listing.occupants} people</strong></div><div className="stat"><small>Furnishing</small><strong>{listing.furnishing}</strong></div><div className="stat"><small>Lease term</small><strong>{listing.lease_term}</strong></div></div><div className="location detail-address">{listing.address || `${listing.location}, ${listing.city}`}</div><div className="detail-actions">
  <Link className="button accent" href={`/book?listing=${listing.id}`}>Book a property tour</Link>
  <p className="location" style={{ marginTop: 10, fontSize: 12 }}>Tour fee: <strong>{formatGhs(tourFee)}</strong>. Payment details are provided during booking.</p>
  <ShareListingButton listing={listing} />
</div><p className="location" style={{ marginTop: 12, fontSize: 12 }}>A tour booking is a request to view the property. It does not transfer ownership or guarantee the property until confirmed.</p></aside></div></div></main>;
}
