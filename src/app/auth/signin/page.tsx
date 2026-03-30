/**
 * Sign-in page — magic link for customers, credentials for admin.
 * Fully implemented in Phase 3.
 */
export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-secondary)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-[var(--color-foreground)]">
          Sign In
        </h1>
        <p className="text-[var(--color-muted-foreground)]">
          Sign-in form (magic link + admin credentials) — coming in Phase 3.
        </p>
      </div>
    </main>
  );
}
