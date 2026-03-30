/**
 * Admin edit product page — pre-populated form, image management, inventory controls.
 * Fully implemented in Phase 2.
 */
export default function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
        Edit Product
      </h1>
      <p className="mt-2 text-[var(--color-muted-foreground)]">
        Editing product <code>{params.id}</code> — coming in Phase 2.
      </p>
    </div>
  );
}
