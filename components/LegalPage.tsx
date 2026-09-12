import type { ReactNode } from "react";

export function LegalPage({
  eyebrow,
  title,
  intro,
  children
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="legal-page">
      <div className="container legal-wrap">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="legal-intro">{intro}</p>
        <div className="legal-content">{children}</div>
      </div>
    </main>
  );
}
