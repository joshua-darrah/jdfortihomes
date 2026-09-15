import Link from "next/link";
import type { Listing } from "@/lib/types";
import { formatGhs } from "@/lib/utils";
import { ShareListingButton } from "@/components/ShareListingButton";

export function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.image_urls?.[0] || listing.video_thumbnail_urls?.find(Boolean);

  return (
    <article className="card">
      <Link href={`/listing/${listing.id}`} aria-label={`View details for ${listing.title}`}>
        <div className="card-image">
          {image ? <img src={image} alt={`${listing.title} property`} loading="lazy" /> : listing.video_urls?.length ? <div className="media-placeholder">Property video</div> : <div className="media-placeholder">No property media</div>}
          {listing.is_demo ? <span className="badge">Demo listing</span> : null}
          {listing.is_sponsored ? <span className="badge sponsored-badge">Sponsored</span> : null}
          {listing.video_urls?.length ? <span className="media-count">Video</span> : null}
        </div>
      </Link>
      <div className="card-body">
        <Link href={`/listing/${listing.id}`}>
          <h3>{listing.title}</h3>
        </Link>
        <div className="location">{listing.location}, {listing.city}</div>
        <div className="price">{formatGhs(Number(listing.monthly_rent))} <span className="location">/ month</span></div>
        <div className="meta" aria-label="Property details">
          <span>{listing.bedrooms} bed</span>
          <span>{listing.bathrooms} bath</span>
          <span>{listing.property_type}</span>
        </div>
        <div className="card-footer">
          <span className="location">{listing.furnishing}</span>
          <div className="listing-card-actions">
            <Link className="button small" href={`/listing/${listing.id}`}>View property</Link>
            <ShareListingButton listing={listing} />
          </div>
        </div>
      </div>
    </article>
  );
}
