import { AdminLogin } from "@/components/AdminLogin";
import { AdminDashboard } from "@/components/AdminDashboard";
import { isAdmin } from "@/lib/auth";

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  return <AdminDashboard />;
}
