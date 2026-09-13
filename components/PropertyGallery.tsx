"use client";

import { useEffect, useState } from "react";
import { createVideoThumbnailFromUrl, getVideoThumbnailUrl } from "@/lib/video";

type Media = { type: "image" | "video"; url: string; index: number };

export function PropertyGallery({
  title,
  images,
  videos,
  videoThumbnails
}: {
  title: string;
  images: string[];
  videos: string[];
  videoThumbnails?: string[];
}) {
  const media: Media[] = [
    ...images.map((url, index) => ({ type: "image" as const, url, index })),
    ...videos.map((url, index) => ({ type: "video" as const, url, index }))
  ];
  const [active, setActive] = useState(0);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<Record<number, string>>({});
  const [failedVideos, setFailedVideos] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    videos.forEach((url, index) => {
      if (videoThumbnails?.[index] || getVideoThumbnailUrl(url) || generatedThumbnails[index]) return;

      createVideoThumbnailFromUrl(url).then((blob) => {
        if (cancelled || !blob) return;
        const objectUrl = URL.createObjectURL(blob);
        objectUrls.push(objectUrl);
        setGeneratedThumbnails((current) => ({ ...current, [index]: objectUrl }));
      });
    });

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [videos, videoThumbnails, generatedThumbnails]);

  if (!media.length) {
    return <div className="gallery-empty" role="status">No property media has been added yet.</div>;
  }

  const current = media[Math.min(active, media.length - 1)];
  const currentVideoThumbnail = current.type === "video"
    ? videoThumbnails?.[current.index] || getVideoThumbnailUrl(current.url) || generatedThumbnails[current.index]
    : null;

  return (
    <div className="property-gallery">
      <div className="gallery-main">
        {current.type === "video" && !failedVideos[current.index] ? (
          <video
            src={current.url}
            controls
            playsInline
            preload="metadata"
            poster={currentVideoThumbnail || undefined}
            aria-label={`${title} property video`}
            onError={() => setFailedVideos((state) => ({ ...state, [current.index]: true }))}
          />
        ) : current.type === "video" ? (
          currentVideoThumbnail ? (
            <div className="gallery-video-fallback">
              <img src={currentVideoThumbnail} alt={`${title} property video preview`} />
              <span className="video-play-icon" aria-hidden="true">▶</span>
              <span className="gallery-fallback-label">Video preview</span>
            </div>
          ) : (
            <div className="media-placeholder media-video-placeholder">
              <span className="video-play-icon" aria-hidden="true">▶</span>
              <span>Property video</span>
            </div>
          )
        ) : (
          <img src={current.url} alt={`${title} property photo ${current.index + 1}`} />
        )}
      </div>
      <div className="gallery-thumbs" aria-label="Property media">
        {media.map((item, index) => {
          const thumbnail = item.type === "video"
            ? videoThumbnails?.[item.index] || getVideoThumbnailUrl(item.url) || generatedThumbnails[item.index]
            : null;

          return (
            <button
              type="button"
              className={`gallery-thumb ${active === index ? "active" : ""}`}
              onClick={() => setActive(index)}
              key={`${item.url}-${index}`}
              aria-label={`Show ${item.type === "video" ? "video" : "photo"} ${item.index + 1}`}
              aria-pressed={active === index}
            >
              {item.type === "video" ? (
                thumbnail ? (
                  <img src={thumbnail} alt="" />
                ) : (
                  <div className="media-placeholder thumb-video-placeholder">
                    <span className="video-play-icon" aria-hidden="true">▶</span>
                  </div>
                )
              ) : (
                <img src={item.url} alt="" />
              )}
              {item.type === "video" ? <span className="gallery-video-label">Video</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
