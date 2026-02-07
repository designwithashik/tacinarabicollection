"use client";

import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    description: "Live overview & health.",
  },
  {
    href: "/admin/inventory",
    label: "Inventory",
    description: "Add, edit, and hide products.",
  },
  {
    href: "/admin/orders",
    label: "Orders",
    description: "Review incoming requests.",
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    description: "Monitor performance trends.",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    description: "Manage integrations.",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-base text-ink">
      <header className="border-b border-[#e6d8ce] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold text-accent">Admin Only</p>
            <h1 className="font-heading text-lg font-semibold">
              Tacin Arabi Admin
            </h1>
            <p className="text-xs text-muted">
              All changes update the live storefront instantly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <a
              className="rounded-full border border-[#e6d8ce] bg-white px-3 py-2 text-ink"
              href="/"
              target="_blank"
              rel="noreferrer"
            >
              Open Storefront
            </a>
            <span className="rounded-full bg-base px-3 py-2 text-ink">
              Need help? WhatsApp the team
            </span>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="w-full rounded-3xl bg-white p-4 shadow-soft lg:max-w-xs">
          <p className="text-xs font-semibold text-muted">Navigation</p>
          <nav className="mt-3 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? "border-accent bg-[#fff7f3] text-accent"
                      : "border-[#f0e4da] text-ink hover:border-accent/50"
                  }`}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.description}
                  </p>
                </a>
              );
            })}
          </nav>
          <div className="mt-6 rounded-2xl border border-[#f0e4da] bg-base p-4 text-xs text-muted">
            <p className="font-semibold text-ink">Quick tips</p>
            <ul className="mt-2 space-y-2">
              <li>Use Inventory to add or hide products quickly.</li>
              <li>Orders sync to WhatsApp confirmations.</li>
              <li>Analytics updates every 15 minutes.</li>
            </ul>
          </div>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
