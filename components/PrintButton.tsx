"use client";

export function PrintButton({ id }: { id: string }) {
  return (
    <button
      id={id}
      className="legal-print-btn"
      onClick={() => window.print()}
    >
      🖨️ Print this page
    </button>
  );
}
