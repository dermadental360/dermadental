import { AdminLogin } from "@/components/AdminLogin";
import { AdminHeroSlides } from "@/components/AdminHeroSlides";
import { isAdmin } from "@/lib/auth";

export default async function AdminHeroSlidesPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  return (
    <>
      <p className="eyebrow">Admin</p>
      <h1>Hero Slider Manager</h1>
      <AdminHeroSlides />
    </>
  );
}
