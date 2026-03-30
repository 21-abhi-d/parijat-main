import { redirect } from "next/navigation";

import { auth } from "~/server/auth";

/**
 * Admin layout — enforces role: 'admin' at the layout level.
 * Middleware provides the first layer of protection; this is the second.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  const user = (session?.user ?? null) as (NonNullable<typeof session>["user"] & { role?: string }) | null;
  if (!user || user.role !== "admin") {
    redirect("/auth/signin");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar placeholder — replaced with AdminSidebar component in Phase 4 */}
      <aside className="w-64 border-r border-[var(--color-border)] bg-[var(--color-muted)] p-4">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          Parijat Admin
        </h2>
        <nav className="space-y-1">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/products", label: "Products" },
            { href: "/admin/inventory", label: "Inventory" },
            { href: "/admin/bookings", label: "Bookings" },
            { href: "/admin/customers", label: "Customers" },
            { href: "/admin/notifications", label: "Notifications" },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="block rounded-md px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-border)]"
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
