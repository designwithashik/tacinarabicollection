"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export const runtime = "edge";

type AdminMeResponse = {
  id: number;
  email: string;
  role: string;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        await apiFetch<AdminMeResponse>("/admin/me", { method: "GET" });
        if (mounted) {
          setAuthError(null);
          setCheckingAuth(false);
        }
      } catch (error) {
        if (!mounted) return;
        if (error instanceof Error && error.message === "UNAUTHORIZED") {
          router.push("/admin/login");
          return;
        }
        setAuthError("Unable to validate admin session.");
        setCheckingAuth(false);
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-base text-ink">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-6">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#e6d8ce] border-t-accent" />
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-base text-ink">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="rounded-2xl bg-white p-4 text-sm text-red-600 shadow-soft">
            {authError}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-ink">
      <header className="border-b border-[#e6d8ce] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold text-accent">Admin Only</p>
            <h1 className="font-heading text-lg font-semibold">Tacin Arabi Admin</h1>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs font-semibold">
            <Link className="rounded-full border border-[#e6d8ce] px-3 py-2" href="/admin/dashboard">
              Dashboard
            </Link>
            <Link className="rounded-full border border-[#e6d8ce] px-3 py-2" href="/admin/products">
              Products
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
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
