export const siteConfig = {
  name: "JDFortiHomes",
  shortName: "JDFortiHomes",
  description:
    "Accommodation discovery and property-tour booking for people looking for places to rent in Ghana.",
  country: "Ghana",
  email: "jdfortihomes@gmail.com",
  tourFeeGhs: Number(process.env.NEXT_PUBLIC_TOUR_FEE_GHS || 50),
  payment: {
    momoNetwork: process.env.NEXT_PUBLIC_PAYMENT_MOMO_NETWORK || "",
    momoName: process.env.NEXT_PUBLIC_PAYMENT_MOMO_NAME || "",
    momoNumber: process.env.NEXT_PUBLIC_PAYMENT_MOMO_NUMBER || "",
    bankName: process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME || "",
    accountName: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME || "",
    accountNumber: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER || ""
  }
};

export function hasPaymentInstructions() {
  return Boolean(
    siteConfig.payment.momoNumber ||
      siteConfig.payment.accountNumber
  );
}
