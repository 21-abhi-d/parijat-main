import Link from "next/link";

/**
 * Home / Landing page — placeholder until Phase 2 design is implemented.
 * Route: /
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-secondary)] px-4">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-bold text-[var(--color-primary)]">
          Parijat
        </h1>
        <p className="mb-2 text-xl text-[var(--color-foreground)]">
          Exquisite Indian Traditional Wear
        </p>
        <p className="mb-8 text-[var(--color-muted-foreground)]">
          Sarees · Suits · Lehengas · Dupattas
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/catalog"
            className="rounded-lg bg-[var(--color-primary)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            Browse Collection
          </Link>
          <Link
            href="/booking"
            className="rounded-lg border border-[var(--color-primary)] px-6 py-3 font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-secondary)]"
          >
            Book a Consultation
          </Link>
        </div>
      </div>
    </main>
  );
}
