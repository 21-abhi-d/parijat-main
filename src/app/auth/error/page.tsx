/**
 * Auth error page — shown by NextAuth when sign-in fails.
 */
export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error ?? "Unknown error";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-secondary)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-[var(--color-destructive)]">
          Sign-in Error
        </h1>
        <p className="text-[var(--color-muted-foreground)]">
          {error === "CredentialsSignin"
            ? "Invalid email or password."
            : `Something went wrong: ${error}`}
        </p>
        <a
          href="/auth/signin"
          className="mt-4 block text-[var(--color-primary)] underline"
        >
          Try again
        </a>
      </div>
    </main>
  );
}
