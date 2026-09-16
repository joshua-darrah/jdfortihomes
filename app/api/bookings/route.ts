import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasPaymentInstructions, siteConfig } from "@/lib/site-config";
import { makeBookingReference } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_PROOF_SIZE = 5 * 1024 * 1024;
const MAX_TOURS_PER_BOOKING = 10;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const recentRequests = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function text(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseListingIds(form: FormData) {
  const raw = text(form.get("listing_ids"), 4000);
  if (!raw) {
    const single = text(form.get("listing_id"), 80);
    return single ? [single] : [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.map((value) => String(value).trim()).filter(Boolean)));
  } catch {
    return [];
  }
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
      return NextResponse.json(
        { error: "Too many booking attempts. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }

    recent.push(now);
    recentRequests.set(clientKey, recent);

    const form = await request.formData();
    const listingIds = parseListingIds(form);
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

    if (!listingIds.length || listingIds.length > MAX_TOURS_PER_BOOKING) {
      return NextResponse.json(
        { error: `Please select between 1 and ${MAX_TOURS_PER_BOOKING} property tours.` },
        { status: 400 }
      );
    }

    if (!customerName || !customerEmail || !customerPhone || !preferredDate || !preferredTime || !paymentMethod) {
      return NextResponse.json({ error: "Please complete all required booking fields." }, { status: 400 });
    }

    if (!termsAccepted || !privacyAccepted) {
      return NextResponse.json({ error: "Terms and privacy consent are required." }, { status: 400 });
    }

    if (!(proof instanceof File) || proof.size === 0) {
      return NextResponse.json({ error: "Payment proof is required." }, { status: 400 });
    }

    if (proof.size > MAX_PROOF_SIZE || !ALLOWED_TYPES.has(proof.type)) {
      return NextResponse.json(
        { error: "Payment proof must be a JPG, PNG, WebP or PDF up to 5 MB." },
        { status: 400 }
      );
    }

    if (!hasPaymentInstructions()) {
      return NextResponse.json(
        { error: "Payment instructions are not configured yet. Please contact JDFortiHomes." },
        { status: 503 }
      );
    }

    const { data: listings, error: listingError } = await client
      .from("listings")
      .select("id, status, is_demo, visibility_starts_at, visibility_ends_at, agent_fee")
      .in("id", listingIds);

    if (listingError || !listings || listings.length !== listingIds.length) {
      return NextResponse.json({ error: "One or more selected properties could not be found." }, { status: 400 });
    }

    const listingMap = new Map(listings.map((item) => [item.id, item]));
    for (const listingId of listingIds) {
      const listing = listingMap.get(listingId);
      if (
        !listing ||
        (listing.status !== "published" && !listing.is_demo) ||
        (listing.visibility_starts_at && new Date(listing.visibility_starts_at).getTime() > Date.now()) ||
        (listing.visibility_ends_at && new Date(listing.visibility_ends_at).getTime() <= Date.now())
      ) {
        return NextResponse.json(
          { error: "One or more selected properties is no longer available for booking." },
          { status: 400 }
        );
      }
    }

    const [{ data: settings }, { data: discountRows }, { data: listingAgents }] = await Promise.all([
      client
        .from("platform_settings")
        .select("default_tour_fee, agent_commission_rate")
        .eq("id", 1)
        .maybeSingle(),
      client
        .from("tour_fee_discounts")
        .select("min_tours, discount_rate")
        .lte("min_tours", listingIds.length)
        .order("min_tours", { ascending: false })
        .limit(1),
      client
        .from("listing_agents")
        .select("listing_id, agent_id")
        .in("listing_id", listingIds)
    ]);

    const defaultTourFee = Number(settings?.default_tour_fee ?? siteConfig.tourFeeGhs);
    const commissionRateSetting = Number(settings?.agent_commission_rate ?? 15);
    const discountRate = Number(discountRows?.[0]?.discount_rate ?? 0);
    const agentMap = new Map((listingAgents || []).map((row) => [row.listing_id, row.agent_id]));

    if (!Number.isFinite(defaultTourFee) || defaultTourFee < 0) {
      return NextResponse.json({ error: "The default tour-fee configuration is invalid." }, { status: 500 });
    }

    if (!Number.isFinite(commissionRateSetting) || commissionRateSetting < 0 || commissionRateSetting > 100) {
      return NextResponse.json({ error: "The JDFortiHomes commission configuration is invalid." }, { status: 500 });
    }

    if (!Number.isFinite(discountRate) || discountRate < 0 || discountRate > 100) {
      return NextResponse.json({ error: "The multi-tour discount configuration is invalid." }, { status: 500 });
    }

    const items = listingIds.map((listingId) => {
      const listing = listingMap.get(listingId)!;
      const agentFee = listing.agent_fee === null || listing.agent_fee === undefined
        ? null
        : Number(listing.agent_fee);
      const baseTourFee = agentFee !== null ? agentFee : defaultTourFee;

      if (!Number.isFinite(baseTourFee) || baseTourFee < 0) {
        throw new Error("One of the selected properties has an invalid tour fee.");
      }

      if (agentFee !== null && !agentMap.get(listingId)) {
        throw new Error("One of the selected properties has an agent fee configured but no assigned agent.");
      }

      const tourFee = Number((baseTourFee * (1 - discountRate / 100)).toFixed(2));
      const commissionRate = agentFee !== null ? commissionRateSetting : 0;
      const commissionAmount = agentFee !== null
        ? Number((tourFee * commissionRate / 100).toFixed(2))
        : 0;
      const agentPayoutAmount = agentFee !== null
        ? Number((tourFee - commissionAmount).toFixed(2))
        : 0;

      return {
        listingId,
        baseTourFee,
        tourFee,
        agentFee,
        commissionRate,
        commissionAmount,
        agentPayoutAmount
      };
    });

    const totalTourFee = Number(items.reduce((sum, item) => sum + item.tourFee, 0).toFixed(2));
    const totalAgentFee = items.some((item) => item.agentFee !== null)
      ? Number(items.reduce((sum, item) => sum + (item.agentFee ?? 0), 0).toFixed(2))
      : null;
    const totalCommission = Number(items.reduce((sum, item) => sum + item.commissionAmount, 0).toFixed(2));
    const totalPayout = Number(items.reduce((sum, item) => sum + item.agentPayoutAmount, 0).toFixed(2));

    const reference = makeBookingReference();
    const safeName = proof.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
    const proofPath = `proofs/${reference}/${safeName}`;

    const upload = await client.storage.from("payment-proofs").upload(proofPath, proof, {
      upsert: false,
      contentType: proof.type
    });

    if (upload.error) {
      return NextResponse.json(
        { error: `Payment proof upload failed: ${upload.error.message}` },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await client
      .from("bookings")
      .insert({
        reference,
        listing_id: listingIds[0],
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        notes,
        tour_fee: totalTourFee,
        agent_fee: totalAgentFee,
        platform_commission_rate: commissionRateSetting,
        platform_commission_amount: totalCommission,
        agent_payout_amount: totalPayout,
        payment_method: paymentMethod,
        payment_proof_path: proofPath,
        terms_accepted: true,
        privacy_accepted: true,
        consent_at: new Date().toISOString(),
        status: "payment_submitted"
      })
      .select("id")
      .single();

    if (bookingError || !booking) {
      await client.storage.from("payment-proofs").remove([proofPath]);
      return NextResponse.json({ error: bookingError?.message || "Could not create the booking." }, { status: 400 });
    }

    const { error: itemError } = await client.from("booking_items").insert(
      items.map((item) => ({
        booking_id: booking.id,
        listing_id: item.listingId,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        base_tour_fee: item.baseTourFee,
        discount_rate: discountRate,
        tour_fee: item.tourFee,
        agent_fee: item.agentFee,
        platform_commission_rate: item.commissionRate,
        platform_commission_amount: item.commissionAmount,
        agent_payout_amount: item.agentPayoutAmount
      }))
    );

    if (itemError) {
      await client.from("bookings").delete().eq("id", booking.id);
      await client.storage.from("payment-proofs").remove([proofPath]);
      return NextResponse.json({ error: itemError.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        reference,
        tourCount: items.length,
        totalTourFee,
        discountRate,
        savings: Number((items.reduce((sum, item) => sum + item.baseTourFee, 0) - totalTourFee).toFixed(2))
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "We could not process the booking. Please try again." },
      { status: 500 }
    );
  }
}
