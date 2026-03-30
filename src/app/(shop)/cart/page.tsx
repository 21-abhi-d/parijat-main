/**
 * Cart page — PLACEHOLDER.
 * Route is reserved for the Stripe payment phase.
 * Do not implement until payment phase is scoped.
 */
export default function CartPage() {
  return (
    <main className="px-4 py-8">
      <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
        Cart
      </h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        Online payments are coming soon. Please{" "}
        <a href="/booking" className="text-[var(--color-primary)] underline">
          book a consultation
        </a>{" "}
        to discuss your selection.
      </p>
    </main>
  );
}
