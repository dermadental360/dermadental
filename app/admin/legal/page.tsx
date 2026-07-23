import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllLegalPagesAdmin } from "@/lib/legal";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLegalPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin");
  }

  const pages = await getAllLegalPagesAdmin();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <p className="eyebrow">Content Management</p>
          <h2 style={{ margin: 0 }}>Legal Pages</h2>
        </div>
      </div>

      {pages.length === 0 ? (
        <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📄</p>
          <h3>No legal pages yet</h3>
          <p style={{ color: "var(--muted)" }}>Create your first legal page to get started.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {pages.map((page) => {
            const updatedAt = new Date(page.updatedAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric"
            });
            return (
              <div key={page.id} className="card pad" style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ fontSize: 32 }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 17 }}>{page.title}</h3>
                    <span className={`status-pill ${page.published ? "confirmed" : "new"}`}>
                      {page.published ? "Published" : "Draft"}
                    </span>
                    {page.isDraft && page.published && (
                      <span className="status-pill packed">Has unsaved draft</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--muted)" }}>
                    <span>/{page.slug}</span>
                    <span>·</span>
                    <span>v{page.version}</span>
                    <span>·</span>
                    <span>Last updated: {updatedAt}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  <Link
                    href={`/${page.slug}`}
                    target="_blank"
                    className="btn secondary"
                    style={{ padding: "8px 14px", fontSize: 13 }}
                  >
                    👁 View
                  </Link>
                  <Link
                    href={`/admin/legal/${page.id}`}
                    className="btn"
                    style={{ padding: "8px 16px", fontSize: 13 }}
                  >
                    ✏️ Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card pad" style={{ marginTop: 32, background: "var(--bg-secondary)", border: "1px dashed var(--line)" }}>
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>ℹ️ About Legal Pages</h3>
        <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
          Legal pages (Privacy Policy, Terms &amp; Conditions) are dynamically served from the database.
          All content is admin-controlled — no code changes needed to update legal text.
          Every save creates a revision for rollback.
        </p>
      </div>
    </div>
  );
}
