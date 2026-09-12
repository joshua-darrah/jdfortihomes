"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { hasPaymentInstructions, siteConfig } from "@/lib/site-config";
import type { Listing } from "@/lib/types";

const MAX_PROOF_SIZE = 5 * 1024 * 1024;

export function BookingForm({ listing }: { listing: Listing }) {
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const proof = form.get("payment_proof");
    const termsAccepted = form.get("terms_accepted") === "on";
    const privacyAccepted = form.get("privacy_accepted") === "on";

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
      form.set("listing_id", listing.id);

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
        <p className="location">
          Keep this booking reference for your records:
        </p>
        <div className="reference-code">{reference}</div>
        <p className="location">
          We will review the payment proof and contact you using the details you
          provided. A booking reference is not a confirmation of the tour.
        </p>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} noValidate>
      <div className="notice" role="note">
        Tour fee: <strong>{siteConfig.tourFeeGhs} GHS</strong>. Payment is currently
        manual. The payment proof is used only to review the tour-fee payment.
      </div>

      {!hasPaymentInstructions() ? (
        <div className="notice warning" role="alert" style={{ marginTop: 14 }}>
          Manual payment instructions have not been configured yet. The site owner
          must add the real payment details before customers can safely pay.
        </div>
      ) : null}

      <div className="sr-only" aria-hidden="true"><label htmlFor="booking-website">Website</label><input id="booking-website" name="website" tabIndex={-1} autoComplete="off" /></div>

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
          <textarea className="field" id="notes" name="notes" maxLength={1000} placeholder="Only include information needed to arrange your tour." />
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
          <span className="upload-note">JPG, PNG, WebP or PDF. Maximum 5 MB. Please hide unrelated account information.</span>
        </div>
      </div>

      <div className="payment-box">
        <h2>Payment instructions</h2>
        {hasPaymentInstructions() ? (
          <>
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
          <span>I agree to the <Link href="/terms" target="_blank" rel="noreferrer">Terms of Service</Link>.</span>
        </label>
        <label className="checkbox-label">
          <input type="checkbox" name="privacy_accepted" required />
          <span>I have read the <Link href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link> and understand how my booking information will be used.</span>
        </label>
      </div>

      {error ? (
        <div className="notice error" role="alert" aria-live="assertive">
          {error}
        </div>
      ) : null}

      <button className="button accent" type="submit" disabled={loading || !hasPaymentInstructions()} style={{ width: "100%" }}>
        {loading ? "Submitting booking..." : "Submit tour request"}
      </button>
    </form>
  );
}
