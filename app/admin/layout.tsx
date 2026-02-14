import AdminFrame from "@/components/admin/AdminFrame";
import AuthGuard from "@/components/admin/AuthGuard";
import { AuthProvider } from "@/context/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AuthGuard>
        <AdminFrame>{children}</AdminFrame>
      </AuthGuard>
    </AuthProvider>
  );
}
