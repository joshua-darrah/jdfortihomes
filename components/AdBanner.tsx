import type { Ad } from "@/lib/types";

export function AdBanner({ ads }: { ads: Ad[] }) {
  if (!ads.length) return null;

  return (
    <div className="ad-stack" aria-label="Sponsored advertisements">
      {ads.map((ad) => {
        const content = (
          <>
            {ad.image_url ? (
              <div className="ad-image">
                <img src={ad.image_url} alt="" />
              </div>
            ) : null}
            <div className="ad-content">
              <div className="ad-label">{ad.ad_type === "sponsored_property" ? "Sponsored property" : "Advertisement"}</div>
              <h2>{ad.title}</h2>
              {ad.description ? <p>{ad.description}</p> : null}
              {ad.destination_url ? <span className="ad-cta">View details</span> : null}
            </div>
          </>
        );

        return ad.destination_url ? (
          <a
            className="ad-banner"
            href={ad.destination_url}
            target={ad.destination_url.startsWith("/") ? undefined : "_blank"}
            rel={ad.destination_url.startsWith("/") ? undefined : "noreferrer"}
            key={ad.id}
          >
            {content}
          </a>
        ) : (
          <div className="ad-banner" key={ad.id}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
