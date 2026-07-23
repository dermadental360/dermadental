import { requireAdmin } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getLegalPageById } from "@/lib/legal";
import AdminLegalEditor from "@/components/AdminLegalEditor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminLegalEditorPage({ params }: Props) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin");
  }

  const { id } = await params;
  const page = await getLegalPageById(id);
  if (!page) return notFound();

  return <AdminLegalEditor page={page} />;
}
