import { AdminLogin } from "@/components/AdminLogin";
import { AdminReviews } from "@/components/AdminReviews";
import { isAdmin } from "@/lib/auth";

export default async function AdminReviewsPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1>Reviews Moderation</h1>
      <AdminReviews />
    </>
  );
}
