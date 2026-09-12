import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a property tour | JDFortiHomes",
  robots: {
    index: false,
    follow: false
  }
};

export default function BookingLayout({ children }: { children: ReactNode }) {
  return children;
}
