"use client";

import { useState } from "react";
import type { Listing } from "@/lib/types";

function buildShareText(listing: Listing) {
  const rent = new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0
  }).format(Number(listing.monthly_rent));

  return [
    listing.title,
    `${listing.room_type || listing.property_type} in ${listing.location}, ${listing.city}`,
    `${rent} / month`,
    `${listing.bedrooms} bedroom${listing.bedrooms === 1 ? "" : "s"} · ${listing.bathrooms} bathroom${listing.bathrooms === 1 ? "" : "s"}`,
    "",
    "View this property on JDFortiHomes:"
  ].join("\n");
}

export function ShareListingButton({ listing }: { listing: Listing }) {
  const [status, setStatus] = useState<"idle" | "sharing" | "copied">("idle");

  async function shareListing() {
    setStatus("sharing");

    try {
      const url = `${window.location.origin}/listing/${listing.id}`;
      const text = buildShareText(listing);
      const imageUrl = listing.image_urls?.[0];
      let file: File | null = null;

      if (imageUrl) {
        try {
          const response = await fetch(imageUrl, { mode: "cors" });
          if (response.ok) {
            const blob = await response.blob();
            const extension = blob.type === "image/png" ? "png" : "jpg";
            file = new File([blob], `jdfortihomes-${listing.id}.${extension}`, {
              type: blob.type || "image/jpeg"
            });
          }
        } catch {
          // Sharing still works with the listing link if the image cannot be fetched.
        }
      }

      if (navigator.share) {
        const shareData: ShareData = {
          title: listing.title,
          text,
          url
        };

        if (file && navigator.canShare?.({ files: [file] })) {
          shareData.files = [file];
        }

        await navigator.share(shareData);
        setStatus("idle");
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2200);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus("idle");
        return;
      }

      try {
        const url = `${window.location.origin}/listing/${listing.id}`;
        await navigator.clipboard.writeText(`${buildShareText(listing)}\n${url}`);
        setStatus("copied");
        window.setTimeout(() => setStatus("idle"), 2200);
      } catch {
        setStatus("idle");
      }
    }
  }

  return (
    <button
      className="button secondary share-button"
      type="button"
      onClick={() => void shareListing()}
      disabled={status === "sharing"}
      aria-label={`Share ${listing.title}`}
      title="Share this property"
    >
      <span aria-hidden="true">↗</span>
      {status === "sharing" ? "Preparing share..." : status === "copied" ? "Link copied" : "Share"}
    </button>
  );
}
