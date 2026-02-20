export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navLinkClass =
    "rounded-full border border-black px-4 py-2 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95";

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Admin Panel
              </p>
              <h1 className="font-heading text-xl font-semibold">
                Tacin Arabi Admin
              </h1>
            </div>
            <nav className="flex flex-wrap gap-2">
              <a className={navLinkClass} href="/admin/dashboard">
                Dashboard
              </a>
              <a className={navLinkClass} href="/admin/inventory">
                Inventory
              </a>
              <a className={navLinkClass} href="/admin/orders">
                Orders
              </a>
              <a className={navLinkClass} href="/admin/analytics">
                Analytics
              </a>
              <a className={navLinkClass} href="/admin/content">
                Content
              </a>
              <a className={navLinkClass} href="/admin/settings">
                Settings
              </a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
