export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/")[2] || null;
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2] || null;
    }
  } catch {
    return null;
  }

  return null;
}

export function getVideoThumbnailUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

export async function createVideoThumbnail(file: File): Promise<Blob | null> {
  if (typeof window === "undefined") return null;

  return new Promise((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    let settled = false;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    const finish = (value: Blob | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    const capture = () => {
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        finish(null);
        return;
      }

      const maxWidth = 1280;
      const scale = Math.min(1, maxWidth / width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));

      const context = canvas.getContext("2d");
      if (!context) {
        finish(null);
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => finish(blob), "image/jpeg", 0.86);
    };

    video.addEventListener("loadeddata", () => {
      const targetTime = Number.isFinite(video.duration) && video.duration > 1
        ? Math.min(1, video.duration / 3)
        : 0;

      if (targetTime > 0) {
        video.currentTime = targetTime;
      } else {
        capture();
      }
    }, { once: true });

    video.addEventListener("seeked", capture, { once: true });
    video.addEventListener("error", () => finish(null), { once: true });
  });
}
