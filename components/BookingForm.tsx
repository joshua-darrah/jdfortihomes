"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { hasPaymentInstructions, siteConfig } from "@/lib/site-config";
import { supabase } from "@/lib/supabase";
import type { Listing } from "@/lib/types";
import { formatGhs } from "@/lib/utils";

const MAX_PROOF_SIZE = 5 * 1024 * 1024;

type TourListing = Pick<Listing, "id" | "title" | "location" | "city"> & { tourFee: number };
type SelectedListing = TourListing;

export function BookingForm({
  listing,
  tourFee,
  availableListings
}: {
  listing: Listing;
  tourFee: number;
  availableListings: TourListing[];
}) {
  const initialListing: SelectedListing = { ...listing, tourFee };
  const [selectedListings, setSelectedListings] = useState<SelectedListing[]>([initialListing]);
  const [propertyToAdd, setPropertyToAdd] = useState("");
  const [discountRate, setDiscountRate] = useState(0);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDiscount() {
      if (!supabase) return;
      setDiscountLoading(true);
      const { data, error: discountError } = await supabase.rpc("get_public_tour_discount", {
        tour_count: selectedListings.length
      });
      if (!cancelled) {
        if (!discountError) setDiscountRate(Number(data || 0));
        else setDiscountRate(0);
        setDiscountLoading(false);
      }
    }

    void loadDiscount();
    return () => {
      cancelled = true;
    };
  }, [selectedListings.length]);

  const totalBeforeDiscount = useMemo(
    () => selectedListings.reduce((total, item) => total + Number(item.tourFee), 0),
    [selectedListings]
  );

  const totalTourFee = useMemo(
    () => Number((totalBeforeDiscount * (1 - discountRate / 100)).toFixed(2)),
    [totalBeforeDiscount, discountRate]
  );

  const savings = Number((totalBeforeDiscount - totalTourFee).toFixed(2));

  function addProperty() {
    if (!propertyToAdd) return;
    const property = availableListings.find((item) => item.id === propertyToAdd);
    if (!property || selectedListings.some((item) => item.id === property.id)) return;
    setSelectedListings((current) => [...current, property]);
    setPropertyToAdd("");
    setError("");
  }

  function removeProperty(id: string) {
    if (selectedListings.length === 1) return;
    setSelectedListings((current) => current.filter((item) => item.id !== id));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const proof = form.get("payment_proof");
    const termsAccepted = form.get("terms_accepted") === "on";
    const privacyAccepted = form.get("privacy_accepted") === "on";

    if (!selectedListings.length) {
      setError("Please select at least one property tour.");
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy before submitting.");
      return;
    }

    if (!(proof instanceof File) || proof.size === 0) {
      setError("Please upload your payment proof.");
      return;
    }

    if (proof.size > MAX_PROOF_SIZE) {
      setError("Payment proof must be 5 MB or smaller.");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(proof.type)) {
      setError("Upload a JPG, PNG, WebP image or PDF payment proof.");
      return;
    }

    if (!hasPaymentInstructions()) {
      setError("Payment instructions are not configured yet.");
      return;
    }

    setLoading(true);

    try {
      const listingIds = selectedListings.map((item) => item.id);
      form.set("listing_id", listingIds[0]);
      form.set("listing_ids", JSON.stringify(listingIds));

      const response = await fetch("/api/bookings", {
        method: "POST",
        body: form
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "We could not submit the booking.");
      }

      setReference(result.reference);
      setSubmitted(true);
      formElement.reset();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We could not submit the booking. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="success" role="status" aria-live="polite">
        <div className="eyebrow">Booking received</div>
        <h1>Your request is in.</h1>
        <p className="location">Keep this booking reference for your records:</p>
        <div className="reference-code">{reference}</div>
        <p className="location">
          We will review the payment proof and contact you using the details you provided.
          A booking reference is not a confirmation of the tour.
        </p>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="notice" role="note">
        {selectedListings.length === 1 ? (
          <>Tour fee for this property: <strong>{formatGhs(selectedListings[0].tourFee)}</strong>.</>
        ) : (
          <>You selected <strong>{selectedListings.length} property tours</strong>. The multi-tour discount is applied to the combined tour fees.</>
        )}
        <span className="location" style={{ display: "block", marginTop: 5 }}>
          Payment is currently manual. Payment details are shown only as part of this booking process.
        </span>
      </div>

      {selectedListings.length > 1 ? (
        <div className="tour-selection-box">
          <div className="panel-heading" style={{ marginBottom: 12 }}>
            <div>
              <h2>Selected tours</h2>
              <p className="location">Book several property tours together and pay one discounted tour-fee total.</p>
            </div>
          </div>
          <div className="selected-tour-list">
            {selectedListings.map((item) => (
              <div className="selected-tour" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.location}, {item.city}</span>
                </div>
                <div className="selected-tour-actions">
                  <strong>{formatGhs(item.tourFee)}</strong>
                  <button className="button secondary small" type="button" onClick={() => removeProperty(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {availableListings.length > selectedListings.length ? (
        <div className="tour-add-row">
          <div className="form-group">
            <label htmlFor="add-tour-property">Add another property tour</label>
            <select
              className="field"
              id="add-tour-property"
              value={propertyToAdd}
              onChange={(event) => setPropertyToAdd(event.target.value)}
            >
              <option value="">Select a property</option>
              {availableListings
                .filter((item) => !selectedListings.some((selected) => selected.id === item.id))
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} — {item.location}, {item.city}
                  </option>
                ))}
            </select>
          </div>
          <button className="button secondary" type="button" onClick={addProperty} disabled={!propertyToAdd}>
            Add tour
          </button>
        </div>
      ) : null}

      <div className="tour-total-box">
        <div><span>Number of tours</span><strong>{selectedListings.length}</strong></div>
        <div><span>Regular total</span><strong>{formatGhs(totalBeforeDiscount)}</strong></div>
        <div><span>Multi-tour discount</span><strong>{discountLoading ? "Calculating…" : `${discountRate.toFixed(2)}%`}</strong></div>
        <div className="tour-total-final"><span>Total tour fee</span><strong>{formatGhs(totalTourFee)}</strong></div>
        {savings > 0 ? <p>You save <strong>{formatGhs(savings)}</strong> by booking the tours together.</p> : null}
      </div>

      {!hasPaymentInstructions() ? (
        <div className="notice warning" role="alert" style={{ marginTop: 14 }}>
          Manual payment instructions have not been configured yet. JDFortiHomes must add the real payment details before customers can safely pay.
        </div>
      ) : null}

      <div className="sr-only" aria-hidden="true">
        <label htmlFor="booking-website">Website</label>
        <input id="booking-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="form-grid" style={{ marginTop: 20 }}>
        <div className="form-group">
          <label htmlFor="customer_name">Full name <span aria-hidden="true">*</span></label>
          <input className="field" id="customer_name" name="customer_name" autoComplete="name" maxLength={120} required />
        </div>

        <div className="form-group">
          <label htmlFor="customer_phone">Phone number <span aria-hidden="true">*</span></label>
          <input className="field" id="customer_phone" name="customer_phone" type="tel" autoComplete="tel" maxLength={30} required />
        </div>

        <div className="form-group">
          <label htmlFor="customer_email">Email address <span aria-hidden="true">*</span></label>
          <input className="field" id="customer_email" name="customer_email" type="email" autoComplete="email" maxLength={160} required />
        </div>

        <div className="form-group">
          <label htmlFor="preferred_date">Preferred date <span aria-hidden="true">*</span></label>
          <input className="field" id="preferred_date" name="preferred_date" type="date" required />
        </div>

        <div className="form-group">
          <label htmlFor="preferred_time">Preferred time <span aria-hidden="true">*</span></label>
          <select className="field" id="preferred_time" name="preferred_time" required defaultValue="">
            <option value="" disabled>Select a time</option>
            <option>08:00 - 10:00</option>
            <option>10:00 - 12:00</option>
            <option>12:00 - 14:00</option>
            <option>14:00 - 16:00</option>
            <option>16:00 - 18:00</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="payment_method">Payment method used <span aria-hidden="true">*</span></label>
          <select className="field" id="payment_method" name="payment_method" required defaultValue="">
            <option value="" disabled>Select one</option>
            <option>Mobile Money</option>
            <option>Bank transfer</option>
          </select>
        </div>

        <div className="form-group full">
          <label htmlFor="notes">Additional information <span className="optional">(optional)</span></label>
          <textarea className="field" id="notes" name="notes" maxLength={1000} placeholder="Only include information needed to arrange your tours." />
        </div>

        <div className="form-group full">
          <label htmlFor="payment_proof">Upload payment proof <span aria-hidden="true">*</span></label>
          <input
            className="field"
            id="payment_proof"
            name="payment_proof"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
          />
          <span className="upload-note">One proof can cover the complete multi-tour payment. JPG, PNG, WebP or PDF. Maximum 5 MB.</span>
        </div>
      </div>

      <div className="payment-box">
        <h2>Payment instructions</h2>
        {hasPaymentInstructions() ? (
          <>
            <p className="location" style={{ marginBottom: 14 }}>
              Please pay the <strong>{formatGhs(totalTourFee)}</strong> total shown above. These details are displayed only during the booking process.
            </p>
            {siteConfig.payment.momoNumber ? <div className="payment-line"><span>Mobile Money</span><strong>{siteConfig.payment.momoNetwork || "Mobile Money"}</strong></div> : null}
            {siteConfig.payment.momoNumber ? <div className="payment-line"><span>MoMo number</span><strong>{siteConfig.payment.momoNumber}</strong></div> : null}
            {siteConfig.payment.momoName ? <div className="payment-line"><span>Account name</span><strong>{siteConfig.payment.momoName}</strong></div> : null}
            {siteConfig.payment.bankName ? <div className="payment-line"><span>Bank</span><strong>{siteConfig.payment.bankName}</strong></div> : null}
            {siteConfig.payment.accountNumber ? <div className="payment-line"><span>Bank account</span><strong>{siteConfig.payment.accountNumber}</strong></div> : null}
            {siteConfig.payment.accountName ? <div className="payment-line"><span>Account name</span><strong>{siteConfig.payment.accountName}</strong></div> : null}
          </>
        ) : (
          <p className="location">Payment instructions will appear here after JDFortiHomes configures them.</p>
        )}
      </div>

      <div className="consent-group">
        <label className="checkbox-label">
          <input type="checkbox" name="terms_accepted" required />
          <span>I accept the <Link href="/terms">Terms of Service</Link>.</span>
        </label>
        <label className="checkbox-label">
          <input type="checkbox" name="privacy_accepted" required />
          <span>I have read the <Link href="/privacy">Privacy Policy</Link>.</span>
        </label>
      </div>

      {error ? <div className="notice error" role="alert" style={{ marginTop: 16 }}>{error}</div> : null}

      <button className="button accent" type="submit" disabled={loading || discountLoading} style={{ width: "100%", marginTop: 18 }}>
        {loading ? "Submitting booking…" : selectedListings.length > 1 ? `Submit ${selectedListings.length} tours` : "Submit tour booking"}
      </button>
    </form>
  );
}
