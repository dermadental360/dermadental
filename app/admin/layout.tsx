import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/AdminLogin";
import { AdminDashboardLayout } from "@/components/AdminDashboardLayout";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isAdmin();

  if (!authenticated) {
    return <AdminLogin />;
  }

  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}
