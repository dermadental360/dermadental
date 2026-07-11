import { AdminLogin } from "@/components/AdminLogin";
import { AdminChangePassword } from "@/components/AdminChangePassword";
import { isAdmin } from "@/lib/auth";

export default async function ChangePasswordPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1>Change Password</h1>
      <AdminChangePassword />
    </>
  );
}
