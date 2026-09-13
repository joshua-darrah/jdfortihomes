"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import type { Ad, Agent, AgentPayout, Booking, Listing } from "@/lib/types";
import { AD_PLACEMENTS } from "@/lib/ads";
import { formatGhs } from "@/lib/utils";
import { AdminSkeleton } from "@/components/Skeletons";
import { createVideoThumbnail, getVideoThumbnailUrl } from "@/lib/video";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MAX_AD_IMAGE_SIZE = 5 * 1024 * 1024;

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"bookings" | "listings" | "ads" | "agents">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentPayouts, setAgentPayouts] = useState<AgentPayout[]>([]);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState("");
  const [dataLoading, setDataLoading] = useState(false);
  const [showDeletedBookings, setShowDeletedBookings] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        setLoginError(error.message);
        return;
      }

      setSession(data.session);
      if (data.session) {
        await loadRole(data.session.user.id);
      } else {
        setRole(null);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setRole(null);
        setRoleLoading(false);
        return;
      }

      setTimeout(() => {
        void loadRole(nextSession.user.id);
      }, 0);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadRole(_userId: string) {
    if (!supabase) return;
    setRoleLoading(true);
    setLoginError("");

    const { data, error } = await supabase.rpc("is_admin");
    if (error) {
      setRole(null);
      setLoginError(`Could not verify your admin role: ${error.message}`);
    } else {
      setRole(data === true ? "admin" : null);
    }

    setRoleLoading(false);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    if (!supabase) return;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      setLoginError(error.message);
      return;
    }

    if (data.user) await loadRole(data.user.id);
  }

  async function loadData() {
    if (!supabase || role !== "admin") return;
    setDataLoading(true);

    const [listingResult, bookingResult, adResult, agentResult, payoutResult, listingAgentResult, adAgentResult] = await Promise.all([
      supabase.from("listings").select("*").order("created_at", { ascending: false }),
      supabase
        .from("bookings")
        .select("*, listing:listings(title, location, city)")
        .order("created_at", { ascending: false }),
      supabase.from("ads").select("*").order("created_at", { ascending: false }),
      supabase.from("agents").select("*").order("created_at", { ascending: false }),
      supabase.from("agent_payouts").select("*, agent:agents(agent_code, full_name)").order("created_at", { ascending: false }),
      supabase.from("listing_agents").select("listing_id, agent_id"),
      supabase.from("ad_agents").select("ad_id, agent_id")
    ]);

    if (listingResult.error) setMessage(listingResult.error.message);
    if (bookingResult.error) setMessage(bookingResult.error.message);
    if (adResult.error) setMessage(adResult.error.message);
    if (agentResult.error) setMessage(agentResult.error.message);
    if (payoutResult.error) setMessage(payoutResult.error.message);
    if (listingAgentResult.error) setMessage(listingAgentResult.error.message);
    if (adAgentResult.error) setMessage(adAgentResult.error.message);
    if (listingResult.data) {
      const agentMap = new Map((listingAgentResult.data || []).map((row: any) => [row.listing_id, row.agent_id]));
      setListings((listingResult.data as Listing[]).map((item) => ({ ...item, agent_id: agentMap.get(item.id) || null })) as Listing[]);
    }
    if (bookingResult.data) setBookings(bookingResult.data as Booking[]);
    if (adResult.data) {
      const agentMap = new Map((adAgentResult.data || []).map((row: any) => [row.ad_id, row.agent_id]));
      setAds((adResult.data as Ad[]).map((item) => ({ ...item, agent_id: agentMap.get(item.id) || null })) as Ad[]);
    }
    if (agentResult.data) setAgents(agentResult.data as Agent[]);
    if (payoutResult.data) setAgentPayouts(payoutResult.data as AgentPayout[]);
    setDataLoading(false);
  }

  useEffect(() => {
    if (role === "admin") void loadData();
  }, [role]);

  if (!supabaseConfigured) {
    return (
      <main className="login">
        <div className="login-card">
          <div className="eyebrow">Admin setup</div>
          <h1>Connect Supabase first</h1>
          <p className="location">Add the Supabase URL and publishable key to .env.local, then restart the development server.</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="login">
        <form className="login-card" onSubmit={login}>
          <div className="eyebrow">Private area</div>
          <h1>Admin sign in</h1>
          <p className="location">Only authorised administrator accounts can access property and booking records.</p>

          <div className="form-group" style={{ marginTop: 22 }}>
            <label htmlFor="admin-email">Email</label>
            <input className="field" id="admin-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label htmlFor="admin-password">Password</label>
            <input className="field" id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>

          {loginError ? <div className="notice error" role="alert" style={{ marginTop: 14 }}>{loginError}</div> : null}
          <button className="button" type="submit" style={{ width: "100%", marginTop: 18 }}>Sign in</button>
        </form>
      </main>
    );
  }

  if (roleLoading) {
    return (
      <main className="login">
        <div className="login-card">
          <div className="eyebrow">Checking access</div>
          <h1>Verifying admin access</h1>
          <p className="location">Checking your account permissions.</p>
        </div>
      </main>
    );
  }

  if (role !== "admin") {
    return (
      <main className="login">
        <div className="login-card">
          <div className="eyebrow">Access denied</div>
          <h1>Admin role required</h1>
          <p className="location">Your account is authenticated, but it does not have the required administrator role.</p>
          {loginError ? <div className="notice error" role="alert">{loginError}</div> : null}
          <button className="button secondary" type="button" onClick={() => supabase!.auth.signOut()}>Sign out</button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-top">
        <div className="container admin-nav">
          <div className="brand">JDFortiHomes<span>.</span> Admin</div>
          <button className="button secondary small" type="button" onClick={() => supabase!.auth.signOut()}>Sign out</button>
        </div>
      </div>

      <div className="container admin-body">
        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          <button className={`tab ${tab === "bookings" ? "active" : ""}`} type="button" role="tab" aria-selected={tab === "bookings"} onClick={() => setTab("bookings")}>
            Bookings ({bookings.length})
          </button>
          <button className={`tab ${tab === "listings" ? "active" : ""}`} type="button" role="tab" aria-selected={tab === "listings"} onClick={() => setTab("listings")}>
            Listings ({listings.length})
          </button>
          <button className={`tab ${tab === "ads" ? "active" : ""}`} type="button" role="tab" aria-selected={tab === "ads"} onClick={() => setTab("ads")}>
            Advertisements ({ads.length})
          </button>
          <button className={`tab ${tab === "agents" ? "active" : ""}`} type="button" role="tab" aria-selected={tab === "agents"} onClick={() => setTab("agents")}>Agents ({agents.length})</button>
          <button className="tab" type="button" onClick={() => exportBookings(bookings)}>Export bookings CSV</button>
        </div>

        {message ? <div className="notice" role="status" style={{ marginBottom: 16 }}>{message}</div> : null}
        {dataLoading ? <AdminSkeleton /> : null}

        {!dataLoading && tab === "bookings" ? (
          <BookingPanel
            bookings={bookings}
            reload={loadData}
            setMessage={setMessage}
            onSelect={setSelectedBooking}
            showDeleted={showDeletedBookings}
            setShowDeleted={setShowDeletedBookings}
          />
        ) : null}

        {!dataLoading && tab === "listings" ? (
          <ListingPanel
            listings={listings}
            agents={agents}
            editing={editing}
            setEditing={setEditing}
            reload={loadData}
            setMessage={setMessage}
          />
        ) : null}

        {!dataLoading && tab === "ads" ? (
          <AdPanel
            ads={ads}
            listings={listings}
            agents={agents}
            editing={editingAd}
            setEditing={setEditingAd}
            reload={loadData}
            setMessage={setMessage}
          />
        ) : null}

        {!dataLoading && tab === "agents" ? (
          <AgentPanel
            agents={agents}
            payouts={agentPayouts}
            listings={listings}
            ads={ads}
            reload={loadData}
            setMessage={setMessage}
          />
        ) : null}
      </div>

      {selectedBooking ? (
        <BookingDetails booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      ) : null}
    </main>
  );
}

function BookingPanel({
  bookings,
  reload,
  setMessage,
  onSelect,
  showDeleted,
  setShowDeleted
}: {
  bookings: Booking[];
  reload: () => Promise<void>;
  setMessage: (value: string) => void;
  onSelect: (booking: Booking) => void;
  showDeleted: boolean;
  setShowDeleted: (value: boolean) => void;
}) {
  async function updateStatus(id: string, status: string) {
    const { error } = await supabase!.from("bookings").update({ status }).eq("id", id);
    setMessage(error ? error.message : "Booking status updated.");
    await reload();
  }

  const visibleBookings = showDeleted
    ? bookings
    : bookings.filter((booking) => !booking.deleted_at);

  return (
    <div className="panel">
      <div className="panel-heading">
        <div>
          <h2>Tour bookings</h2>
          <p className="location">Open a booking to see every submitted detail and the payment proof.</p>
        </div>
        <label className="checkbox-label admin-check">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(event) => setShowDeleted(event.target.checked)}
          />
          <span>Show deleted bookings</span>
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">JDFortiHomes tour bookings</caption>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Property</th>
              <th>Tour</th>
              <th>Payment</th>
              <th>Status</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {visibleBookings.map((booking) => (
              <tr key={booking.id}>
                <td><strong>{booking.reference}</strong>{booking.deleted_at ? <div className="location">Deleted</div> : null}</td>
                <td>{booking.customer_name}<br />{booking.customer_phone}<br />{booking.customer_email}</td>
                <td>{booking.listing?.title}<br /><span className="location">{booking.listing?.location}</span></td>
                <td>{booking.preferred_date}<br />{booking.preferred_time}</td>
                <td>{formatGhs(Number(booking.tour_fee))}<br /><span className="location">{booking.payment_method}</span></td>
                <td>
                  <span className="status">{booking.status.replaceAll("_", " ")}</span>
                  <div style={{ marginTop: 8 }}>
                    <label className="sr-only" htmlFor={`status-${booking.id}`}>Update status for {booking.reference}</label>
                    <select
                      id={`status-${booking.id}`}
                      className="field"
                      value={booking.status}
                      onChange={(event) => void updateStatus(booking.id, event.target.value)}
                    >
                      <option value="pending_payment">Pending payment</option>
                      <option value="payment_submitted">Payment submitted</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="tour_completed">Tour completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </td>
                <td>
                  <div className="admin-actions">
                    <button className="button secondary small" type="button" onClick={() => onSelect(booking)}>View details</button>
                    {booking.deleted_at ? (
                      <button
                        className="button secondary small"
                        type="button"
                        onClick={async () => {
                          const { error } = await supabase!.from("bookings").update({ deleted_at: null, deleted_by: null }).eq("id", booking.id);
                          setMessage(error ? error.message : "Booking restored.");
                          await reload();
                        }}
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        className="button danger small"
                        type="button"
                        onClick={async () => {
                          if (!window.confirm(`Delete booking ${booking.reference}? It will be removed from the normal booking list but retained securely for records.`)) return;
                          const userResult = await supabase!.auth.getUser();
                          const { error } = await supabase!.from("bookings").update({
                            deleted_at: new Date().toISOString(),
                            deleted_by: userResult.data.user?.id || null
                          }).eq("id", booking.id);
                          setMessage(error ? error.message : "Booking deleted from the active list.");
                          await reload();
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!visibleBookings.length ? <div className="empty" style={{ marginTop: 15 }}>{showDeleted ? "No deleted bookings." : "No active bookings yet."}</div> : null}
    </div>
  );
}

function BookingDetails({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [loadingProof, setLoadingProof] = useState(false);
  const [proofError, setProofError] = useState("");

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProof() {
      if (!supabase || !booking.payment_proof_path) return;
      setLoadingProof(true);
      setProofError("");
      const { data, error } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(booking.payment_proof_path, 600);
      if (!active) return;
      if (error) setProofError(error.message);
      else setProofUrl(data.signedUrl);
      setLoadingProof(false);
    }

    void loadProof();
    return () => {
      active = false;
    };
  }, [booking.payment_proof_path]);

  const isImage = Boolean(booking.payment_proof_path && /\.(jpe?g|png|webp)$/i.test(booking.payment_proof_path));

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="booking-details-title">
        <div className="modal-header">
          <div>
            <div className="eyebrow">Booking details</div>
            <h2 id="booking-details-title">{booking.reference}</h2>
          </div>
          <button ref={closeButtonRef} className="button secondary small" type="button" onClick={onClose}>Close</button>
        </div>

        <div className="detail-meta booking-detail-meta">
          <div className="stat"><small>Customer</small><strong>{booking.customer_name}</strong></div>
          <div className="stat"><small>Phone</small><strong>{booking.customer_phone}</strong></div>
          <div className="stat"><small>Email</small><strong>{booking.customer_email}</strong></div>
          <div className="stat"><small>Property</small><strong>{booking.listing?.title || "Unavailable"}</strong></div>
          <div className="stat"><small>Preferred date</small><strong>{booking.preferred_date}</strong></div>
          <div className="stat"><small>Preferred time</small><strong>{booking.preferred_time}</strong></div>
          <div className="stat"><small>Payment method</small><strong>{booking.payment_method}</strong></div>
          <div className="stat"><small>Tour fee</small><strong>{formatGhs(Number(booking.tour_fee))}</strong></div>
          <div className="stat"><small>Status</small><strong>{booking.status.replaceAll("_", " ")}</strong></div>
          <div className="stat"><small>Submitted</small><strong>{new Date(booking.created_at).toLocaleString("en-GH")}</strong></div>
        </div>

        <div className="booking-detail-section">
          <h3>Additional information</h3>
          <p className="detail-note">{booking.notes || "No additional information was provided."}</p>
        </div>

        <div className="booking-detail-section">
          <h3>Payment proof</h3>
          {!booking.payment_proof_path ? <p className="location">No payment proof was uploaded.</p> : null}
          {loadingProof ? <div className="skeleton skeleton-proof" aria-label="Loading payment proof" /> : null}
          {proofError ? <div className="notice error" role="alert">Could not open the payment proof: {proofError}</div> : null}
          {proofUrl && isImage ? <img className="proof-preview" src={proofUrl} alt={`Payment proof for booking ${booking.reference}`} /> : null}
          {proofUrl && !isImage ? (
            <a className="button secondary" href={proofUrl} target="_blank" rel="noreferrer">Open payment proof</a>
          ) : null}
        </div>

        <div className="booking-detail-section">
          <h3>Consent record</h3>
          <p className="location">
            Terms accepted: {booking.terms_accepted ? "Yes" : "No"}. Privacy policy accepted: {booking.privacy_accepted ? "Yes" : "No"}.
            {booking.consent_at ? ` Recorded ${new Date(booking.consent_at).toLocaleString("en-GH")}.` : ""}
          </p>
        </div>
      </section>
    </div>
  );
}

function getAdStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = "/storage/v1/object/public/ad-media/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

async function removeAdMedia(ad: Ad) {
  if (!supabase || !ad.image_url) return;
  const path = getAdStoragePath(ad.image_url);
  if (!path) return;
  const { error } = await supabase.storage.from("ad-media").remove([path]);
  if (error) throw error;
}

function AdminEditorModal({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal admin-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-editor-title"
      >
        <div className="modal-header">
          <div>
            <div className="eyebrow">Admin editor</div>
            <h2 id="admin-editor-title">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="button secondary small"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function ListingPanel({
  listings,
  agents,
  editing,
  setEditing,
  reload,
  setMessage
}: {
  listings: Listing[];
  agents: Agent[];
  editing: Listing | null;
  setEditing: (value: Listing | null) => void;
  reload: () => Promise<void>;
  setMessage: (value: string) => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openListing(listing: Listing) {
    setEditing(listing);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
  }

  return (
    <div className="admin-grid">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Property inventory</h2>
            <p className="location">Only publish properties and media that you are authorised to advertise.</p>
          </div>
          <button className="button accent small" type="button" onClick={openNew}>
            Add new listing
          </button>
        </div>
        <div className="admin-list">
          {listings.map((listing) => (
            <div
              className="admin-list-item admin-clickable"
              key={listing.id}
              role="button"
              tabIndex={0}
              onClick={() => openListing(listing)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openListing(listing);
                }
              }}
            >
              <div>
                <strong>{listing.title}</strong>
                <div className="location">
                  {listing.location}, {listing.city} · {formatGhs(Number(listing.monthly_rent))}
                </div>
                <div className="agent-ref">Agent: {listingAgentLabel(listing, agents)}</div>
                <span className="status">{listing.status}</span>
              </div>
              <div className="admin-actions">
                <button
                  className="button secondary small"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openListing(listing);
                  }}
                >
                  Edit
                </button>
                <button
                  className="button danger small"
                  type="button"
                  onClick={async (event) => {
                    event.stopPropagation();
                    if (!window.confirm(`Delete ${listing.title}? This cannot be undone.`)) return;
                    const { error } = await supabase!.from("listings").delete().eq("id", listing.id);
                    setMessage(error ? error.message : "Listing deleted.");
                    await reload();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        {!listings.length ? <div className="empty">No listings have been created.</div> : null}
      </div>

      <AdminEditorModal
        open={editorOpen}
        title={editing ? "Edit listing" : "Add new listing"}
        onClose={closeEditor}
      >
        <ListingEditor
          key={editing?.id || "new-listing"}
          listing={editing}
          agents={agents}
          onSaved={async (msg) => {
            setMessage(msg);
            closeEditor();
            await reload();
          }}
          onCancel={closeEditor}
          onMessage={setMessage}
        />
      </AdminEditorModal>
    </div>
  );
}

function ListingEditor({
  listing,
  agents,
  onSaved,
  onCancel,
  onMessage
}: {
  listing: Listing | null;
  agents: Agent[];
  onSaved: (message: string) => Promise<void>;
  onCancel: () => void;
  onMessage: (message: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function uploadFiles(listingId: string, files: FileList | null, kind: "image" | "video") {
    if (!files || !files.length || !supabase) return { urls: [] as string[], thumbnails: [] as string[] };
    const urls: string[] = [];
    const thumbnails: string[] = [];
    const maxSize = kind === "image" ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    const allowed = kind === "image"
      ? ["image/jpeg", "image/png", "image/webp"]
      : ["video/mp4", "video/webm", "video/quicktime"];

    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        throw new Error(`${kind === "image" ? "Photo" : "Video"} ${file.name} is too large. Maximum is ${kind === "image" ? "8 MB" : "50 MB"}.`);
      }
      if (!allowed.includes(file.type)) {
        throw new Error(`${file.name} is not an accepted ${kind} format.`);
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `listings/${listingId}/${crypto.randomUUID()}-${safeName}`;
      const result = await supabase.storage.from("listing-media").upload(path, file, {
        upsert: false,
        contentType: file.type
      });
      if (result.error) {
        throw new Error(`${kind === "image" ? "Photo" : "Video"} upload failed: ${result.error.message}`);
      }
      urls.push(supabase.storage.from("listing-media").getPublicUrl(path).data.publicUrl);

      if (kind === "video") {
        const thumbnail = await createVideoThumbnail(file);
        if (thumbnail) {
          const thumbnailPath = `listings/${listingId}/thumbnails/${crypto.randomUUID()}.jpg`;
          const thumbnailUpload = await supabase.storage.from("listing-media").upload(thumbnailPath, thumbnail, {
            upsert: false,
            contentType: "image/jpeg"
          });
          if (!thumbnailUpload.error) {
            thumbnails.push(supabase.storage.from("listing-media").getPublicUrl(thumbnailPath).data.publicUrl);
          } else {
            thumbnails.push("");
          }
        } else {
          thumbnails.push("");
        }
      }
    }

    return { urls, thumbnails };
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    // Keep a stable reference before awaiting uploads or database requests.
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const status = String(form.get("status") || "draft");
    const rightsConfirmed = form.get("media_rights_confirmed") === "on";

    if (status === "published" && !rightsConfirmed) {
      onMessage("Confirm that you have the right or permission to publish the listing media before publishing.");
      return;
    }

    setSaving(true);

    try {
      const imageUrls = String(form.get("image_urls") || "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
      const videoUrls = String(form.get("video_urls") || "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
      const manualVideoThumbnails = String(form.get("video_thumbnail_urls") || "").split(/\r?\n/).map((value) => value.trim());
      const videoThumbnailUrls = videoUrls.map((url, index) => manualVideoThumbnails[index] || getVideoThumbnailUrl(url) || "");
      const payload = {
        title: String(form.get("title") || "").trim(),
        description: String(form.get("description") || "").trim(),
        property_type: String(form.get("property_type") || "Apartment"),
        location: String(form.get("location") || "").trim(),
        city: String(form.get("city") || "").trim(),
        region: String(form.get("region") || "").trim(),
        address: String(form.get("address") || "").trim() || null,
        monthly_rent: Number(form.get("monthly_rent") || 0),
        bedrooms: Number(form.get("bedrooms") || 0),
        bathrooms: Number(form.get("bathrooms") || 0),
        furnishing: String(form.get("furnishing") || "Unfurnished").trim(),
        room_type: String(form.get("room_type") || "Standard room").trim(),
        occupants: Number(form.get("occupants") || 1),
        lease_term: String(form.get("lease_term") || "12 months").trim(),
        amenities: String(form.get("amenities") || "").split(",").map((value) => value.trim()).filter(Boolean),
        image_urls: imageUrls,
        video_urls: videoUrls,
        video_thumbnail_urls: videoThumbnailUrls,
        contact_name: String(form.get("contact_name") || "").trim() || null,
        contact_phone: String(form.get("contact_phone") || "").trim() || null,
        media_rights_confirmed: rightsConfirmed,
        media_rights_note: String(form.get("media_rights_note") || "").trim() || null,
        status,
        is_demo: form.get("is_demo") === "on"
      };
      const agentId = String(form.get("agent_id") || "").trim() || null;

      let id = listing?.id;
      if (listing) {
        const { error } = await supabase.from("listings").update(payload).eq("id", listing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("listings").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }

      const photoInput = formElement.elements.namedItem("photo_files") as HTMLInputElement | null;
      const videoInput = formElement.elements.namedItem("video_files") as HTMLInputElement | null;
      const uploadedImages = await uploadFiles(id!, photoInput?.files || null, "image");
      const uploadedVideos = await uploadFiles(id!, videoInput?.files || null, "video");

      if (agentId) {
        const { error } = await supabase.from("listing_agents").upsert({ listing_id: id!, agent_id: agentId });
        if (error) throw error;
      } else {
        await supabase.from("listing_agents").delete().eq("listing_id", id!);
      }

      if (uploadedImages.urls.length || uploadedVideos.urls.length) {
        const { error } = await supabase.from("listings").update({
          image_urls: [...imageUrls, ...uploadedImages.urls],
          video_urls: [...videoUrls, ...uploadedVideos.urls],
          video_thumbnail_urls: [...videoThumbnailUrls, ...uploadedVideos.thumbnails]
        }).eq("id", id!);
        if (error) throw error;
      }

      await onSaved(listing ? "Listing updated." : "Listing created.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Could not save listing.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>{listing ? "Edit listing" : "Add a listing"}</h2>
      <p className="upload-note">Required fields are marked with an asterisk. Do not publish property information or media without permission.</p>

      <div className="form-group">
        <label htmlFor="listing-title">Property title *</label>
        <input className="field" id="listing-title" name="title" defaultValue={listing?.title || ""} maxLength={160} required />
      </div>
      <div className="form-group" style={{ marginTop: 12 }}>
        <label htmlFor="listing-description">Description *</label>
        <textarea className="field" id="listing-description" name="description" defaultValue={listing?.description || ""} maxLength={3000} required />
      </div>

      <div className="form-grid" style={{ marginTop: 12 }}>
        <div className="form-group"><label htmlFor="property-type">Type *</label><select className="field" id="property-type" name="property_type" defaultValue={listing?.property_type || "Apartment"}><option>Apartment</option><option>House</option><option>Studio</option><option>Hostel</option><option>Room</option></select></div>
        <div className="form-group"><label htmlFor="listing-location">Location / area *</label><input className="field" id="listing-location" name="location" defaultValue={listing?.location || ""} maxLength={120} required /></div>
        <div className="form-group"><label htmlFor="listing-city">City *</label><input className="field" id="listing-city" name="city" defaultValue={listing?.city || "Kumasi"} maxLength={100} required /></div>
        <div className="form-group"><label htmlFor="listing-region">Region *</label><input className="field" id="listing-region" name="region" defaultValue={listing?.region || "Ashanti"} maxLength={100} required /></div>
        <div className="form-group"><label htmlFor="monthly-rent">Monthly rent (GHS) *</label><input className="field" id="monthly-rent" type="number" name="monthly_rent" defaultValue={listing?.monthly_rent || 0} min="0" step="1" required /></div>
        <div className="form-group"><label htmlFor="room-type">Room / unit type *</label><input className="field" id="room-type" name="room_type" defaultValue={listing?.room_type || "Standard room"} maxLength={100} required /></div>
        <div className="form-group"><label htmlFor="bedrooms">Bedrooms / rooms *</label><input className="field" id="bedrooms" type="number" name="bedrooms" defaultValue={listing?.bedrooms || 1} min="0" max="100" required /></div>
        <div className="form-group"><label htmlFor="bathrooms">Bathrooms *</label><input className="field" id="bathrooms" type="number" name="bathrooms" defaultValue={listing?.bathrooms || 1} min="0" max="100" required /></div>
        <div className="form-group"><label htmlFor="occupants">Maximum occupants *</label><input className="field" id="occupants" type="number" name="occupants" defaultValue={listing?.occupants || 1} min="1" max="1000" required /></div>
        <div className="form-group"><label htmlFor="furnishing">Furnishing *</label><input className="field" id="furnishing" name="furnishing" defaultValue={listing?.furnishing || "Unfurnished"} maxLength={100} required /></div>
        <div className="form-group"><label htmlFor="lease-term">Lease / stay term *</label><input className="field" id="lease-term" name="lease_term" defaultValue={listing?.lease_term || "12 months"} maxLength={100} required /></div>
        <div className="form-group"><label htmlFor="contact-name">Property contact name</label><input className="field" id="contact-name" name="contact_name" defaultValue={listing?.contact_name || ""} maxLength={120} /></div>
        <div className="form-group"><label htmlFor="contact-phone">Property contact phone</label><input className="field" id="contact-phone" name="contact_phone" defaultValue={listing?.contact_phone || ""} maxLength={30} /></div>
      </div>

      <div className="form-group" style={{ marginTop: 12 }}><label htmlFor="listing-address">Address</label><input className="field" id="listing-address" name="address" defaultValue={listing?.address || ""} maxLength={250} /></div>
      <div className="form-group" style={{ marginTop: 12 }}><label htmlFor="amenities">Amenities, separated by commas</label><input className="field" id="amenities" name="amenities" defaultValue={listing?.amenities?.join(", ") || ""} maxLength={1000} /></div>

      <div className="form-group" style={{ marginTop: 12 }}><label htmlFor="image-urls">Photo URLs, one per line</label><textarea className="field" id="image-urls" name="image_urls" defaultValue={listing?.image_urls?.join("\n") || ""} /></div>
      <div className="form-group" style={{ marginTop: 12 }}>
        <label htmlFor="photo-files">Upload property photos</label>
        <input className="field" id="photo-files" type="file" name="photo_files" accept="image/jpeg,image/png,image/webp" multiple />
        <span className="upload-note">JPG, PNG or WebP. Maximum 8 MB per photo.</span>
      </div>

      <div className="form-group" style={{ marginTop: 12 }}><label htmlFor="video-urls">Video URLs, one per line</label><textarea className="field" id="video-urls" name="video_urls" defaultValue={listing?.video_urls?.join("\n") || ""} /></div>
      <div className="form-group" style={{ marginTop: 12 }}>
        <label htmlFor="video-files">Upload property videos</label>
        <input className="field" id="video-files" type="file" name="video_files" accept="video/mp4,video/webm,video/quicktime" multiple />
        <span className="upload-note">MP4, WebM or MOV. Maximum 50 MB per video.</span>
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <label htmlFor="video-thumbnail-urls">Video thumbnail URLs (optional)</label>
        <textarea className="field" id="video-thumbnail-urls" name="video_thumbnail_urls" defaultValue={listing?.video_thumbnail_urls?.join("\n") || ""} placeholder="One thumbnail URL per video. Uploaded videos get thumbnails automatically; YouTube URLs are detected automatically." />
        <span className="upload-note">Used for property cards and link previews when there is no property photo.</span>
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <label htmlFor="media-rights-note">Media rights note</label>
        <textarea className="field" id="media-rights-note" name="media_rights_note" defaultValue={listing?.media_rights_note || ""} maxLength={500} placeholder="For example: supplied by property owner; licensed stock media; or demo imagery source." />
      </div>

      <div className="form-grid" style={{ marginTop: 12 }}>
        <div className="form-group">
          <label htmlFor="listing-agent">Source agent</label>
          <select className="field" id="listing-agent" name="agent_id" defaultValue={(listing as Listing & { agent_id?: string | null })?.agent_id || ""}>
            <option value="">No agent assigned</option>
            {agents.filter((agent) => agent.status === "active").map((agent) => <option key={agent.id} value={agent.id}>{agent.agent_code} — {agent.full_name}</option>)}
          </select>
          <span className="upload-note">Internal only. This is never shown on the public property page.</span>
        </div>
        <div className="form-group"><label htmlFor="listing-status">Status</label><select className="field" id="listing-status" name="status" defaultValue={listing?.status || "draft"}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
        <label className="checkbox-label admin-check"><input type="checkbox" name="is_demo" defaultChecked={listing?.is_demo || false} /><span>Mark as demo listing</span></label>
      </div>

      <label className="checkbox-label admin-check" style={{ marginTop: 14 }}>
        <input type="checkbox" name="media_rights_confirmed" defaultChecked={listing?.media_rights_confirmed || false} />
        <span>I confirm that JDFortiHomes has the right or permission to publish the property information and media supplied in this form.</span>
      </label>

      <div className="admin-actions" style={{ marginTop: 18 }}>
        <button className="button accent" type="submit" disabled={saving}>{saving ? "Saving listing..." : listing ? "Save changes" : "Create listing"}</button>
        {listing ? <button className="button secondary" type="button" onClick={onCancel}>Cancel editing</button> : null}
      </div>
    </form>
  );
}


function AdPanel({
  ads,
  listings,
  agents,
  editing,
  setEditing,
  reload,
  setMessage
}: {
  ads: Ad[];
  listings: Listing[];
  agents: Agent[];
  editing: Ad | null;
  setEditing: (value: Ad | null) => void;
  reload: () => Promise<void>;
  setMessage: (value: string) => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const now = Date.now();

  function displayState(ad: Ad) {
    if (ad.status === "paused") return "Paused";
    if (ad.status === "draft") return "Draft";
    if (new Date(ad.ends_at).getTime() <= now) return "Expired";
    if (new Date(ad.starts_at).getTime() > now) return "Scheduled";
    return "Live";
  }

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openAd(ad: Ad) {
    setEditing(ad);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
  }

  async function removeAd(ad: Ad) {
    if (!window.confirm(`Delete ${ad.title}? This will permanently remove the advertisement from the database and website.`)) return;

    if (ad.listing_id) {
      const { error: listingError } = await supabase!.from("listings").update({
        is_sponsored: false,
        visibility_starts_at: null,
        visibility_ends_at: null
      }).eq("id", ad.listing_id);

      if (listingError) {
        setMessage(`Could not clear the sponsored property: ${listingError.message}`);
        return;
      }
    }

    try {
      await removeAdMedia(ad);
    } catch (error) {
      setMessage(`Could not remove advertisement media: ${error instanceof Error ? error.message : "Storage error"}`);
      return;
    }

    const { error } = await supabase!.from("ads").delete().eq("id", ad.id);
    if (error) {
      setMessage(`Could not delete advertisement: ${error.message}`);
      return;
    }

    closeEditor();
    setMessage("Advertisement permanently deleted from the database and website.");
    await reload();
  }

  async function clearAllAds() {
    if (!ads.length) {
      setMessage("There are no advertisements to clear.");
      return;
    }

    const confirmed = window.confirm(
      `Clear all ${ads.length} advertisements? This will permanently delete every advertisement from the database and remove all active sponsored-property promotion from the website. This cannot be undone.`
    );
    if (!confirmed) return;

    const sponsoredListingIds = ads
      .map((ad) => ad.listing_id)
      .filter((id): id is string => Boolean(id));

    if (sponsoredListingIds.length) {
      const { error: listingError } = await supabase!
        .from("listings")
        .update({
          is_sponsored: false,
          visibility_starts_at: null,
          visibility_ends_at: null
        })
        .in("id", sponsoredListingIds);

      if (listingError) {
        setMessage(`Could not clear sponsored-property visibility: ${listingError.message}`);
        return;
      }
    }

    try {
      for (const ad of ads) {
        await removeAdMedia(ad);
      }
    } catch (error) {
      setMessage(`Could not remove advertisement media: ${error instanceof Error ? error.message : "Storage error"}`);
      return;
    }

    const { error } = await supabase!.from("ads").delete().not("id", "is", null);
    if (error) {
      setMessage(`Could not clear advertisements: ${error.message}`);
      return;
    }

    closeEditor();
    setMessage("All advertisements have been permanently deleted from the database and website.");
    await reload();
  }

  async function toggleAd(ad: Ad) {
    const nextStatus = ad.status === "active" ? "paused" : "active";
    const { error } = await supabase!.from("ads").update({ status: nextStatus }).eq("id", ad.id);
    setMessage(error ? error.message : `Advertisement ${nextStatus === "active" ? "activated" : "paused"}.`);
    await reload();
  }

  return (
    <div className="admin-grid">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>Advertisements</h2>
            <p className="location">Create promotional placements and control exactly when they appear on the public website.</p>
          </div>
          <div className="admin-actions">
            <button className="button accent small" type="button" onClick={openNew}>
              Add new advertisement
            </button>
            <button className="button danger small" type="button" onClick={() => void clearAllAds()} disabled={!ads.length}>
              Clear all advertisements
            </button>
          </div>
        </div>
        <div className="admin-list">
          {ads.map((ad) => (
            <div
              className="admin-list-item admin-clickable"
              key={ad.id}
              role="button"
              tabIndex={0}
              onClick={() => openAd(ad)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openAd(ad);
                }
              }}
            >
              <div>
                <strong>{ad.title}</strong>
                <div className="location">{ad.ad_type === "sponsored_property" ? "Sponsored property" : "JDFortiHomes promotion"}</div>
                <div className="agent-ref">Agent: {adAgentLabel(ad, agents)}</div>
                <div className="location">{AD_PLACEMENTS[ad.placement as keyof typeof AD_PLACEMENTS] || ad.placement}</div>
                <div className="location">
                  {new Date(ad.starts_at).toLocaleString("en-GH")} → {new Date(ad.ends_at).toLocaleString("en-GH")}
                </div>
                <span className="status">{displayState(ad)}</span>
              </div>
              <div className="admin-actions">
                <button
                  className="button secondary small"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openAd(ad);
                  }}
                >
                  Edit
                </button>
                <button
                  className="button secondary small"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void toggleAd(ad);
                  }}
                >
                  {ad.status === "active" ? "Pause" : "Activate"}
                </button>
                <button
                  className="button danger small"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void removeAd(ad);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        {!ads.length ? <div className="empty">No advertisements have been created.</div> : null}
        <div className="notice" style={{ marginTop: 16 }}>
          <strong>Two useful ad types</strong><br />
          JDFortiHomes promotions can highlight messages such as “Affordable homes without the guesswork”, “Discover premium homes at better prices” or “Looking for a place near KNUST?”. Sponsored properties are paid placements for real apartments, rooms or homes supplied by property owners. Their campaign duration controls how long the sponsored property remains visible.
        </div>
      </div>

      <AdminEditorModal
        open={editorOpen}
        title={editing ? "Edit advertisement" : "Add new advertisement"}
        onClose={closeEditor}
      >
        <AdEditor
          key={editing?.id || "new-advertisement"}
          ad={editing}
          listings={listings}
          agents={agents}
          onSaved={async (msg) => {
            setMessage(msg);
            closeEditor();
            await reload();
          }}
          onCancel={closeEditor}
          onMessage={setMessage}
        />
      </AdminEditorModal>
    </div>
  );
}

function AdEditor({
  ad,
  listings,
  agents,
  onSaved,
  onCancel,
  onMessage
}: {
  ad: Ad | null;
  listings: Listing[];
  agents: Agent[];
  onSaved: (message: string) => Promise<void>;
  onCancel: () => void;
  onMessage: (message: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);

    try {
      const title = String(form.get("title") || "").trim();
      const description = String(form.get("description") || "").trim() || null;
      const advertiserName = String(form.get("advertiser_name") || "").trim() || null;
      const advertiserContact = String(form.get("advertiser_contact") || "").trim() || null;
      const internalNotes = String(form.get("internal_notes") || "").trim() || null;
      const adType = String(form.get("ad_type") || "platform_promotion");
      const listingId = String(form.get("listing_id") || "").trim() || null;
      const placement = String(form.get("placement") || "home_top");
      const enteredDestinationUrl = String(form.get("destination_url") || "").trim() || null;
      const startsAtValue = String(form.get("starts_at") || "");
      const duration = Number(form.get("duration"));
      const durationUnit = String(form.get("duration_unit") || "days");
      const status = String(form.get("status") || "draft");
      const agentId = String(form.get("agent_id") || "").trim() || null;

      if (!title || !startsAtValue || !Number.isFinite(duration) || duration <= 0) {
        throw new Error("Enter a title, start date/time and a duration greater than zero.");
      }
      if (!["platform_promotion", "sponsored_property"].includes(adType)) {
        throw new Error("Choose a valid advertisement category.");
      }
      if (adType === "sponsored_property" && !listingId) {
        throw new Error("Select the property being sponsored.");
      }
      if (!enteredDestinationUrl || !enteredDestinationUrl.startsWith("/")) {
        if (enteredDestinationUrl) {
          try {
            new URL(enteredDestinationUrl);
          } catch {
            throw new Error("The destination URL must be a full URL or an internal path starting with /.");
          }
        }
      }

      const destinationUrl = adType === "sponsored_property" && listingId
        ? `/listing/${listingId}`
        : enteredDestinationUrl;

      const startsAt = new Date(startsAtValue);
      if (Number.isNaN(startsAt.getTime())) throw new Error("Enter a valid start date and time.");

      let durationMs = duration * 24 * 60 * 60 * 1000;
      if (durationUnit === "weeks") durationMs = duration * 7 * 24 * 60 * 60 * 1000;
      if (durationUnit === "months") {
        const end = new Date(startsAt);
        end.setMonth(end.getMonth() + duration);
        durationMs = end.getTime() - startsAt.getTime();
      }
      const endsAt = new Date(startsAt.getTime() + durationMs);

      const file = (formElement.elements.namedItem("ad_image") as HTMLInputElement | null)?.files?.[0];
      let imageUrl = ad?.image_url || null;

      if (file) {
        if (file.size > MAX_AD_IMAGE_SIZE) throw new Error("Advertisement image must be 5 MB or smaller.");
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          throw new Error("Advertisement image must be JPG, PNG or WebP.");
        }
      }

      const payload = {
        title,
        description,
        ad_type: adType,
        listing_id: adType === "sponsored_property" ? listingId : null,
        advertiser_name: advertiserName,
        advertiser_contact: advertiserContact,
        internal_notes: internalNotes,
        destination_url: destinationUrl,
        placement,
        status,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString()
      };

      let id = ad?.id;
      if (ad) {
        const { error } = await supabase.from("ads").update(payload).eq("id", ad.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("ads").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }

      if (id && ad?.listing_id && ad.listing_id !== listingId) {
        await supabase.from("listings").update({
          is_sponsored: false,
          visibility_starts_at: null,
          visibility_ends_at: null
        }).eq("id", ad.listing_id);
      }

      if (id && adType === "sponsored_property" && listingId) {
        const { error } = await supabase.from("listings").update({
          is_sponsored: true,
          visibility_starts_at: startsAt.toISOString(),
          visibility_ends_at: endsAt.toISOString(),
          status: "published"
        }).eq("id", listingId);
        if (error) throw error;
      }

      if (id && agentId) {
        const { error } = await supabase.from("ad_agents").upsert({ ad_id: id, agent_id: agentId });
        if (error) throw error;
      } else if (id) {
        await supabase.from("ad_agents").delete().eq("ad_id", id);
      }

      if (id && adType === "platform_promotion" && ad?.listing_id) {
        await supabase.from("listings").update({
          is_sponsored: false,
          visibility_starts_at: null,
          visibility_ends_at: null
        }).eq("id", ad.listing_id);
      }

      if (file && id) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `ads/${id}/${crypto.randomUUID()}-${safeName}`;
        const upload = await supabase.storage.from("ad-media").upload(path, file, {
          upsert: false,
          contentType: file.type
        });
        if (upload.error) throw upload.error;

        const publicUrl = supabase.storage.from("ad-media").getPublicUrl(path).data.publicUrl;
        const { error } = await supabase.from("ads").update({ image_url: publicUrl }).eq("id", id);
        if (error) throw error;
      }

      await onSaved(ad ? "Advertisement updated." : "Advertisement created.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Could not save advertisement.");
    } finally {
      setSaving(false);
    }
  }

  const localStart = ad
    ? new Date(new Date(ad.starts_at).getTime() - new Date(ad.starts_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : "";
  const existingDurationDays = ad
    ? Math.max(0.01, Number(((new Date(ad.ends_at).getTime() - new Date(ad.starts_at).getTime()) / (24 * 60 * 60 * 1000)).toFixed(2)))
    : 7;

  return (
    <form className="panel" onSubmit={submit}>
      <h2>{ad ? "Edit advertisement" : "Create an advertisement"}</h2>
      <p className="upload-note">Use platform promotions for JDFortiHomes campaigns. Use sponsored property for an apartment, room or home a property owner has paid you to promote for a limited period.</p>

      <div className="form-group">
        <label htmlFor="ad-type">Advertisement category *</label>
        <select className="field" id="ad-type" name="ad_type" defaultValue={ad?.ad_type || "platform_promotion"}>
          <option value="platform_promotion">JDFortiHomes promotion</option>
          <option value="sponsored_property">Sponsored property</option>
        </select>
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <label htmlFor="ad-listing">Sponsored property</label>
        <select className="field" id="ad-listing" name="listing_id" defaultValue={ad?.listing_id || ""}>
          <option value="">Select a property</option>
          {listings.filter((item) => !item.is_demo).map((item) => (
            <option key={item.id} value={item.id}>{item.title} — {item.location}, {item.city}</option>
          ))}
        </select>
        <span className="upload-note">Required only for Sponsored property. The selected property will automatically stop appearing when this campaign ends.</span>
      </div>

      <div className="form-group">
        <label htmlFor="ad-agent">Source agent</label>
        <select className="field" id="ad-agent" name="agent_id" defaultValue={(ad as Ad & { agent_id?: string | null })?.agent_id || ""}>
          <option value="">No agent assigned</option>
          {agents.filter((agent) => agent.status === "active").map((agent) => <option key={agent.id} value={agent.id}>{agent.agent_code} — {agent.full_name}</option>)}
        </select>
        <span className="upload-note">Internal only. This is never shown in the public advertisement.</span>
      </div>

      <div className="form-group">
        <label htmlFor="ad-title">Ad title *</label>
        <input className="field" id="ad-title" name="title" defaultValue={ad?.title || ""} maxLength={160} required />
      </div>

      <div className="form-grid" style={{ marginTop: 12 }}>
        <div className="form-group">
          <label htmlFor="ad-advertiser-name">Advertiser / property owner</label>
          <input className="field" id="ad-advertiser-name" name="advertiser_name" defaultValue={ad?.advertiser_name || ""} maxLength={160} placeholder="Optional" />
        </div>
        <div className="form-group">
          <label htmlFor="ad-advertiser-contact">Advertiser contact</label>
          <input className="field" id="ad-advertiser-contact" name="advertiser_contact" defaultValue={ad?.advertiser_contact || ""} maxLength={160} placeholder="Phone or email" />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <label htmlFor="ad-description">Short message</label>
        <textarea className="field" id="ad-description" name="description" defaultValue={ad?.description || ""} maxLength={500} placeholder="For example: Student-friendly apartments now available in Ayeduase." />
      </div>

      <div className="form-grid" style={{ marginTop: 12 }}>
        <div className="form-group">
          <label htmlFor="ad-placement">Placement *</label>
          <select className="field" id="ad-placement" name="placement" defaultValue={ad?.placement || "home_top"}>
            {Object.entries(AD_PLACEMENTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="ad-status">Status *</label>
          <select className="field" id="ad-status" name="status" defaultValue={ad?.status || "draft"}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      <div className="form-grid" style={{ marginTop: 12 }}>
        <div className="form-group">
          <label htmlFor="ad-starts-at">Starts *</label>
          <input className="field" id="ad-starts-at" name="starts_at" type="datetime-local" defaultValue={localStart} required />
        </div>
        <div className="form-group">
          <label htmlFor="ad-duration">Duration *</label>
          <input className="field" id="ad-duration" name="duration" type="number" min="0.01" step="0.01" defaultValue={existingDurationDays} required />
        </div>
        <div className="form-group">
          <label htmlFor="ad-duration-unit">Duration unit *</label>
          <select className="field" id="ad-duration-unit" name="duration_unit" defaultValue="days">
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <label htmlFor="ad-destination">Destination link</label>
        <input className="field" id="ad-destination" name="destination_url" type="text" defaultValue={ad?.destination_url || ""} maxLength={500} placeholder="https://example.com or /find-a-place" disabled={false} />
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <label htmlFor="ad-internal-notes">Internal notes</label>
        <textarea className="field" id="ad-internal-notes" name="internal_notes" defaultValue={ad?.internal_notes || ""} maxLength={1000} placeholder="Private campaign notes. These are not shown publicly." />
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <label htmlFor="ad-image">Advertisement image</label>
        <input className="field" id="ad-image" name="ad_image" type="file" accept="image/jpeg,image/png,image/webp" />
        <span className="upload-note">Optional. JPG, PNG or WebP, maximum 5 MB. Images are stored in the public ad-media bucket.</span>
      </div>

      {ad?.image_url ? <img className="ad-admin-preview" src={ad.image_url} alt="Current advertisement artwork" /> : null}

      <div className="admin-actions" style={{ marginTop: 18 }}>
        <button className="button accent" type="submit" disabled={saving}>{saving ? "Saving advertisement..." : ad ? "Save changes" : "Create advertisement"}</button>
        {ad ? <button className="button secondary" type="button" onClick={onCancel}>Cancel editing</button> : null}
      </div>
    </form>
  );
}

function listingAgentLabel(listing: Listing, agents: Agent[]) {
  return agents.find((agent) => agent.id === (listing as Listing & { agent_id?: string }).agent_id)?.agent_code || "Unassigned";
}

function adAgentLabel(ad: Ad, agents: Agent[]) {
  return agents.find((agent) => agent.id === (ad as Ad & { agent_id?: string }).agent_id)?.agent_code || "Unassigned";
}

function AgentPanel({
  agents,
  payouts,
  listings,
  ads,
  reload,
  setMessage
}: {
  agents: Agent[];
  payouts: AgentPayout[];
  listings: Listing[];
  ads: Ad[];
  reload: () => Promise<void>;
  setMessage: (value: string) => void;
}) {
  const [editing, setEditing] = useState<Agent | null>(null);
  const [agentEditorOpen, setAgentEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.id || "");

  async function saveAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const userId = String(form.get("user_id") || "").trim() || null;
    const payload = {
      agent_code: String(form.get("agent_code") || "").trim().toUpperCase(),
      full_name: String(form.get("full_name") || "").trim(),
      phone: String(form.get("phone") || "").trim() || null,
      email: String(form.get("email") || "").trim() || null,
      notes: String(form.get("notes") || "").trim() || null,
      status: String(form.get("status") || "active")
    };
    if (!payload.agent_code || !payload.full_name) { setMessage("Agent ID and name are required."); return; }
    setSaving(true);
    const result = editing
      ? await supabase.from("agents").update(payload).eq("id", editing.id)
      : await supabase.from("agents").insert(payload).select("id").single();
    if (result.error) {
      setSaving(false);
      setMessage(result.error.message);
      return;
    }

    const agentId = editing?.id || ("data" in result ? result.data?.id : null);
    if (agentId) {
      const { error: linkError } = await supabase.rpc("link_agent_account", {
        agent_record_id: agentId,
        auth_user_id: userId
      });
      if (linkError) {
        setSaving(false);
        setMessage(linkError.message);
        return;
      }
    }

    setSaving(false);
    setMessage(editing ? "Agent updated." : "Agent added.");
    setAgentEditorOpen(false);
    setEditing(null);
    await reload();
  }

  async function updatePayout(id: string, status: string) {
    if (!supabase) return;
    const payload: Record<string, unknown> = { status };
    if (status === "paid") payload.paid_at = new Date().toISOString();
    const { error } = await supabase.from("agent_payouts").update(payload).eq("id", id);
    setMessage(error ? error.message : "Agent payout updated.");
    await reload();
  }

  async function createPayout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const form = new FormData(event.currentTarget);
    const agentId = String(form.get("agent_id") || "");
    const amount = Number(form.get("amount") || 0);
    if (!agentId || !Number.isFinite(amount) || amount < 0) { setMessage("Select an agent and enter a valid amount."); return; }
    const { error } = await supabase.from("agent_payouts").insert({
      agent_id: agentId,
      listing_id: String(form.get("listing_id") || "") || null,
      ad_id: String(form.get("ad_id") || "") || null,
      amount,
      currency: "GHS",
      status: "pending",
      reference: String(form.get("reference") || "").trim() || null,
      notes: String(form.get("notes") || "").trim() || null
    });
    if (error) setMessage(error.message); else { setMessage("Agent payout recorded as pending."); event.currentTarget.reset(); await reload(); }
  }

  return (
    <div className="admin-grid">
      <div>
        <div className="panel">
          <div className="panel-heading"><div><h2>Agents</h2><p className="location">Keep a private record of agents who source or submit properties and campaigns.</p></div><button className="button accent small" type="button" onClick={() => { setEditing(null); setAgentEditorOpen(true); }}>Add new agent</button></div>
          <div className="admin-list">
            {agents.map((agent) => (
              <div
                className="admin-list-item admin-clickable"
                key={agent.id}
                role="button"
                tabIndex={0}
                onClick={() => { setEditing(agent); setAgentEditorOpen(true); }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setEditing(agent);
                    setAgentEditorOpen(true);
                  }
                }}
              >
                <div><strong>{agent.agent_code}</strong><div>{agent.full_name}</div><div className="location">{agent.phone || agent.email || "No contact details"} · {agent.status}</div><div className="agent-ref">Account: {agent.user_id ? "Linked" : "Not linked"}</div></div>
                <div className="admin-actions"><button className="button secondary small" type="button" onClick={(event) => { event.stopPropagation(); setEditing(agent); setAgentEditorOpen(true); }}>Edit</button><button className="button secondary small" type="button" onClick={(event) => { event.stopPropagation(); setSelectedAgent(agent.id); }}>View payouts</button></div>
              </div>
            ))}
          </div>
          {!agents.length ? <div className="empty">No agents have been added yet.</div> : null}
        </div>

        <AdminEditorModal
          open={agentEditorOpen}
          title={editing ? "Edit agent" : "Add new agent"}
          onClose={() => { setAgentEditorOpen(false); setEditing(null); }}
        >
          <form key={editing?.id || "new-agent"} onSubmit={saveAgent}>
            <div className="form-grid" style={{ marginTop: 12 }}>
              <div className="form-group"><label htmlFor="agent-code">Agent ID *</label><input className="field" id="agent-code" name="agent_code" defaultValue={editing?.agent_code || ""} placeholder="AG-001" maxLength={40} required /></div>
              <div className="form-group"><label htmlFor="agent-name">Full name *</label><input className="field" id="agent-name" name="full_name" defaultValue={editing?.full_name || ""} maxLength={120} required /></div>
              <div className="form-group"><label htmlFor="agent-phone">Phone</label><input className="field" id="agent-phone" name="phone" defaultValue={editing?.phone || ""} maxLength={40} /></div>
              <div className="form-group"><label htmlFor="agent-email">Email</label><input className="field" id="agent-email" name="email" type="email" defaultValue={editing?.email || ""} maxLength={160} /></div>
              <div className="form-group"><label htmlFor="agent-status">Status</label><select className="field" id="agent-status" name="status" defaultValue={editing?.status || "active"}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            </div>
            <div className="form-group"><label htmlFor="agent-user-id">Supabase Auth user ID</label><input className="field" id="agent-user-id" name="user_id" defaultValue={editing?.user_id || ""} placeholder="Optional — link the agent login account" /><span className="upload-note">Create the user in Supabase Authentication first, then paste their user ID here.</span></div>
            <div className="form-group" style={{ marginTop: 12 }}><label htmlFor="agent-notes">Internal notes</label><textarea className="field" id="agent-notes" name="notes" defaultValue={editing?.notes || ""} maxLength={1000} /></div>
            <div className="admin-actions" style={{ marginTop: 16 }}><button className="button accent" type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save agent" : "Add agent"}</button><button className="button secondary" type="button" onClick={() => { setAgentEditorOpen(false); setEditing(null); }}>Cancel</button></div>
          </form>
        </AdminEditorModal>
      </div>

      <div className="panel">
        <h2>Agent payouts</h2>
        <p className="location">Record commissions or sourcing fees privately. Nothing here appears on the public site.</p>
        <form onSubmit={createPayout} style={{ marginTop: 14 }}>
          <div className="form-grid">
            <div className="form-group"><label htmlFor="payout-agent">Agent *</label><select className="field" id="payout-agent" name="agent_id" value={selectedAgent} onChange={(event) => setSelectedAgent(event.target.value)} required><option value="">Select agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.agent_code} — {agent.full_name}</option>)}</select></div>
            <div className="form-group"><label htmlFor="payout-amount">Amount (GHS) *</label><input className="field" id="payout-amount" name="amount" type="number" min="0" step="0.01" required /></div>
            <div className="form-group"><label htmlFor="payout-listing">Listing</label><select className="field" id="payout-listing" name="listing_id"><option value="">None</option>{listings.filter((item) => !item.is_demo).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
            <div className="form-group"><label htmlFor="payout-ad">Advertisement</label><select className="field" id="payout-ad" name="ad_id"><option value="">None</option>{ads.map((ad) => <option key={ad.id} value={ad.id}>{ad.title}</option>)}</select></div>
          </div>
          <div className="form-grid" style={{ marginTop: 12 }}><div className="form-group"><label htmlFor="payout-reference">Payment reference</label><input className="field" id="payout-reference" name="reference" maxLength={120} /></div><div className="form-group"><label htmlFor="payout-notes">Notes</label><input className="field" id="payout-notes" name="notes" maxLength={500} /></div></div>
          <button className="button accent" type="submit" style={{ marginTop: 14 }}>Record pending payout</button>
        </form>
        <div className="admin-list" style={{ marginTop: 20 }}>
          {payouts.filter((payout) => !selectedAgent || payout.agent_id === selectedAgent).map((payout) => (
            <div className="admin-list-item" key={payout.id}>
              <div><strong>{payout.agent?.agent_code || "Agent"} · GH₵{Number(payout.amount).toFixed(2)}</strong><div className="location">{payout.status} · {payout.reference || "No reference"}</div><div className="location">{payout.notes || "No notes"}</div></div>
              <select className="field compact-select" aria-label={`Update payout status for ${payout.agent?.agent_code || "agent"}`} value={payout.status} onChange={(event) => void updatePayout(payout.id, event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option></select>
            </div>
          ))}
        </div>
        {!payouts.filter((payout) => !selectedAgent || payout.agent_id === selectedAgent).length ? <div className="empty" style={{ marginTop: 15 }}>No payouts for the selected agent.</div> : null}
      </div>
    </div>
  );
}

function exportBookings(bookings: Booking[]) {
  const headers = ["Reference", "Customer", "Phone", "Email", "Property", "Date", "Time", "Fee", "Payment method", "Notes", "Status"];
  const rows = bookings.map((item) => [
    item.reference,
    item.customer_name,
    item.customer_phone,
    item.customer_email,
    item.listing?.title || "",
    item.preferred_date,
    item.preferred_time,
    item.tour_fee,
    item.payment_method,
    item.notes || "",
    item.status
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "jdfortihomes-bookings.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
