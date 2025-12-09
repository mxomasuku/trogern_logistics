import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getServerSession();

  if (!admin) {
    redirect("/login");
  }

  // TODO: Implement notification count
  const notificationCount = 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      <Sidebar notificationCount={notificationCount} />
      <div className="pl-64">
        <Header
          adminName={admin.name || "Admin"}
          adminEmail={admin.email}
          adminRole={admin.role}
          notificationCount={notificationCount}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}