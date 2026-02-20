export const dynamic = "force-dynamic";
export const revalidate = 0;

import dynamicImport from "next/dynamic";

const ContentClient = dynamicImport(() => import("./ContentClient"), {
  ssr: false,
  loading: () => <p className="text-sm text-muted">Loading content editor…</p>,
});

export default function AdminContentPage() {
  return <ContentClient />;
}
