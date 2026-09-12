import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="brand-logo" aria-label="JDFortiHomes home">
          <img
            src="/jdfortihomes-logo.svg"
            alt="JDFortiHomes"
            width={260}
            height={48}
          />
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          <Link href="/find-a-place">Find a place</Link>
          <Link href="/#recommendations">Recommended</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
