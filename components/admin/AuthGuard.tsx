"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (!loading && !user && !isLoginRoute) {
      router.replace("/admin/login");
    }
  }, [isLoginRoute, loading, router, user]);

  if (loading && !isLoginRoute) {
    return <p className="px-4 py-8 text-sm text-[#6f4f43]">Loading...</p>;
  }

  if (!user && !isLoginRoute) {
    return null;
  }

  return <>{children}</>;
}
