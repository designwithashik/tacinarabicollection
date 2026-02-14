"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthGuard from "../../components/admin/AuthGuard";
import { useAuth, AuthProvider } from "../../context/AuthContext";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
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
              <Link className="rounded-full border border-[#e6d8ce] px-3 py-2" href="/admin/dashboard">
                Dashboard
              </Link>
              <Link className="rounded-full border border-[#e6d8ce] px-3 py-2" href="/admin/inventory">
                Inventory
              </Link>
              <Link className="rounded-full border border-[#e6d8ce] px-3 py-2" href="/admin/orders">
                Orders
              </Link>
              <Link className="rounded-full border border-[#e6d8ce] px-3 py-2" href="/admin/analytics">
                Analytics
              </Link>
              <Link className="rounded-full border border-[#e6d8ce] px-3 py-2" href="/admin/settings">
                Settings
              </Link>
            </nav>
            {user ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full border border-[#e6d8ce] px-3 py-2 text-xs font-semibold"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </AuthGuard>
    </AuthProvider>
  );
}
