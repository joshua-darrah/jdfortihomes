import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { siteConfig } from "@/lib/site-config";
import { makeBookingReference } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_PROOF_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const recentRequests = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function text(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const client = getAdminClient();
  if (!client) {
    return NextResponse.json({ error: "Booking service is not configured." }, { status: 503 });
  }

  try {
    const forwarded = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const clientKey = forwarded.split(",")[0].trim() || "unknown";
    const now = Date.now();
    const recent = (recentRequests.get(clientKey) || []).filter((time) => now - time < WINDOW_MS);
    if (recentRequests.size > 5000) {
      for (const [key, times] of recentRequests) {
        if (!times.some((time) => now - time < WINDOW_MS)) recentRequests.delete(key);
      }
    }
    if (recent.length >= MAX_REQUESTS) {
      return NextResponse.json({ error: "Too many booking attempts. Please wait a few minutes and try again." }, { status: 429 });
    }
    recent.push(now);
    recentRequests.set(clientKey, recent);

    const form = await request.formData();
    const listingId = text(form.get("listing_id"), 80);
    const customerName = text(form.get("customer_name"), 120);
    const customerEmail = text(form.get("customer_email"), 160).toLowerCase();
    const customerPhone = text(form.get("customer_phone"), 30);
    const preferredDate = text(form.get("preferred_date"), 20);
    const preferredTime = text(form.get("preferred_time"), 40);
    const paymentMethod = text(form.get("payment_method"), 40);
    const notes = text(form.get("notes"), 1000) || null;
    const termsAccepted = form.get("terms_accepted") === "on";
    const privacyAccepted = form.get("privacy_accepted") === "on";
    const proof = form.get("payment_proof");
    const website = text(form.get("website"), 100);
    if (website) {
      return NextResponse.json({ error: "We could not process this request." }, { status: 400 });
    }

    if (!listingId || !customerName || !customerEmail || !customerPhone || !preferredDate || !preferredTime || !paymentMethod) {
      return NextResponse.json({ error: "Please complete all required booking fields." }, { status: 400 });
    }
    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json({ error: "Terms and privacy consent are required." }, { status: 400 });
    }
    if (!(proof instanceof File) || proof.size === 0) {
      return NextResponse.json({ error: "Payment proof is required." }, { status: 400 });
    }
    if (proof.size > MAX_PROOF_SIZE || !ALLOWED_TYPES.has(proof.type)) {
      return NextResponse.json({ error: "Payment proof must be a JPG, PNG, WebP or PDF up to 5 MB." }, { status: 400 });
    }

    const { data: listing, error: listingError } = await client
      .from("listings")
      .select("id, status, is_demo, visibility_starts_at, visibility_ends_at")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError || !listing || (listing.status !== "published" && !listing.is_demo) || (listing.visibility_starts_at && new Date(listing.visibility_starts_at).getTime() > Date.now()) || (listing.visibility_ends_at && new Date(listing.visibility_ends_at).getTime() <= Date.now())) {
      return NextResponse.json({ error: "The selected property is not currently available for booking." }, { status: 400 });
    }

    const reference = makeBookingReference();
    const safeName = proof.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
    const proofPath = `proofs/${reference}/${safeName}`;

    const upload = await client.storage.from("payment-proofs").upload(proofPath, proof, {
      upsert: false,
      contentType: proof.type
    });
    if (upload.error) {
      return NextResponse.json({ error: `Payment proof upload failed: ${upload.error.message}` }, { status: 400 });
    }

    const { error: bookingError } = await client.from("bookings").insert({
      reference,
      listing_id: listingId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      notes,
      tour_fee: siteConfig.tourFeeGhs,
      payment_method: paymentMethod,
      payment_proof_path: proofPath,
      terms_accepted: true,
      privacy_accepted: true,
      consent_at: new Date().toISOString(),
      status: "payment_submitted"
    });

    if (bookingError) {
      await client.storage.from("payment-proofs").remove([proofPath]);
      return NextResponse.json({ error: bookingError.message }, { status: 400 });
    }

    return NextResponse.json({ reference }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not process the booking. Please try again." }, { status: 500 });
  }
}
