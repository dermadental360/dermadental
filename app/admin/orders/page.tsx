import { AdminLogin } from "@/components/AdminLogin";
import { AdminOrders } from "@/components/AdminOrders";
import { isAdmin } from "@/lib/auth";

export default async function AdminOrdersPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  return (
    <div>
      <p className="eyebrow">Admin</p>
      <h1>Orders</h1>
      <AdminOrders />
    </div>
  );
}

