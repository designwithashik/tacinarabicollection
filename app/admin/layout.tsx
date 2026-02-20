export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const links = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/inventory", label: "Inventory" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/content", label: "Content" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 text-ink">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Admin only</p>
              <h1 className="font-heading text-2xl font-semibold">Tacin Arabi Admin</h1>
            </div>
            <nav className="flex flex-wrap gap-2 text-sm font-semibold">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-black px-4 py-2 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
