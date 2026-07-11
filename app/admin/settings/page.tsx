import { AdminLogin } from "@/components/AdminLogin";
import { AdminSettings } from "@/components/AdminSettings";
import { isAdmin } from "@/lib/auth";

export default async function AdminSettingsPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1>Site Settings</h1>
      <AdminSettings />
    </>
  );
}
