import { AdminLogin } from "@/components/AdminLogin";
import { AdminInquiries } from "@/components/AdminInquiries";
import { isAdmin } from "@/lib/auth";

export default async function AdminInquiriesPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  return (
    <div className="page-enter">
      <p className="eyebrow">Admin Portal</p>
      <h1>Patient Inquiries</h1>
      <AdminInquiries />
    </div>
  );
}
