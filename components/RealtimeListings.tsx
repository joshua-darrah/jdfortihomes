"use client";

import { useEffect, useMemo, useState } from "react";
import { ListingCard } from "@/components/ListingCard";
import { ListingSkeleton } from "@/components/Skeletons";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

export function RealtimeListings({
  initialListings,
  initialSearch = "",
  initialType = "All types",
  compact = false
}: {
  initialListings: Listing[];
  initialSearch?: string;
  initialType?: string;
  compact?: boolean;
}) {
  const [listings, setListings] = useState(initialListings);
  const [search, setSearch] = useState(initialSearch);
  const [type, setType] = useState(initialType || "All types");
  const [maxRent, setMaxRent] = useState("Any price");
  const [beds, setBeds] = useState("Any bedrooms");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("public-listings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        async () => {
          setRefreshing(true);
          const { data } = await supabase!
            .from("listings")
            .select("*")
            .eq("status", "published")
            .or("visibility_starts_at.is.null,visibility_starts_at.lte." + new Date().toISOString())
    .or("visibility_ends_at.is.null,visibility_ends_at.gt." + new Date().toISOString())
            .order("created_at", { ascending: false });
          if (data) {
            setListings(compact ? (data as Listing[]).slice(0, 3) : (data as Listing[]));
          }
          setRefreshing(false);
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [compact]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter((item) => {
      const matchesSearch =
        !q ||
        [item.title, item.location, item.city, item.region, item.property_type].some((value) =>
          value.toLowerCase().includes(q)
        );
      const matchesType = type === "All types" || !type || item.property_type === type;
      const matchesRent = maxRent === "Any price" || Number(item.monthly_rent) <= Number(maxRent);
      const matchesBeds = beds === "Any bedrooms" || Number(item.bedrooms) >= Number(beds);
      return matchesSearch && matchesType && matchesRent && matchesBeds;
    });
  }, [listings, search, type, maxRent, beds]);

  return (
    <>
      {!supabaseConfigured ? (
        <div className="notice" style={{ marginBottom: 20 }} role="status">
          Demo mode is active. Connect Supabase to manage and publish real listings.
        </div>
      ) : null}

      {!compact ? (
        <div className="filters" aria-label="Property filters">
          <div className="form-group">
            <label className="sr-only" htmlFor="listing-search">Search properties</label>
            <input
              className="search-field"
              id="listing-search"
              placeholder="Search by area, city or property name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="sr-only" htmlFor="listing-type">Property type</label>
            <select className="field" id="listing-type" value={type} onChange={(event) => setType(event.target.value)}>
              <option>All types</option>
              <option>Apartment</option>
              <option>House</option>
              <option>Studio</option>
              <option>Hostel</option>
              <option>Room</option>
            </select>
          </div>
          <div className="form-group">
            <label className="sr-only" htmlFor="listing-rent">Maximum monthly rent</label>
            <select className="field" id="listing-rent" value={maxRent} onChange={(event) => setMaxRent(event.target.value)}>
              <option>Any price</option>
              <option value="2000">Up to GHS 2,000</option>
              <option value="3000">Up to GHS 3,000</option>
              <option value="5000">Up to GHS 5,000</option>
              <option value="8000">Up to GHS 8,000</option>
              <option value="12000">Up to GHS 12,000</option>
            </select>
          </div>
          <div className="form-group">
            <label className="sr-only" htmlFor="listing-beds">Minimum bedrooms</label>
            <select className="field" id="listing-beds" value={beds} onChange={(event) => setBeds(event.target.value)}>
              <option>Any bedrooms</option>
              <option value="1">1+ bedroom</option>
              <option value="2">2+ bedrooms</option>
              <option value="3">3+ bedrooms</option>
              <option value="4">4+ bedrooms</option>
            </select>
          </div>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setSearch("");
              setType("All types");
              setMaxRent("Any price");
              setBeds("Any bedrooms");
            }}
          >
            Reset filters
          </button>
        </div>
      ) : null}

      <div className="result-bar" aria-live="polite">
        <span>{filtered.length} {filtered.length === 1 ? "place" : "places"} available</span>
        {refreshing ? <span>Updating listings…</span> : null}
        {search ? <span>Search: <strong>{search}</strong></span> : null}
      </div>

      {refreshing && !filtered.length ? <ListingSkeleton count={compact ? 3 : 6} /> : null}
      {!refreshing && filtered.length ? (
        <div className="grid">
          {filtered.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      ) : null}
      {!refreshing && !filtered.length ? (
        <div className="empty" role="status">
          <strong>No places match your search.</strong>
          <p>Try another area, property type or price range.</p>
        </div>
      ) : null}
    </>
  );
}
