// app/admin/layout.tsx
import { AdminAuthProvider } from "@/lib/admin-auth-provider";
import { getServerAdminUser, serializeAdminUser } from "@/lib/get-server-admin-user";
import { redirect } from "next/navigation";
import { AdminLayoutWrapper } from "@/components/layout/admin-layer-wrapper"

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin Layout
 *
 * This layout:
 * 1. Checks authentication server-side (fast, secure)
 * 2. Serializes AdminUser for client-side hydration
 * 3. Wraps children with AdminAuthProvider for client-side state
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  // Server-side auth check - returns domain-compatible AdminUser
  const adminUser = await getServerAdminUser();

  if (!adminUser) {
    redirect("/login");
  }

  if (!adminUser.isActive) {
    redirect("/account-deactivated");
  }

  // Serialize for client-side - converts Firestore Timestamps to plain objects
  const serializedAdminUser = serializeAdminUser(adminUser);

  return (
    <AdminAuthProvider initialAdminUser={serializedAdminUser}>
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
    </AdminAuthProvider>
  );
}