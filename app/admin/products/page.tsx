import { AdminLogin } from "@/components/AdminLogin";
import { AdminProducts } from "@/components/AdminProducts";
import { isAdmin } from "@/lib/auth";

export default async function AdminProductsPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  return <><p className="eyebrow">Admin</p><h1>Products</h1><AdminProducts /></>;
}
