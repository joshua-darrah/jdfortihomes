"use client";

import { useState } from "react";

type Media = { type: "image" | "video"; url: string; index: number };

export function PropertyGallery({
  title,
  images,
  videos
}: {
  title: string;
  images: string[];
  videos: string[];
}) {
  const media: Media[] = [
    ...images.map((url, index) => ({ type: "image" as const, url, index })),
    ...videos.map((url, index) => ({ type: "video" as const, url, index }))
  ];
  const [active, setActive] = useState(0);

  if (!media.length) {
    return <div className="gallery-empty" role="status">No property media has been added yet.</div>;
  }

  const current = media[Math.min(active, media.length - 1)];

  return (
    <div className="property-gallery">
      <div className="gallery-main">
        {current.type === "video" ? (
          <video src={current.url} controls playsInline preload="metadata" aria-label={`${title} property video`} />
        ) : (
          <img src={current.url} alt={`${title} property photo ${current.index + 1}`} />
        )}
      </div>
      <div className="gallery-thumbs" aria-label="Property media">
        {media.map((item, index) => (
          <button
            type="button"
            className={`gallery-thumb ${active === index ? "active" : ""}`}
            onClick={() => setActive(index)}
            key={`${item.url}-${index}`}
            aria-label={`Show ${item.type === "video" ? "video" : "photo"} ${index + 1}`}
            aria-pressed={active === index}
          >
            {item.type === "video" ? (
              <video src={item.url} muted preload="metadata" aria-hidden="true" />
            ) : (
              <img src={item.url} alt="" />
            )}
            {item.type === "video" ? <span>Video</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
