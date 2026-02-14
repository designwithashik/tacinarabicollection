"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-base text-ink">
      <header className="border-b border-[#e6d8ce] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold text-accent">Admin Only</p>
            <h1 className="font-heading text-lg font-semibold">Tacin Arabi Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex flex-wrap gap-2 text-xs font-semibold">
              <a className="rounded-full border border-[#e6d8ce] px-3 py-2" href="/admin/dashboard">
                Dashboard
              </a>
              <a className="rounded-full border border-[#e6d8ce] px-3 py-2" href="/admin/inventory">
                Inventory
              </a>
              <a className="rounded-full border border-[#e6d8ce] px-3 py-2" href="/admin/orders">
                Orders
              </a>
              <a className="rounded-full border border-[#e6d8ce] px-3 py-2" href="/admin/analytics">
                Analytics
              </a>
              <a className="rounded-full border border-[#e6d8ce] px-3 py-2" href="/admin/settings">
                Settings
              </a>
            </nav>
            {user && (
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-[#e6d8ce] px-3 py-2 text-xs font-semibold"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
