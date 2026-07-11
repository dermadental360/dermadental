"use client";

import { useState, useEffect } from "react";

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  userAvatar?: string | null;
  createdAt: string;
}


export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !comment || !rating) return;

    try {
      setSubmitting(true);
      setError("");
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          userName: name,
          userEmail: email,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");

      setSubmitSuccess(true);
      setName("");
      setEmail("");
      setRating(5);
      setComment("");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to render stars
  const renderStars = (count: number, interactive = false, size = 16) => {
    return (
      <div style={{ display: "flex", gap: 3 }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = interactive
            ? (hoverRating || rating) >= star
            : count >= star;
          return (
            <svg
              key={star}
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={isFilled ? "var(--gold, #c5a880)" : "none"}
              stroke="var(--gold, #c5a880)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                cursor: interactive ? "pointer" : "default",
                transition: "transform 0.1s ease",
              }}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onClick={() => interactive && setRating(star)}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          );
        })}
      </div>
    );
  };

  // Ratings Stats
  const totalCount = reviews.length;
  const avgRating = totalCount
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1))
    : 0;

  const distribution = [0, 0, 0, 0, 0]; // 1 to 5 stars
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      distribution[r.rating - 1]++;
    }
  });

  return (
    <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 32 }}>
      <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: 0 }} />

      <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
        Customer Reviews
      </h2>

      {/* Overview & Stats Dashboard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
        <div className="card pad" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", background: "var(--bg-secondary)" }}>
          <span style={{ fontSize: 52, fontWeight: 800, color: "var(--ink)" }}>{avgRating || "0.0"}</span>
          <div style={{ margin: "8px 0" }}>{renderStars(Math.round(avgRating), false, 24)}</div>
          <span style={{ fontSize: 14, color: "var(--muted)" }}>Based on {totalCount} reviews</span>
        </div>

        <div className="card pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = distribution[stars - 1];
            const pct = totalCount ? (count / totalCount) * 100 : 0;
            return (
              <div key={stars} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14 }}>
                <span style={{ width: 48, textAlign: "right" }}>{stars} Star</span>
                <div style={{ flexGrow: 1, height: 8, background: "var(--line, #eadfd8)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "var(--gold, #c5a880)", borderRadius: 999 }} />
                </div>
                <span style={{ width: 32, color: "var(--muted)", textAlign: "left" }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Reviews Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "start" }}>
        
        {/* Reviews List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 10px 0" }}>Reviews ({totalCount})</h3>
          {loading ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p style={{ color: "var(--muted)", fontStyle: "italic" }}>No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="card pad" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img
                      src={review.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=random`}
                      alt={review.userName}
                      style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{review.userName}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    {new Date(review.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div>{renderStars(review.rating, false, 14)}</div>
                <p style={{ fontSize: 14, margin: "4px 0 0 0", color: "var(--ink)", lineHeight: 1.5 }}>
                  {review.comment}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Review Form */}
        <div className="card pad" style={{ position: "sticky", top: 120 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px 0" }}>Write a Review</h3>
          
          {submitSuccess ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
              <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Review Submitted!</h4>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>
                Thank you for sharing your feedback. Your review will be visible once approved by our team.
              </p>
              <button className="btn secondary" onClick={() => setSubmitSuccess(false)} style={{ marginTop: 12 }}>
                Submit another review
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {error && (
                <div style={{ padding: 12, borderRadius: 8, background: "#fee2e2", color: "var(--error)", fontSize: 14 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Your Rating</label>
                <div style={{ padding: "4px 0" }}>{renderStars(rating, true, 28)}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor="rev-name" style={{ fontSize: 13, fontWeight: 500 }}>Name</label>
                <input
                  id="rev-name"
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-sm, 6px)",
                    background: "var(--cream, #fffdfc)",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor="rev-email" style={{ fontSize: 13, fontWeight: 500 }}>Email (Optional)</label>
                <input
                  id="rev-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-sm, 6px)",
                    background: "var(--cream, #fffdfc)",
                    fontSize: 14,
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor="rev-comment" style={{ fontSize: 13, fontWeight: 500 }}>Review</label>
                <textarea
                  id="rev-comment"
                  required
                  rows={4}
                  placeholder="Share your thoughts about this product..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{
                    padding: "10px 14px",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-sm, 6px)",
                    background: "var(--cream, #fffdfc)",
                    fontSize: 14,
                    resize: "vertical",
                  }}
                />
              </div>

              <button className="btn" type="submit" disabled={submitting} style={{ width: "100%" }}>
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
