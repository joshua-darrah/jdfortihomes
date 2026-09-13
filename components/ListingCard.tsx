"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Listing } from "@/lib/types";
import { formatGhs } from "@/lib/utils";
import { ShareListingButton } from "@/components/ShareListingButton";
import { createVideoThumbnailFromUrl, getVideoThumbnailUrl } from "@/lib/video";

export function ListingCard({ listing }: { listing: Listing }) {
  const videoUrl = listing.video_urls?.[0] || null;
  const storedVideoThumbnail = listing.video_thumbnail_urls?.find(Boolean) || null;
  const youtubeThumbnail = videoUrl ? getVideoThumbnailUrl(videoUrl) : null;
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!videoUrl || storedVideoThumbnail || youtubeThumbnail) return;

    let active = true;
    let objectUrl: string | null = null;

    createVideoThumbnailFromUrl(videoUrl).then((blob) => {
      if (!active || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setGeneratedThumbnail(objectUrl);
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [videoUrl, storedVideoThumbnail, youtubeThumbnail]);

  const image = listing.image_urls?.[0] || storedVideoThumbnail || youtubeThumbnail || generatedThumbnail;
  const hasVideo = Boolean(listing.video_urls?.length);

  return (
    <article className="card">
      <Link href={`/listing/${listing.id}`} aria-label={`View details for ${listing.title}`}>
        <div className="card-image">
          {image ? (
            <img src={image} alt={`${listing.title} property`} loading="lazy" />
          ) : hasVideo ? (
            <div className="media-placeholder media-video-placeholder">
              <span className="video-play-icon" aria-hidden="true">▶</span>
              <span>Property video</span>
            </div>
          ) : (
            <div className="media-placeholder">No property media</div>
          )}
          {hasVideo && image ? <span className="video-play-icon video-play-icon-overlay" aria-hidden="true">▶</span> : null}
          {listing.is_demo ? <span className="badge">Demo listing</span> : null}
          {listing.is_sponsored ? <span className="badge sponsored-badge">Sponsored</span> : null}
          {hasVideo ? <span className="media-count">Video</span> : null}
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
