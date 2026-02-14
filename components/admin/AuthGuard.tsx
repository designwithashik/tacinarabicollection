"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [loading, pathname, router, user]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted">
        Checking access...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted">
        Redirecting to login...
      </div>
    );
  }

  return <>{children}</>;
}
