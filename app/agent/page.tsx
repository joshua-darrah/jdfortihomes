"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { Ad, Agent, AgentPayout, Booking, Listing } from "@/lib/types";
import { formatGhs } from "@/lib/utils";
import { createVideoThumbnail, getVideoThumbnailUrl } from "@/lib/video";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_AD_IMAGE_SIZE = 5 * 1024 * 1024;

type AgentTab = "overview" | "listings" | "ads" | "bookings";

export default function AgentPage() {
  const [session, setSession] = useState<any>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<AgentTab>("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payouts, setPayouts] = useState<AgentPayout[]>([]);
  const [directBookingIds, setDirectBookingIds] = useState<Set<string>>(new Set());
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadAgent(data.session.user.id);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setAgent(null);
        setLoading(false);
        return;
      }
      setTimeout(() => void loadAgent(nextSession.user.id), 0);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadAgent(userId: string) {
    if (!supabase) return;
    setLoading(true);
    setError("");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError || profile?.role !== "agent") {
      setAgent(null);
      setError("This account does not have an active agent role.");
      setLoading(false);
      return;
    }

    const { data: agentRecord, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (agentError || !agentRecord) {
      setAgent(null);
      setError("Your agent account has not been linked to an agent profile yet.");
      setLoading(false);
      return;
    }

    setAgent(agentRecord as Agent);
    setLoading(false);
    await loadData();
  }

  async function loadData() {
    if (!supabase) return;
    setDataLoading(true);

    const [listingResult, adResult, bookingResult, payoutResult, bookingAgentResult] = await Promise.all([
      supabase.from("listings").select("*").order("created_at", { ascending: false }),
      supabase.from("ads").select("*").order("created_at", { ascending: false }),
      supabase
        .from("bookings")
        .select("*, listing:listings(title, location, city)")
        .order("created_at", { ascending: false }),
      supabase.from("agent_payouts").select("*").order("created_at", { ascending: false }),
      supabase.from("booking_agents").select("booking_id")
    ]);

    if (listingResult.error) setError(listingResult.error.message);
    if (adResult.error) setError(adResult.error.message);
    if (bookingResult.error) setError(bookingResult.error.message);
    if (payoutResult.error) setError(payoutResult.error.message);
    if (bookingAgentResult.error) setError(bookingAgentResult.error.message);
    setListings((listingResult.data || []) as Listing[]);
    setAds((adResult.data || []) as Ad[]);
    setBookings((bookingResult.data || []) as Booking[]);
    setPayouts((payoutResult.data || []) as AgentPayout[]);
    setDirectBookingIds(new Set((bookingAgentResult.data || []).map((row: { booking_id: string }) => row.booking_id)));
    setDataLoading(false);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!supabase) return;

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword
    });

    if (loginError) setError(loginError.message);
  }

  async function updateBookingStatus(id: string, status: string) {
    if (!supabase) return;
    const { error: updateError } = await supabase.rpc("agent_update_booking_status", {
      booking_id: id,
      new_status: status
    });
    if (updateError) setError(updateError.message);
    else setMessage("Booking status updated.");
    await loadData();
  }

  if (!supabaseConfigured) {
    return <main className="login"><div className="login-card"><div className="eyebrow">Agent setup</div><h1>Connect Supabase first</h1><p className="location">Add the Supabase URL and publishable key to the environment, then restart the server.</p></div></main>;
  }

  if (!session) {
    return (
      <main className="login">
        <form className="login-card" onSubmit={login}>
          <div className="eyebrow">JDFortiHomes</div>
          <h1>Agent sign in</h1>
          <p className="location">Use the agent account provided by JDFortiHomes. Agent accounts cannot access the administrator dashboard.</p>
          <div className="form-group" style={{ marginTop: 22 }}><label htmlFor="agent-email">Email</label><input className="field" id="agent-email" type="email" autoComplete="username" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} required /></div>
          <div className="form-group" style={{ marginTop: 14 }}><label htmlFor="agent-password">Password</label><input className="field" id="agent-password" type="password" autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required /></div>
          {error ? <div className="notice error" role="alert" style={{ marginTop: 16 }}>{error}</div> : null}
          <button className="button accent" type="submit" style={{ width: "100%", marginTop: 18 }}>Sign in</button>
        </form>
      </main>
    );
  }

  if (loading) {
    return <main className="login"><div className="login-card"><div className="eyebrow">Checking access</div><h1>Verifying agent account</h1><p className="location">Checking your JDFortiHomes permissions.</p></div></main>;
  }

  if (!agent) {
    return <main className="login"><div className="login-card"><div className="eyebrow">Access restricted</div><h1>Agent access unavailable</h1><p className="location">{error || "Your account is not linked to an active JDFortiHomes agent profile."}</p><button className="button secondary" type="button" onClick={() => supabase?.auth.signOut()}>Sign out</button></div></main>;
  }

  return (
    <main className="admin-shell">
      <div className="admin-top">
        <div className="container admin-nav">
          <div><div className="brand">JDFortiHomes<span>.</span> Agent</div><div className="agent-dashboard-id">{agent.agent_code} · {agent.full_name}</div></div>
          <button className="button secondary small" type="button" onClick={() => supabase?.auth.signOut()}>Sign out</button>
        </div>
      </div>

      <div className="container admin-body">
        <div className="admin-tabs" role="tablist" aria-label="Agent sections">
          <button className={`tab ${tab === "overview" ? "active" : ""}`} type="button" onClick={() => setTab("overview")}>Overview</button>
          <button className={`tab ${tab === "listings" ? "active" : ""}`} type="button" onClick={() => setTab("listings")}>My listings ({listings.length})</button>
          <button className={`tab ${tab === "ads" ? "active" : ""}`} type="button" onClick={() => setTab("ads")}>My ads ({ads.length})</button>
          <button className={`tab ${tab === "bookings" ? "active" : ""}`} type="button" onClick={() => setTab("bookings")}>My bookings ({bookings.length})</button>
        </div>

        {message ? <div className="notice" role="status" style={{ marginBottom: 16 }}>{message}</div> : null}
        {error ? <div className="notice error" role="alert" style={{ marginBottom: 16 }}>{error}</div> : null}
        {dataLoading ? <div className="panel"><p className="location">Loading your workspace...</p></div> : null}

        {!dataLoading && tab === "overview" ? <AgentOverview agent={agent} listings={listings} ads={ads} bookings={bookings} payouts={payouts} directBookingIds={directBookingIds} /> : null}
        {!dataLoading && tab === "listings" ? <AgentListings listings={listings} editing={editingListing} setEditing={setEditingListing} reload={loadData} setMessage={setMessage} /> : null}
        {!dataLoading && tab === "ads" ? <AgentAds ads={ads} listings={listings} editing={editingAd} setEditing={setEditingAd} reload={loadData} setMessage={setMessage} /> : null}
        {!dataLoading && tab === "bookings" ? <AgentBookings bookings={bookings} directBookingIds={directBookingIds} onStatus={updateBookingStatus} /> : null}
      </div>
    </main>
  );
}

function AgentOverview({ agent, listings, ads, bookings, payouts, directBookingIds }: { agent: Agent; listings: Listing[]; ads: Ad[]; bookings: Booking[]; payouts: AgentPayout[]; directBookingIds: Set<string> }) {
  const today = new Date().toISOString().slice(0, 10);
  const activeBookings = bookings.filter((booking) => !booking.deleted_at && booking.status !== "cancelled");
  const upcoming = activeBookings.filter((booking) => booking.preferred_date >= today).sort((a, b) => `${a.preferred_date} ${a.preferred_time}`.localeCompare(`${b.preferred_date} ${b.preferred_time}`)).slice(0, 5);
  const pending = activeBookings.filter((booking) => ["pending_payment", "payment_submitted"].includes(booking.status)).length;
  const completed = activeBookings.filter((booking) => booking.status === "tour_completed").length;
  const pendingPayout = payouts.filter((payout) => ["pending", "approved"].includes(payout.status)).reduce((sum, payout) => sum + Number(payout.amount), 0);
  const paidPayout = payouts.filter((payout) => payout.status === "paid").reduce((sum, payout) => sum + Number(payout.amount), 0);

  return (
    <div className="admin-overview">
      <div className="overview-header">
        <div><div className="eyebrow">Agent workspace</div><h1>Welcome, {agent.full_name.split(" ")[0]}</h1><p className="location">Track your assigned properties, tours, advertisements and earnings from one place.</p></div>
        <div className="agent-dashboard-id">{agent.agent_code} · {agent.status}</div>
      </div>
      <div className="overview-stats">
        <div className="overview-stat"><small>Assigned bookings</small><strong>{activeBookings.length}</strong><span>{pending} need attention</span></div>
        <div className="overview-stat"><small>My listings</small><strong>{listings.length}</strong><span>{listings.filter((item) => item.status === "published").length} published</span></div>
        <div className="overview-stat"><small>My advertisements</small><strong>{ads.length}</strong><span>{ads.filter((item) => item.status === "active").length} active</span></div>
        <div className="overview-stat"><small>Pending payout</small><strong>{formatGhs(pendingPayout)}</strong><span>{formatGhs(paidPayout)} paid</span></div>
        <div className="overview-stat"><small>Listings with my fee</small><strong>{listings.filter((item) => item.agent_fee !== null && item.agent_fee !== undefined).length}</strong><span>Optional tour fees configured</span></div>
      </div>
      <div className="overview-grid">
        <section className="panel">
          <div className="panel-heading"><div><h2>Next tours</h2><p className="location">Bookings that should be handled next.</p></div></div>
          <div className="admin-list">{upcoming.map((booking) => <div className="admin-list-item" key={booking.id}><div><strong>{booking.reference}</strong><div>{booking.customer_name} · {booking.listing?.title || "Property"}</div><div className="location">{booking.preferred_date} · {booking.preferred_time} · {directBookingIds.has(booking.id) ? "Directly assigned" : "Property assignment"}</div></div><span className="status">{booking.status.replaceAll("_", " ")}</span></div>)}</div>
          {!upcoming.length ? <div className="empty">No upcoming tours.</div> : null}
        </section>
        <section className="panel">
          <div className="panel-heading"><div><h2>Performance</h2><p className="location">A simple snapshot of your current workload.</p></div></div>
          <div className="overview-mini-stats"><div><small>Completed tours</small><strong>{completed}</strong></div><div><small>Active listings</small><strong>{listings.filter((item) => item.status !== "draft").length}</strong></div><div><small>Paid out</small><strong>{formatGhs(paidPayout)}</strong></div></div>
          <div className="agent-help"><strong>Need a booking?</strong><span>Contact the JDFortiHomes administrator if you need more assignments or if your workload is low.</span></div>
        </section>
      </div>
    </div>
  );
}

function AgentListings({ listings, editing, setEditing, reload, setMessage }: { listings: Listing[]; editing: Listing | null; setEditing: (value: Listing | null) => void; reload: () => Promise<void>; setMessage: (value: string) => void }) {
  return <div className="admin-grid"><div className="panel"><div className="panel-heading"><div><h2>My listings</h2><p className="location">Properties you have submitted or are responsible for.</p></div><button className="button accent small" type="button" onClick={() => setEditing(null)}>New listing</button></div><div className="admin-list">{listings.map((listing) => <div className="admin-list-item" key={listing.id}><div><strong>{listing.title}</strong><div className="location">{listing.location}, {listing.city} · {formatGhs(Number(listing.monthly_rent))}</div><span className="status">{listing.status}</span></div><button className="button secondary small" type="button" onClick={() => setEditing(listing)}>Edit</button></div>)}</div>{!listings.length ? <div className="empty">No listings have been assigned to you yet.</div> : null}</div><AgentListingEditor listing={editing} onSaved={async (msg) => { setMessage(msg); setEditing(null); await reload(); }} onCancel={() => setEditing(null)} onMessage={setMessage} /></div>;
}

function AgentListingEditor({ listing, onSaved, onCancel, onMessage }: { listing: Listing | null; onSaved: (message: string) => Promise<void>; onCancel: () => void; onMessage: (message: string) => void }) {
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const rights = form.get("media_rights_confirmed") === "on";
    const status = String(form.get("status") || "draft");
    if (status === "published" && !rights) { onMessage("Confirm that you have permission to publish the supplied property media."); return; }

    setSaving(true);
    try {
      const payload = {
        title: String(form.get("title") || "").trim(),
        description: String(form.get("description") || "").trim(),
        property_type: String(form.get("property_type") || "Apartment"),
        location: String(form.get("location") || "").trim(),
        city: String(form.get("city") || "").trim(),
        region: String(form.get("region") || "").trim(),
        address: String(form.get("address") || "").trim() || null,
        monthly_rent: Number(form.get("monthly_rent") || 0),
        agent_fee: String(form.get("agent_fee") || "").trim() === "" ? null : Number(form.get("agent_fee")),
        bedrooms: Number(form.get("bedrooms") || 1),
        bathrooms: Number(form.get("bathrooms") || 1),
        furnishing: String(form.get("furnishing") || "Unfurnished").trim(),
        room_type: String(form.get("room_type") || "Standard room").trim(),
        occupants: Number(form.get("occupants") || 1),
        lease_term: String(form.get("lease_term") || "12 months").trim(),
        amenities: String(form.get("amenities") || "").split(",").map((item) => item.trim()).filter(Boolean),
        image_urls: String(form.get("image_urls") || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
        video_urls: String(form.get("video_urls") || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
        video_thumbnail_urls: String(form.get("video_thumbnail_urls") || "").split(/\r?\n/).map((item) => item.trim()),
        contact_name: String(form.get("contact_name") || "").trim() || null,
        contact_phone: String(form.get("contact_phone") || "").trim() || null,
        media_rights_confirmed: rights,
        media_rights_note: String(form.get("media_rights_note") || "").trim() || null,
        status,
        is_demo: false
      };
      payload.video_thumbnail_urls = payload.video_urls.map((url, index) => payload.video_thumbnail_urls[index] || getVideoThumbnailUrl(url) || "");
      if (!payload.title || !payload.description || !payload.location || !payload.city || !payload.region) throw new Error("Complete the required property details.");

      let id = listing?.id;
      if (listing) {
        const { error } = await supabase.from("listings").update(payload).eq("id", listing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("listings").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }

      const files = (formElement.elements.namedItem("photo_files") as HTMLInputElement | null)?.files;
      const videoFiles = (formElement.elements.namedItem("video_files") as HTMLInputElement | null)?.files;
      const uploadedImages: string[] = [];
      const uploadedVideos: string[] = [];
      const uploadedVideoThumbnails: string[] = [];
      const manualVideoThumbnails = String(form.get("video_thumbnail_urls") || "").split(/\r?\n/).map((item) => item.trim());
      const videoThumbnailUrls = payload.video_urls.map((url, index) => manualVideoThumbnails[index] || getVideoThumbnailUrl(url) || "");

      for (const file of Array.from(files || [])) {
        if (file.size > MAX_IMAGE_SIZE) throw new Error(`${file.name} is larger than 8 MB.`);
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error(`${file.name} must be JPG, PNG or WebP.`);
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `listings/${id}/${crypto.randomUUID()}-${safeName}`;
        const upload = await supabase.storage.from("listing-media").upload(path, file, { upsert: false, contentType: file.type });
        if (upload.error) throw upload.error;
        uploadedImages.push(supabase.storage.from("listing-media").getPublicUrl(path).data.publicUrl);
      }

      for (const file of Array.from(videoFiles || [])) {
        if (file.size > MAX_VIDEO_SIZE) throw new Error(`${file.name} is larger than 50 MB.`);
        if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) throw new Error(`${file.name} must be MP4, WebM or MOV.`);
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `listings/${id}/${crypto.randomUUID()}-${safeName}`;
        const upload = await supabase.storage.from("listing-media").upload(path, file, { upsert: false, contentType: file.type });
        if (upload.error) throw upload.error;
        uploadedVideos.push(supabase.storage.from("listing-media").getPublicUrl(path).data.publicUrl);

        const thumbnail = await createVideoThumbnail(file);
        if (thumbnail) {
          const thumbnailPath = `listings/${id}/thumbnails/${crypto.randomUUID()}.jpg`;
          const thumbnailUpload = await supabase.storage.from("listing-media").upload(thumbnailPath, thumbnail, { upsert: false, contentType: "image/jpeg" });
          uploadedVideoThumbnails.push(thumbnailUpload.error ? "" : supabase.storage.from("listing-media").getPublicUrl(thumbnailPath).data.publicUrl);
        } else {
          uploadedVideoThumbnails.push("");
        }
      }

      if (uploadedImages.length || uploadedVideos.length) {
        const { error } = await supabase.from("listings").update({
          image_urls: [...payload.image_urls, ...uploadedImages],
          video_urls: [...payload.video_urls, ...uploadedVideos],
          video_thumbnail_urls: [...videoThumbnailUrls, ...uploadedVideoThumbnails]
        }).eq("id", id!);
        if (error) throw error;
      }

      await onSaved(listing ? "Listing updated." : "Listing submitted.");
    } catch (saveError) {
      onMessage(saveError instanceof Error ? saveError.message : "Could not save listing.");
    } finally {
      setSaving(false);
    }
  }

  return <form className="panel" onSubmit={submit}><h2>{listing ? "Edit listing" : "Add listing"}</h2><p className="upload-note">Agent access is limited to your own property records. Your agent identity is stored privately and is not shown publicly.</p><div className="form-group"><label htmlFor="agent-listing-title">Title *</label><input className="field" id="agent-listing-title" name="title" defaultValue={listing?.title || ""} required maxLength={160} /></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-listing-description">Description *</label><textarea className="field" id="agent-listing-description" name="description" defaultValue={listing?.description || ""} required maxLength={3000} /></div><div className="form-grid" style={{ marginTop: 12 }}><div className="form-group"><label htmlFor="agent-property-type">Type *</label><select className="field" id="agent-property-type" name="property_type" defaultValue={listing?.property_type || "Apartment"}><option>Apartment</option><option>House</option><option>Studio</option><option>Hostel</option><option>Room</option></select></div><div className="form-group"><label htmlFor="agent-location">Area *</label><input className="field" id="agent-location" name="location" defaultValue={listing?.location || ""} required /></div><div className="form-group"><label htmlFor="agent-city">City *</label><input className="field" id="agent-city" name="city" defaultValue={listing?.city || "Kumasi"} required /></div><div className="form-group"><label htmlFor="agent-region">Region *</label><input className="field" id="agent-region" name="region" defaultValue={listing?.region || "Ashanti"} required /></div><div className="form-group"><label htmlFor="agent-rent">Monthly rent (GHS) *</label><input className="field" id="agent-rent" name="monthly_rent" type="number" min="0" step="1" defaultValue={listing?.monthly_rent || 0} required /></div><div className="form-group"><label htmlFor="agent-fee">My tour fee (GHS)</label><input className="field" id="agent-fee" name="agent_fee" type="number" min="0" step="0.01" defaultValue={listing?.agent_fee ?? ""} placeholder="Optional" /><span className="upload-note">Optional. Leave blank to use the JDFortiHomes default tour fee. If you set a fee, JDFortiHomes commission is deducted from it when the booking is processed.</span></div><div className="form-group"><label htmlFor="agent-room-type">Room / unit type *</label><input className="field" id="agent-room-type" name="room_type" defaultValue={listing?.room_type || "Standard room"} required /></div><div className="form-group"><label htmlFor="agent-bedrooms">Bedrooms / rooms *</label><input className="field" id="agent-bedrooms" name="bedrooms" type="number" min="0" defaultValue={listing?.bedrooms || 1} required /></div><div className="form-group"><label htmlFor="agent-bathrooms">Bathrooms *</label><input className="field" id="agent-bathrooms" name="bathrooms" type="number" min="0" defaultValue={listing?.bathrooms || 1} required /></div><div className="form-group"><label htmlFor="agent-occupants">Occupants *</label><input className="field" id="agent-occupants" name="occupants" type="number" min="1" defaultValue={listing?.occupants || 1} required /></div><div className="form-group"><label htmlFor="agent-furnishing">Furnishing *</label><input className="field" id="agent-furnishing" name="furnishing" defaultValue={listing?.furnishing || "Unfurnished"} required /></div><div className="form-group"><label htmlFor="agent-lease">Lease / stay term *</label><input className="field" id="agent-lease" name="lease_term" defaultValue={listing?.lease_term || "12 months"} required /></div><div className="form-group"><label htmlFor="agent-contact-name">Property contact</label><input className="field" id="agent-contact-name" name="contact_name" defaultValue={listing?.contact_name || ""} /></div><div className="form-group"><label htmlFor="agent-contact-phone">Contact phone</label><input className="field" id="agent-contact-phone" name="contact_phone" defaultValue={listing?.contact_phone || ""} /></div></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-address">Address</label><input className="field" id="agent-address" name="address" defaultValue={listing?.address || ""} /></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-amenities">Amenities, separated by commas</label><input className="field" id="agent-amenities" name="amenities" defaultValue={listing?.amenities?.join(", ") || ""} /></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-image-urls">Photo URLs, one per line</label><textarea className="field" id="agent-image-urls" name="image_urls" defaultValue={listing?.image_urls?.join("\n") || ""} /></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-photo-files">Upload photos</label><input className="field" id="agent-photo-files" name="photo_files" type="file" accept="image/jpeg,image/png,image/webp" multiple /><span className="upload-note">JPG, PNG or WebP. Maximum 8 MB per photo.</span></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-video-urls">Video URLs, one per line</label><textarea className="field" id="agent-video-urls" name="video_urls" defaultValue={listing?.video_urls?.join("\n") || ""} /></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-video-files">Upload property videos</label><input className="field" id="agent-video-files" name="video_files" type="file" accept="video/mp4,video/webm,video/quicktime" multiple /><span className="upload-note">MP4, WebM or MOV. Maximum 50 MB per video. A thumbnail is generated automatically for each uploaded video.</span></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-video-thumbnail-urls">Video thumbnail URLs (optional)</label><textarea className="field" id="agent-video-thumbnail-urls" name="video_thumbnail_urls" defaultValue={listing?.video_thumbnail_urls?.join("\n") || ""} placeholder="One thumbnail URL per video. YouTube thumbnails are detected automatically." /><span className="upload-note">Used for property cards and link previews when there is no property photo.</span></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-media-note">Media rights note</label><textarea className="field" id="agent-media-note" name="media_rights_note" defaultValue={listing?.media_rights_note || ""} maxLength={500} /></div><div className="form-grid" style={{ marginTop: 12 }}><div className="form-group"><label htmlFor="agent-status">Status</label><select className="field" id="agent-status" name="status" defaultValue={listing?.status || "draft"}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div></div><label className="checkbox-label admin-check"><input type="checkbox" name="media_rights_confirmed" defaultChecked={listing?.media_rights_confirmed || false} /><span>I confirm that JDFortiHomes has the right or permission to publish this property information and media.</span></label><div className="admin-actions" style={{ marginTop: 18 }}><button className="button accent" type="submit" disabled={saving}>{saving ? "Saving..." : listing ? "Save changes" : "Submit listing"}</button>{listing ? <button className="button secondary" type="button" onClick={onCancel}>Cancel</button> : null}</div></form>;
}

function AgentAds({ ads, listings, editing, setEditing, reload, setMessage }: { ads: Ad[]; listings: Listing[]; editing: Ad | null; setEditing: (value: Ad | null) => void; reload: () => Promise<void>; setMessage: (value: string) => void }) {
  return <div className="admin-grid"><div className="panel"><div className="panel-heading"><div><h2>My advertisements</h2><p className="location">Campaigns created under your agent account.</p></div><button className="button accent small" type="button" onClick={() => setEditing(null)}>New ad</button></div><div className="admin-list">{ads.map((ad) => <div className="admin-list-item" key={ad.id}><div><strong>{ad.title}</strong><div className="location">{ad.ad_type.replaceAll("_", " ")} · {ad.status}</div></div><button className="button secondary small" type="button" onClick={() => setEditing(ad)}>Edit</button></div>)}</div>{!ads.length ? <div className="empty">No advertisements have been created.</div> : null}</div><AgentAdEditor ad={editing} listings={listings} onSaved={async (msg) => { setMessage(msg); setEditing(null); await reload(); }} onCancel={() => setEditing(null)} onMessage={setMessage} /></div>;
}

function AgentAdEditor({ ad, listings, onSaved, onCancel, onMessage }: { ad: Ad | null; listings: Listing[]; onSaved: (message: string) => Promise<void>; onCancel: () => void; onMessage: (message: string) => void }) {
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    try {
      const adType = String(form.get("ad_type") || "platform_promotion");
      const listingId = String(form.get("listing_id") || "") || null;
      const duration = Number(form.get("duration") || 7);
      if (!String(form.get("title") || "").trim() || !Number.isFinite(duration) || duration <= 0) throw new Error("Enter an ad title and a valid duration.");
      if (adType === "sponsored_property" && !listingId) throw new Error("Select the property being sponsored.");
      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + duration * 24 * 60 * 60 * 1000);
      const destinationUrl = adType === "sponsored_property" && listingId ? `/listing/${listingId}` : (String(form.get("destination_url") || "").trim() || null);
      const payload = { title: String(form.get("title") || "").trim(), description: String(form.get("description") || "").trim() || null, ad_type: adType, listing_id: adType === "sponsored_property" ? listingId : null, advertiser_name: String(form.get("advertiser_name") || "").trim() || null, advertiser_contact: String(form.get("advertiser_contact") || "").trim() || null, internal_notes: String(form.get("internal_notes") || "").trim() || null, destination_url: destinationUrl, placement: String(form.get("placement") || "home_top"), status: String(form.get("status") || "draft"), starts_at: ad?.starts_at || startsAt.toISOString(), ends_at: ad?.ends_at || endsAt.toISOString() };
      let id = ad?.id;
      if (ad) { const { error } = await supabase.from("ads").update(payload).eq("id", ad.id); if (error) throw error; }
      else { const { data, error } = await supabase.from("ads").insert(payload).select("id").single(); if (error) throw error; id = data.id; }

      const file = (formElement.elements.namedItem("ad_image") as HTMLInputElement | null)?.files?.[0];
      if (file) {
        if (file.size > MAX_AD_IMAGE_SIZE) throw new Error("Advertisement image must be 5 MB or smaller.");
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Advertisement image must be JPG, PNG or WebP.");
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `ads/${id}/${crypto.randomUUID()}-${safeName}`;
        const upload = await supabase.storage.from("ad-media").upload(path, file, { upsert: false, contentType: file.type });
        if (upload.error) throw upload.error;
        const imageUrl = supabase.storage.from("ad-media").getPublicUrl(path).data.publicUrl;
        const { error } = await supabase.from("ads").update({ image_url: imageUrl }).eq("id", id!);
        if (error) throw error;
      }
      await onSaved(ad ? "Advertisement updated." : "Advertisement submitted.");
    } catch (saveError) { onMessage(saveError instanceof Error ? saveError.message : "Could not save advertisement."); } finally { setSaving(false); }
  }

  return <form className="panel" onSubmit={submit}><h2>{ad ? "Edit advertisement" : "Create advertisement"}</h2><div className="form-group"><label htmlFor="agent-ad-type">Category *</label><select className="field" id="agent-ad-type" name="ad_type" defaultValue={ad?.ad_type || "platform_promotion"}><option value="platform_promotion">JDFortiHomes promotion</option><option value="sponsored_property">Sponsored property</option></select></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-ad-listing">Sponsored property</label><select className="field" id="agent-ad-listing" name="listing_id" defaultValue={ad?.listing_id || ""}><option value="">Select a property</option>{listings.filter((item) => !item.is_demo).map((item) => <option key={item.id} value={item.id}>{item.title} — {item.location}, {item.city}</option>)}</select></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-ad-title">Title *</label><input className="field" id="agent-ad-title" name="title" defaultValue={ad?.title || ""} required /></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-ad-description">Message</label><textarea className="field" id="agent-ad-description" name="description" defaultValue={ad?.description || ""} /></div><div className="form-grid" style={{ marginTop: 12 }}><div className="form-group"><label htmlFor="agent-ad-placement">Placement</label><select className="field" id="agent-ad-placement" name="placement" defaultValue={ad?.placement || "home_top"}><option value="home_top">Home — top</option><option value="home_mid">Home — middle</option><option value="directory_top">Directory — top</option></select></div><div className="form-group"><label htmlFor="agent-ad-status">Status</label><select className="field" id="agent-ad-status" name="status" defaultValue={ad?.status || "draft"}><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option></select></div><div className="form-group"><label htmlFor="agent-ad-duration">Duration (days)</label><input className="field" id="agent-ad-duration" name="duration" type="number" min="1" defaultValue="7" /></div></div><div className="form-grid" style={{ marginTop: 12 }}><div className="form-group"><label htmlFor="agent-ad-advertiser">Advertiser / owner</label><input className="field" id="agent-ad-advertiser" name="advertiser_name" defaultValue={ad?.advertiser_name || ""} /></div><div className="form-group"><label htmlFor="agent-ad-contact">Advertiser contact</label><input className="field" id="agent-ad-contact" name="advertiser_contact" defaultValue={ad?.advertiser_contact || ""} /></div></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-ad-destination">Destination link</label><input className="field" id="agent-ad-destination" name="destination_url" defaultValue={ad?.destination_url || ""} /></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-ad-notes">Internal notes</label><textarea className="field" id="agent-ad-notes" name="internal_notes" defaultValue={ad?.internal_notes || ""} /></div><div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-ad-image">Advertisement image</label><input className="field" id="agent-ad-image" name="ad_image" type="file" accept="image/jpeg,image/png,image/webp" /><span className="upload-note">Optional. Maximum 5 MB.</span></div><div className="admin-actions" style={{ marginTop: 18 }}><button className="button accent" type="submit" disabled={saving}>{saving ? "Saving..." : ad ? "Save changes" : "Submit advertisement"}</button>{ad ? <button className="button secondary" type="button" onClick={onCancel}>Cancel</button> : null}</div></form>;
}

function AgentBookings({ bookings, directBookingIds, onStatus }: { bookings: Booking[]; directBookingIds: Set<string>; onStatus: (id: string, status: string) => Promise<void> }) {
  const [proofs, setProofs] = useState<Record<string, string>>({});
  async function openProof(booking: Booking) {
    if (!supabase || !booking.payment_proof_path) return;
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(booking.payment_proof_path, 600);
    if (error) return;
    setProofs((current) => ({ ...current, [booking.id]: data.signedUrl }));
  }

  return <div className="panel"><div className="panel-heading"><div><h2>Property-tour bookings</h2><p className="location">You can view and validate bookings for properties assigned to you.</p></div></div><div className="agent-booking-list">{bookings.map((booking) => <article className="agent-booking" key={booking.id}><div className="agent-booking-head"><div><strong>{booking.reference}</strong><div className="location">{booking.listing?.title || "Property"} · {booking.listing?.location}, {booking.listing?.city}</div></div><span className="status">{booking.status.replaceAll("_", " ")}</span></div>{directBookingIds.has(booking.id) ? <div className="assignment-badge">Directly assigned to you by JDFortiHomes</div> : null}<div className="detail-meta"><div className="stat"><small>Customer</small><strong>{booking.customer_name}</strong></div><div className="stat"><small>Phone</small><strong>{booking.customer_phone}</strong></div><div className="stat"><small>Date</small><strong>{booking.preferred_date}</strong></div><div className="stat"><small>Time</small><strong>{booking.preferred_time}</strong></div></div><div className="admin-actions"><select className="field compact-select" value={booking.status} onChange={(event) => void onStatus(booking.id, event.target.value)} aria-label={`Update status for ${booking.reference}`}><option value="pending_payment">Pending payment</option><option value="payment_submitted">Payment submitted</option><option value="confirmed">Confirmed</option><option value="tour_completed">Tour completed</option><option value="cancelled">Cancelled</option></select>{booking.payment_proof_path ? <button className="button secondary small" type="button" onClick={() => void openProof(booking)}>View payment proof</button> : null}</div>{proofs[booking.id] ? <a className="button secondary small" href={proofs[booking.id]} target="_blank" rel="noreferrer" style={{ marginTop: 10 }}>Open signed proof</a> : null}</article>)}</div>{!bookings.length ? <div className="empty">No bookings are currently attached to your properties.</div> : null}</div>;
}
