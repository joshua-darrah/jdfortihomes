import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Agent Dashboard",
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

export default function AgentLayout({ children }: { children: ReactNode }) {
  return children;
}
