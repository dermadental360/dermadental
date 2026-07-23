"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { LegalPage } from "@/lib/legal";

interface Revision {
  id: string;
  title: string;
  version: number;
  savedAt: string;
}

interface Props {
  page: LegalPage;
}

export default function AdminLegalEditor({ page }: Props) {
  const [activeTab, setActiveTab] = useState<"editor" | "seo" | "revisions">("editor");
  const [title, setTitle] = useState(page.title);
  const [seoTitle, setSeoTitle] = useState(page.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(page.seoDescription || "");
  const [keywords, setKeywords] = useState(page.keywords || "");
  const [ogTitle, setOgTitle] = useState(page.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(page.ogDescription || "");
  const [ogImage, setOgImage] = useState(page.ogImage || "");
  const [canonical, setCanonical] = useState(page.canonical || "");
  const [published, setPublished] = useState(page.published);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveMsgType, setSaveMsgType] = useState<"success" | "error">("success");
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [revisionsLoaded, setRevisionsLoaded] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const lastSavedHtml = useRef(page.content);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = page.content;
      updateCounts(page.content);
    }
  }, []);

  // Dirty tracking + auto-save
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const updateCounts = (html: string) => {
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const words = text.split(" ").filter(Boolean);
    setWordCount(words.length);
    setCharCount(text.length);
  };

  const getEditorHtml = () => editorRef.current?.innerHTML || "";

  const handleEditorInput = useCallback(() => {
    setIsDirty(true);
    updateCounts(getEditorHtml());

    // Reset auto-save countdown
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    setAutoSaveCountdown(30);
    const timer = setTimeout(() => {
      handleSaveDraft(true);
    }, 30000);
    setAutoSaveTimer(timer);
  }, [autoSaveTimer]);

  // Countdown tick
  useEffect(() => {
    if (autoSaveCountdown === null || autoSaveCountdown <= 0) return;
    const tick = setTimeout(() => setAutoSaveCountdown(c => c !== null ? c - 1 : null), 1000);
    return () => clearTimeout(tick);
  }, [autoSaveCountdown]);

  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorInput();
  };

  const handleInsertLink = () => {
    const url = prompt("Enter URL:", "https://");
    if (url) execCmd("createLink", url);
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setSaveMsg(msg);
    setSaveMsgType(type);
    setTimeout(() => setSaveMsg(""), 4000);
  };

  const handleSaveDraft = async (isAuto = false) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/legal/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: getEditorHtml(),
          seoTitle,
          seoDescription,
          keywords,
          ogTitle,
          ogDescription,
          ogImage,
          canonical,
          isDraft: true,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      lastSavedHtml.current = getEditorHtml();
      setIsDirty(false);
      setAutoSaveCountdown(null);
      showToast(isAuto ? "✅ Auto-saved" : "✅ Draft saved");
    } catch {
      showToast("❌ Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // First save current content
      const saveRes = await fetch(`/api/admin/legal/${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: getEditorHtml(),
          seoTitle,
          seoDescription,
          keywords,
          ogTitle,
          ogDescription,
          ogImage,
          canonical,
          isDraft: false,
        }),
      });
      if (!saveRes.ok) throw new Error("Save failed");

      // Then toggle publish
      const pubRes = await fetch(`/api/admin/legal/${page.id}/publish`, { method: "POST" });
      if (!pubRes.ok) throw new Error("Publish failed");
      const { published: newPublished } = await pubRes.json();
      setPublished(newPublished);
      setIsDirty(false);
      showToast(newPublished ? "🚀 Published!" : "📝 Unpublished (draft)");
    } catch {
      showToast("❌ Publish failed", "error");
    } finally {
      setPublishing(false);
    }
  };

  const loadRevisions = async () => {
    if (revisionsLoaded) return;
    try {
      const res = await fetch(`/api/admin/legal/${page.id}/revisions`);
      const data = await res.json();
      setRevisions(data.revisions || []);
      setRevisionsLoaded(true);
    } catch {
      showToast("❌ Failed to load revisions", "error");
    }
  };

  const handleTabChange = (tab: "editor" | "seo" | "revisions") => {
    setActiveTab(tab);
    if (tab === "revisions") loadRevisions();
  };

  const handleRestore = async (revisionId: string) => {
    if (!confirm("Restore this revision? Current content will be saved as a draft.")) return;
    setRestoringId(revisionId);
    try {
      const res = await fetch(`/api/admin/legal/${page.id}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId }),
      });
      if (!res.ok) throw new Error("Restore failed");
      showToast("✅ Revision restored — refresh to see changes");
      setRevisionsLoaded(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      showToast("❌ Restore failed", "error");
    } finally {
      setRestoringId(null);
    }
  };

  const previewHtml = getEditorHtml();
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div>
      {/* Toast */}
      {saveMsg && (
        <div
          style={{
            position: "fixed", top: 24, right: 24, zIndex: 9999,
            background: saveMsgType === "success" ? "var(--ink)" : "var(--error)",
            color: "#fff", padding: "14px 24px", borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)", fontSize: 14, fontWeight: 600,
            animation: "slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)",
            borderLeft: `4px solid ${saveMsgType === "success" ? "var(--sage)" : "#ff6b6b"}`,
            minWidth: 240,
          }}
        >
          {saveMsg}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
            display: "flex", flexDirection: "column",
          }}
          onClick={() => setShowPreview(false)}
        >
          <div
            style={{ flex: 1, overflow: "auto", padding: 40 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ maxWidth: 860, margin: "0 auto", background: "#fff", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ background: "var(--primary)", color: "#fff", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700 }}>👁 Preview: {title}</span>
                <button onClick={() => setShowPreview(false)} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontWeight: 600 }}>✕ Close</button>
              </div>
              <div style={{ padding: "40px 48px" }}>
                <h1 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 36, marginBottom: 8 }}>{title}</h1>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid var(--line)" }}>
                  ⏱ {readingTime} min read
                </div>
                <div className="legal-content" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <Link href="/admin/legal" style={{ fontSize: 13, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            ← All Legal Pages
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
            <span className={`status-pill ${published ? "confirmed" : "new"}`}>
              {published ? "Published" : "Draft"}
            </span>
            {isDirty && (
              <span style={{ fontSize: 12, color: "var(--warning)", fontWeight: 600 }}>
                ● Unsaved
                {autoSaveCountdown !== null && autoSaveCountdown > 0 && ` (auto-save in ${autoSaveCountdown}s)`}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            /{page.slug} · v{page.version} · {wordCount} words · {readingTime} min read
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
          <button
            onClick={() => setShowPreview(true)}
            className="btn secondary"
            style={{ padding: "10px 16px", fontSize: 13 }}
          >
            👁 Preview
          </button>
          <button
            onClick={() => handleSaveDraft(false)}
            disabled={saving}
            className="btn secondary"
            style={{ padding: "10px 16px", fontSize: 13 }}
          >
            {saving ? "Saving…" : "💾 Save Draft"}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="btn"
            style={{ padding: "10px 16px", fontSize: 13, background: published ? "var(--muted)" : "var(--sage-dark)" }}
          >
            {publishing ? "…" : published ? "⬇️ Unpublish" : "🚀 Publish"}
          </button>
        </div>
      </div>

      {/* Title field */}
      <div className="field" style={{ marginBottom: 20 }}>
        <label className="field label" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 6, display: "block" }}>Page Title</label>
        <input
          id="legal-title"
          className="input"
          value={title}
          onChange={e => { setTitle(e.target.value); setIsDirty(true); }}
          style={{ fontSize: 17, fontWeight: 600 }}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid var(--line)", marginBottom: 24 }}>
        {(["editor", "seo", "revisions"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? "var(--primary)" : "var(--muted)",
              borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
              marginBottom: -2, fontSize: 14, transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            {tab === "editor" ? "✏️ Editor" : tab === "seo" ? "🔍 SEO" : "🕐 Revisions"}
          </button>
        ))}
      </div>

      {/* EDITOR TAB */}
      {activeTab === "editor" && (
        <div className="card" style={{ overflow: "visible" }}>
          {/* Toolbar */}
          <div className="legal-editor-toolbar">
            <div className="legal-toolbar-group">
              <select
                onChange={e => { execCmd("formatBlock", e.target.value); e.target.value = ""; }}
                className="legal-toolbar-select"
                defaultValue=""
                title="Heading"
              >
                <option value="" disabled>Heading</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
                <option value="h4">Heading 4</option>
                <option value="p">Paragraph</option>
              </select>
            </div>
            <div className="legal-toolbar-sep" />
            <div className="legal-toolbar-group">
              <button onClick={() => execCmd("bold")} className="legal-toolbar-btn" title="Bold"><strong>B</strong></button>
              <button onClick={() => execCmd("italic")} className="legal-toolbar-btn" title="Italic"><em>I</em></button>
              <button onClick={() => execCmd("underline")} className="legal-toolbar-btn" title="Underline"><u>U</u></button>
              <button onClick={() => execCmd("strikeThrough")} className="legal-toolbar-btn" title="Strikethrough"><s>S</s></button>
            </div>
            <div className="legal-toolbar-sep" />
            <div className="legal-toolbar-group">
              <button onClick={() => execCmd("insertUnorderedList")} className="legal-toolbar-btn" title="Bullet list">≡</button>
              <button onClick={() => execCmd("insertOrderedList")} className="legal-toolbar-btn" title="Numbered list">1.</button>
              <button onClick={() => execCmd("formatBlock", "blockquote")} className="legal-toolbar-btn" title="Blockquote">❝</button>
            </div>
            <div className="legal-toolbar-sep" />
            <div className="legal-toolbar-group">
              <button onClick={() => execCmd("justifyLeft")} className="legal-toolbar-btn" title="Align left">⬅</button>
              <button onClick={() => execCmd("justifyCenter")} className="legal-toolbar-btn" title="Align center">↔</button>
              <button onClick={() => execCmd("justifyRight")} className="legal-toolbar-btn" title="Align right">➡</button>
            </div>
            <div className="legal-toolbar-sep" />
            <div className="legal-toolbar-group">
              <button onClick={handleInsertLink} className="legal-toolbar-btn" title="Insert link">🔗</button>
              <button onClick={() => execCmd("insertHorizontalRule")} className="legal-toolbar-btn" title="Horizontal rule">—</button>
              <button onClick={() => execCmd("removeFormat")} className="legal-toolbar-btn" title="Clear formatting">✕</button>
            </div>
            <div className="legal-toolbar-sep" />
            <div className="legal-toolbar-group">
              <button onClick={() => execCmd("undo")} className="legal-toolbar-btn" title="Undo">↩</button>
              <button onClick={() => execCmd("redo")} className="legal-toolbar-btn" title="Redo">↪</button>
            </div>
          </div>

          {/* Editor Area */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            className="legal-editor-area"
            id="legal-editor-area"
          />

          {/* Word count bar */}
          <div style={{ padding: "10px 20px", borderTop: "1px solid var(--line)", display: "flex", gap: 16, fontSize: 12, color: "var(--muted)", background: "var(--bg-secondary)" }}>
            <span>{wordCount} words</span>
            <span>·</span>
            <span>{charCount} characters</span>
            <span>·</span>
            <span>~{readingTime} min read</span>
          </div>
        </div>
      )}

      {/* SEO TAB */}
      {activeTab === "seo" && (
        <div className="card pad">
          <h3 style={{ marginBottom: 20 }}>Search Engine Optimization</h3>
          <div className="form">
            <div className="field">
              <label className="field label" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                SEO Title <span style={{ color: "var(--muted)", fontWeight: 400 }}>({seoTitle.length}/60 chars)</span>
              </label>
              <input id="seo-title" className="input" value={seoTitle} onChange={e => { setSeoTitle(e.target.value); setIsDirty(true); }} placeholder="e.g. Privacy Policy — DermaDental360" maxLength={60} />
            </div>
            <div className="field">
              <label className="field label" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
                Meta Description <span style={{ color: "var(--muted)", fontWeight: 400 }}>({seoDescription.length}/160 chars)</span>
              </label>
              <textarea id="seo-desc" className="input" value={seoDescription} onChange={e => { setSeoDescription(e.target.value); setIsDirty(true); }} placeholder="Describe this page for search engines..." rows={3} maxLength={160} style={{ resize: "vertical" }} />
            </div>
            <div className="field">
              <label className="field label" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Keywords <span style={{ color: "var(--muted)", fontWeight: 400 }}>(comma separated)</span></label>
              <input id="seo-keywords" className="input" value={keywords} onChange={e => { setKeywords(e.target.value); setIsDirty(true); }} placeholder="privacy, data protection, DermaDental360" />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "8px 0" }} />
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Open Graph (Social)</h3>

            <div className="field">
              <label className="field label" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>OG Title</label>
              <input id="og-title" className="input" value={ogTitle} onChange={e => { setOgTitle(e.target.value); setIsDirty(true); }} placeholder="Defaults to SEO title if empty" />
            </div>
            <div className="field">
              <label className="field label" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>OG Description</label>
              <textarea id="og-desc" className="input" value={ogDescription} onChange={e => { setOgDescription(e.target.value); setIsDirty(true); }} rows={2} placeholder="Social media share description" style={{ resize: "vertical" }} />
            </div>
            <div className="field">
              <label className="field label" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>OG Image URL</label>
              <input id="og-image" className="input" value={ogImage} onChange={e => { setOgImage(e.target.value); setIsDirty(true); }} placeholder="https://..." />
            </div>
            <div className="field">
              <label className="field label" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Canonical URL</label>
              <input id="og-canonical" className="input" value={canonical} onChange={e => { setCanonical(e.target.value); setIsDirty(true); }} placeholder="https://www.dd360health.com/privacy-policy" />
            </div>

            {/* SERP Preview */}
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--line)", borderRadius: "var(--radius-md)", padding: 20, marginTop: 8 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Google SERP Preview</div>
              <div style={{ fontSize: 20, color: "#1a0dab", fontWeight: 400, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {seoTitle || title || "Page Title"}
              </div>
              <div style={{ fontSize: 14, color: "#006621", marginBottom: 4 }}>
                dd360health.com › {page.slug}
              </div>
              <div style={{ fontSize: 14, color: "#545454", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
                {seoDescription || "No description provided."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVISIONS TAB */}
      {activeTab === "revisions" && (
        <div className="card pad">
          <h3 style={{ marginBottom: 20 }}>Revision History</h3>
          {revisions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🕐</div>
              <p>No revisions yet. Every save creates a revision.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {revisions.map((rev) => (
                <div key={rev.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", background: "var(--bg-secondary)" }}>
                  <div style={{ fontSize: 24 }}>📄</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{rev.title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                      Version {rev.version} · Saved {new Date(rev.savedAt).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(rev.id)}
                    disabled={restoringId === rev.id}
                    className="btn secondary"
                    style={{ fontSize: 12, padding: "6px 14px" }}
                  >
                    {restoringId === rev.id ? "Restoring…" : "↩ Restore"}
                  </button>
                </div>
              ))}
            </div>
          )}
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16 }}>
            Revisions are saved automatically on every manual save. Up to 30 revisions are stored.
          </p>
        </div>
      )}
    </div>
  );
}
