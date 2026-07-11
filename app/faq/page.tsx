const faqs = [
  ["Do you take online payment?", "No. Orders are confirmed through WhatsApp and payment can be handled directly with the clinic."],
  ["Can I upload product images in admin?", "Yes. The admin panel supports local file uploads for product images."],
  ["Is Sunday open?", "The clinic is closed on Sunday."],
  ["How do I order?", "Add items to cart, place order, then send the generated WhatsApp message."]
];

export default function FAQPage() {
  return (
    <main className="section page-enter">
      <div className="container reveal" style={{ maxWidth: 850 }}>
        <p className="eyebrow">Assistance Hub</p>
        <h1 style={{ marginBottom: 30 }}>Common questions</h1>
        <div className="grid">
          {faqs.map(([q, a], idx) => (
            <div className="card pad reveal" key={q} style={{ transitionDelay: `${idx * 0.1}s`, borderLeft: "4px solid var(--sage)" }}>
              <h3 style={{ fontSize: 18, color: "var(--sage-dark)" }}>{q}</h3>
              <p style={{ fontSize: 15, color: "var(--muted)", margin: "8px 0 0 0", lineHeight: 1.5 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
