import Link from "next/link";
import { RealtimeListings } from "@/components/RealtimeListings";
import { siteConfig } from "@/lib/site-config";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import { demoListings } from "@/lib/demo-listings";
import { AdBanner } from "@/components/AdBanner";
import { getActiveAds } from "@/lib/ads";

const heroImage = "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=88";

async function getListings(): Promise<Listing[]> {
  if (!supabase) return demoListings;
  const { data } = await supabase.from("listings").select("*").eq("status", "published").or("visibility_starts_at.is.null,visibility_starts_at.lte." + new Date().toISOString())
    .or("visibility_ends_at.is.null,visibility_ends_at.gt." + new Date().toISOString()).order("created_at", { ascending: false });
  return (data || []) as Listing[];
}

export default async function HomePage() {
  const [listings, homeTopAds, homeMidAds] = await Promise.all([
    getListings(),
    getActiveAds("home_top"),
    getActiveAds("home_mid")
  ]);
  const recommendations = listings.slice(0, 3);

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow">Find a place</div>
            <h1>Find a place that feels right.</h1>
            <p className="hero-copy">Search apartments, houses, rooms and hostels, compare the details and book a guided visit before you decide.</p>
            <form className="search-panel" action="/find-a-place">
              <div className="form-group"><label className="sr-only" htmlFor="home-search">Search an area, city or property</label><input className="search-field" id="home-search" name="q" placeholder="Search an area, city or property" /></div>
              <div className="form-group"><label className="sr-only" htmlFor="home-type">Property type</label><select className="field" id="home-type" name="type" defaultValue="">
                <option value="">Any property type</option><option>Apartment</option><option>House</option><option>Studio</option><option>Hostel</option><option>Room</option>
              </select></div>
              <button className="button accent" type="submit">Find a place</button>
            </form>
            <div className="hero-actions"><Link className="text-link" href="/find-a-place">Browse all available places</Link></div>
          </div>
          <div className="hero-image"><img src={heroImage} alt="Modern residential interior used for demonstration" /><div className="hero-note">Search online. Tour in person. Decide with confidence.</div></div>
        </div>
      </section>

      <div className="container ad-container"><AdBanner ads={homeTopAds} /></div>

      <section className="section marketing-section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Find what fits you</div>
              <h2>From affordable spaces to premium homes.</h2>
              <p>Whether you need a practical place for everyday living or something more private and luxurious, JDFortiHomes helps you discover options and arrange a guided visit.</p>
            </div>
          </div>
          <div className="grid marketing-grid">
            <div className="panel marketing-card"><div className="eyebrow">Affordable</div><h3>Good homes within your budget.</h3><p className="location">Explore rooms, apartments and houses that match what you can comfortably afford.</p></div>
            <div className="panel marketing-card"><div className="eyebrow">Premium</div><h3>Find a luxury home for less.</h3><p className="location">Discover better-finished spaces, compare the details and see what fits your lifestyle.</p></div>
            <div className="panel marketing-card"><div className="eyebrow">Guided tours</div><h3>See it before you decide.</h3><p className="location">Book a guided property tour so you can inspect the place in person before making a commitment.</p></div>
          </div>
        </div>
      </section>

      <section className="section" id="recommendations">
        <div className="container">
          <div className="section-head"><div><div className="eyebrow">Recommended places</div><h2>A few places to start with</h2><p>Explore a small selection here, then browse the full inventory. Demo listings are clearly labelled until real inventory is added.</p></div><Link className="button secondary small" href="/find-a-place">See all places</Link></div>
          <RealtimeListings initialListings={recommendations} compact />
        </div>
      </section>

      <div className="container ad-container"><AdBanner ads={homeMidAds} /></div>

      <section className="section" id="how-it-works" style={{ background: "#f7f7f6" }}>
        <div className="container">
          <div className="section-head"><div><div className="eyebrow">Simple process</div><h2>From search to site visit</h2></div></div>
          <div className="grid">
            <div className="panel"><div className="eyebrow">01</div><h3>Find a property</h3><p className="location">Search by location, property type, price and room requirements.</p></div>
            <div className="panel"><div className="eyebrow">02</div><h3>View the details</h3><p className="location">See photos, available videos, room information, amenities, pricing and location.</p></div>
            <div className="panel"><div className="eyebrow">03</div><h3>Book a tour</h3><p className="location">Choose a preferred date and time, make the manual tour-fee payment and upload proof.</p></div>
          </div>
          <div className="notice" style={{ marginTop: 24 }}>Tour fee: <strong>{siteConfig.tourFeeGhs} GHS</strong>.</div>
        </div>
      </section>
    </main>
  );
}
