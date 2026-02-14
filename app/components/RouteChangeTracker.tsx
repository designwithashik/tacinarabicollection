"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "../../lib/tracking";

export default function RouteChangeTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    trackPageView(pathname, new URLSearchParams(searchParams?.toString()));
  }, [pathname, searchParams]);

  return null;
}
