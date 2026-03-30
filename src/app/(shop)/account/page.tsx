/**
 * Customer account / profile page.
 * Shows notification preferences and booking history.
 * Auth-guarded via middleware.
 * Fully implemented in Phase 3.
 */
export default function AccountPage() {
  return (
    <main className="px-4 py-8">
      <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
        My Account
      </h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        Customer profile — coming in Phase 3.
      </p>
    </main>
  );
}
