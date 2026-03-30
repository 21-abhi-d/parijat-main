/**
 * Product detail page.
 * Fully implemented in Phase 2.
 */
export default function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <main className="px-4 py-8">
      <p className="text-[var(--color-muted-foreground)]">
        Product detail for <code>{params.slug}</code> — coming in Phase 2.
      </p>
    </main>
  );
}
