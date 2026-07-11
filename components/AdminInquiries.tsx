"use client";

import { useEffect, useState } from "react";

export function AdminInquiries() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/inquiries");
      if (response.ok) {
        setInquiries(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteInquiry(id: string) {
    if (confirm("Are you sure you want to delete this inquiry?")) {
      const response = await fetch(`/api/inquiries/${id}`, { method: "DELETE" });
      if (response.ok) {
        load();
      }
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const nextStatus = currentStatus === "Resolved" ? "New" : "Resolved";
    const response = await fetch(`/api/inquiries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    if (response.ok) {
      load();
    }
  }

  if (loading && inquiries.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <h3>Loading inquiries...</h3>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 18 }}>
      {inquiries.length === 0 ? (
        <div className="card pad" style={{ textAlign: "center", padding: 48 }}>
          <h3>No inquiries registered</h3>
          <p style={{ color: "var(--muted)", marginTop: 8 }}>Patient queries submitted on the Contact page will show up here.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Contact details</th>
                <th>Message</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => (
                <tr key={inq._id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(inq.createdAt || Date.now()).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{inq.name}</td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{inq.email}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{inq.phone}</div>
                  </td>
                  <td style={{ maxWidth: 300, lineHeight: 1.4 }}>{inq.message}</td>
                  <td>
                    <span className={`status-pill ${inq.status === "Resolved" ? "confirmed" : "new"}`}>
                      {inq.status || "New"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        className="btn secondary"
                        style={{ padding: "6px 12px", fontSize: 12 }}
                        onClick={() => toggleStatus(inq._id, inq.status || "New")}
                      >
                        {inq.status === "Resolved" ? "Reopen" : "Resolve"}
                      </button>
                      <button
                        className="btn soft"
                        style={{ padding: "6px 12px", fontSize: 12, color: "var(--error)" }}
                        onClick={() => deleteInquiry(inq._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
