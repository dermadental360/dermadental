import { AdminLogin } from "@/components/AdminLogin";
import { AdminThemeManager } from "@/components/AdminThemeManager";
import { isAdmin } from "@/lib/auth";

export default async function AdminThemePage() {
  if (!(await isAdmin())) return <AdminLogin />;
  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1>Website Theme Manager</h1>
      <AdminThemeManager />
    </>
  );
}
