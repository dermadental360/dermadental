"use client";

import { useEffect, useState } from "react";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const loadLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs");
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((log: any) =>
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.details.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="page-enter" style={{ display: "grid", gap: 24 }}>
      <div>
        <p className="eyebrow" style={{ color: "var(--gold)" }}>Security & Tracking</p>
        <h1 style={{ margin: "4px 0 0 0" }}>System Audit Logs</h1>
      </div>

      <div className="card pad" style={{ display: "grid", gap: 18 }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
          <input
            className="input"
            placeholder="Search action or log details..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: 360 }}
          />
          <button className="btn secondary" onClick={loadLogs} style={{ padding: "10px 18px" }}>
            🔄 Refresh Logs
          </button>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-sm)" }}>
            Loading System Logs...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}>
            <h3>No audit logs match your search</h3>
            <p style={{ marginTop: 6 }}>Try clearing your search filters or reloading the logs feed.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "2px solid var(--line)", color: "var(--muted)", fontSize: 13 }}>
                  <th style={{ padding: 12 }}>Timestamp</th>
                  <th style={{ padding: 12 }}>Action</th>
                  <th style={{ padding: 12 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log: any) => (
                  <tr key={log._id} style={{ borderBottom: "1px solid var(--line)", fontSize: 14 }}>
                    <td style={{ padding: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: 12, fontWeight: 700 }}>
                      <span
                        className="status-pill"
                        style={{
                          backgroundColor: log.action.includes("Login")
                            ? "#e0f2fe"
                            : log.action.includes("Create")
                            ? "#ecfdf5"
                            : log.action.includes("Update")
                            ? "#fef3c7"
                            : "#fef2f2",
                          color: log.action.includes("Login")
                            ? "#0369a1"
                            : log.action.includes("Create")
                            ? "#047857"
                            : log.action.includes("Update")
                            ? "#b45309"
                            : "#b91c1c",
                          fontSize: 11,
                          padding: "2px 8px"
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: 12, color: "var(--ink)" }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
