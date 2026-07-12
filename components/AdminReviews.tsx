"use client";

import { useState, useEffect, useRef } from "react";
import { compressImage } from "@/lib/imageCompressor";

interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  userName: string;
  userEmail: string | null;
  userAvatar: string | null;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
}

export function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<AdminReview | null>(null);
  
  // Form Fields State
  const [formProductId, setFormProductId] = useState("");
  const [formUserName, setFormUserName] = useState("");
  const [formUserEmail, setFormUserEmail] = useState("");
  const [formUserAvatar, setFormUserAvatar] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [formApproved, setFormApproved] = useState(true);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReviews();
    fetchProducts();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/reviews");
      if (!res.ok) throw new Error("Failed to load reviews");
      const data = await res.json();
      setReviews(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      // Format backend products to standard list
      setProducts(data.map((p: any) => ({
        id: p._id || p.id,
        name: p.name,
        brand: p.brand
      })));
    } catch (err: any) {
      console.error("Failed to load products list:", err);
    }
  };

  const handleSeedReviews = async () => {
    if (!confirm("Are you sure you want to seed fake reviews? This will delete all existing reviews and seed new ones.")) return;
    try {
      setSeeding(true);
      setError("");
      const res = await fetch("/api/admin/seed-reviews", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to seed reviews");
      alert(data.message || "Successfully seeded reviews");
      fetchReviews();
    } catch (err: any) {
      setError(err.message || "An error occurred while seeding reviews");
    } finally {
      setSeeding(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingReview(null);
    setFormProductId(products[0]?.id || "");
    setFormUserName("");
    setFormUserEmail("");
    setFormUserAvatar("");
    setFormRating(5);
    setFormComment("");
    setFormApproved(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (review: AdminReview) => {
    setEditingReview(review);
    setFormProductId(review.productId);
    setFormUserName(review.userName);
    setFormUserEmail(review.userEmail || "");
    setFormUserAvatar(review.userAvatar || "");
    setFormRating(review.rating);
    setFormComment(review.comment);
    setFormApproved(review.approved);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const compressedFile = await compressImage(file, 400, 400, 0.75); // Avatars can be smaller, e.g. 400x400
      const formData = new FormData();
      formData.append("file", compressedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload avatar");

      setFormUserAvatar(data.url);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId || !formUserName || !formComment) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      const payload = {
        productId: formProductId,
        userName: formUserName,
        userEmail: formUserEmail || null,
        userAvatar: formUserAvatar || null,
        rating: Number(formRating),
        comment: formComment,
        approved: formApproved,
      };

      const isEdit = !!editingReview;
      const url = "/api/admin/reviews";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit ? { ...payload, id: editingReview.id } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save review");

      setIsModalOpen(false);
      fetchReviews();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleToggleApprove = async (id: string, currentlyApproved: boolean) => {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approved: !currentlyApproved }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update review status");
      }

      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, approved: !currentlyApproved } : r))
      );
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review permanently?")) return;

    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete review");
      }

      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  };

  const renderStars = (count: number) => {
    return (
      <div style={{ display: "flex", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={count >= star ? "var(--gold, #c5a880)" : "none"}
            stroke="var(--gold, #c5a880)"
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    );
  };

  const filteredReviews = reviews
    .filter((r) => {
      if (filter === "pending") return !r.approved;
      if (filter === "approved") return r.approved;
      return true;
    })
    .filter((r) => {
      const query = searchQuery.toLowerCase();
      return (
        r.userName.toLowerCase().includes(query) ||
        (r.userEmail && r.userEmail.toLowerCase().includes(query)) ||
        r.comment.toLowerCase().includes(query) ||
        r.productName.toLowerCase().includes(query)
      );
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 20 }}>
      
      {/* Top Toolbar Action Buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <button className="btn" onClick={handleOpenAddModal} style={{ borderRadius: 8 }}>
          ＋ Add Review
        </button>
        <button
          className="btn secondary"
          onClick={handleSeedReviews}
          disabled={seeding}
          style={{ borderRadius: 8, borderColor: "var(--gold)" }}
        >
          ✨ {seeding ? "Seeding..." : "Seed Fake Reviews"}
        </button>
      </div>

      {/* Controls: Filter Tabs & Search */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {(["all", "pending", "approved"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`btn ${filter === tab ? "" : "secondary"}`}
              style={{
                textTransform: "capitalize",
                padding: "8px 16px",
                fontSize: 13,
                borderRadius: 8,
              }}
            >
              {tab} ({reviews.filter((r) => (tab === "all" ? true : tab === "pending" ? !r.approved : r.approved)).length})
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search reviews..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "8px 16px",
            border: "1px solid var(--line)",
            borderRadius: 8,
            fontSize: 14,
            width: "100%",
            maxWidth: 300,
            background: "var(--white)",
          }}
        />
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: "#fee2e2", color: "var(--error)", fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading reviews...</p>
      ) : filteredReviews.length === 0 ? (
        <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ color: "var(--muted)", fontStyle: "italic", margin: 0 }}>
            No reviews found matching the filters.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="card pad admin-review-card"
              style={{
                borderLeft: review.approved ? "4px solid var(--success)" : "4px solid var(--gold)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img
                    src={review.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=random`}
                    alt={review.userName}
                    style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--line)" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{review.userName}</span>
                      {review.userEmail && (
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>({review.userEmail})</span>
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          padding: "1px 6px",
                          borderRadius: 999,
                          fontWeight: 600,
                          background: review.approved ? "var(--sage-light)" : "var(--blush)",
                          color: review.approved ? "var(--sage-dark)" : "var(--ink)",
                        }}
                      >
                        {review.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      Product: <strong style={{ color: "var(--ink)" }}>{review.productName}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  {renderStars(review.rating)}
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    {new Date(review.createdAt).toLocaleString()}
                  </span>
                </div>

                <p style={{ fontSize: 14, margin: "8px 0 0 0", color: "var(--ink)", lineHeight: 1.5 }}>
                  {review.comment}
                </p>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, alignSelf: "center" }}>
                <button
                  className="btn secondary"
                  onClick={() => handleOpenEditModal(review)}
                  style={{ padding: "8px 12px", fontSize: 12, borderRadius: 6 }}
                >
                  ✏️ Edit
                </button>
                <button
                  className={`btn ${review.approved ? "secondary" : ""}`}
                  onClick={() => handleToggleApprove(review.id, review.approved)}
                  style={{ padding: "8px 12px", fontSize: 12, borderRadius: 6 }}
                >
                  {review.approved ? "Reject" : "Approve"}
                </button>
                <button
                  className="btn soft"
                  onClick={() => handleDelete(review.id)}
                  style={{
                    padding: "8px 12px",
                    fontSize: 12,
                    borderRadius: 6,
                    background: "var(--error)",
                    color: "white",
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Review Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="card pad"
            style={{
              width: "100%",
              maxWidth: 500,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "var(--bg-primary)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
              {editingReview ? "Edit Review" : "Add New Review"}
            </h3>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Target Product *</label>
                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    background: "var(--white)",
                    fontSize: 14,
                  }}
                  required
                >
                  <option value="" disabled>Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brand} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Reviewer Name *</label>
                <input
                  type="text"
                  value={formUserName}
                  onChange={(e) => setFormUserName(e.target.value)}
                  placeholder="e.g. Dr. Aisha Rao"
                  style={{
                    padding: "10px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    background: "var(--white)",
                    fontSize: 14,
                  }}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Reviewer Email (Optional)</label>
                <input
                  type="email"
                  value={formUserEmail}
                  onChange={(e) => setFormUserEmail(e.target.value)}
                  placeholder="e.g. aisha@example.com"
                  style={{
                    padding: "10px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    background: "var(--white)",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Profile Picture Avatar URL</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <img
                    src={formUserAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formUserName || "User")}`}
                    alt="Avatar preview"
                    style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--line)" }}
                  />
                  <input
                    type="text"
                    value={formUserAvatar}
                    onChange={(e) => setFormUserAvatar(e.target.value)}
                    placeholder="URL (Unsplash or uploaded image path)"
                    style={{
                      flexGrow: 1,
                      padding: "10px 14px",
                      border: "1px solid var(--line)",
                      borderRadius: 6,
                      background: "var(--white)",
                      fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ marginTop: 6 }}>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ padding: "8px 12px", fontSize: 12, borderRadius: 6, display: "inline-flex" }}
                  >
                    {uploading ? "Uploading Avatar..." : "📤 Upload Profile Image"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Rating (1 - 5 stars)</label>
                <select
                  value={formRating}
                  onChange={(e) => setFormRating(Number(e.target.value))}
                  style={{
                    padding: "10px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    background: "var(--white)",
                    fontSize: 14,
                  }}
                >
                  <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                  <option value="4">⭐⭐⭐⭐ (4)</option>
                  <option value="3">⭐⭐⭐ (3)</option>
                  <option value="2">⭐⭐ (2)</option>
                  <option value="1">⭐ (1)</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Review Comment *</label>
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  rows={3}
                  placeholder="Review content..."
                  style={{
                    padding: "10px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: 6,
                    background: "var(--white)",
                    fontSize: 14,
                    resize: "vertical",
                  }}
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <input
                  type="checkbox"
                  id="formApproved"
                  checked={formApproved}
                  onChange={(e) => setFormApproved(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: "pointer" }}
                />
                <label htmlFor="formApproved" style={{ fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                  Approve immediately (show on website)
                </label>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setIsModalOpen(false)}
                  style={{ borderRadius: 8 }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn" style={{ borderRadius: 8 }}>
                  Save Review
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
