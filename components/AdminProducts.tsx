"use client";

import { useEffect, useState } from "react";
import { categories, concerns, subcategoriesMap } from "@/lib/constants";
import type { Product } from "@/lib/demo";
import { compressImage } from "@/lib/imageCompressor";

const empty = {
  name: "",
  brand: "",
  category: "Skin",
  subcategory: "Facewash / Cleansers",
  concerns: [] as string[],
  price: 0,
  discountedPrice: 0,
  stock: 0,
  description: "",
  usage: "",
  ingredients: "",
  images: [] as string[],
  published: true,
  featured: false
};

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        setProducts(await response.json());
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }

  useEffect(() => { load(); }, []);

  async function uploadMultiple(files?: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedFile = await compressImage(file, 1000, 1000, 0.75);
        const data = new FormData();
        data.append("file", compressedFile);
        const response = await fetch("/api/upload", { method: "POST", body: data });
        if (!response.ok) {
          let errorMsg = "Failed to upload image file";
          try {
            const result = await response.json();
            errorMsg = result.error || errorMsg;
          } catch {
            // Not JSON
          }
          throw new Error(errorMsg);
        }
        const result = await response.json();
        if (result.url) {
          urls.push(result.url);
        } else {
          throw new Error("Failed to upload image file");
        }
      }
      if (urls.length > 0) {
        setForm((current: any) => ({ ...current, images: [...current.images, ...urls] }));
      }
    } catch (err: any) {
      console.warn("Upload error:", err);
      setError(err.message || "Failed to upload product images.");
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    // Field validations
    if (!form.name || !form.name.trim()) {
      return setError("Product name is required.");
    }
    if (!form.brand || !form.brand.trim()) {
      return setError("Brand is required.");
    }
    if (!form.category) {
      return setError("Category is required.");
    }
    if (form.price === undefined || form.price === null || isNaN(Number(form.price))) {
      return setError("Original price must be a valid number.");
    }
    if (form.discountedPrice === undefined || form.discountedPrice === null || isNaN(Number(form.discountedPrice))) {
      return setError("Discount price must be a valid number.");
    }
    if (form.stock === undefined || form.stock === null || isNaN(Number(form.stock))) {
      return setError("Stock must be a valid number.");
    }

    setSaving(true);

    try {
      const url = editing ? `/api/products/${editing}` : "/api/products";
      const method = editing ? "PUT" : "POST";

      const sanitizedForm = {
        ...form,
        name: form.name.trim(),
        brand: form.brand.trim(),
        price: Number(form.price),
        discountedPrice: Number(form.discountedPrice),
        stock: Number(form.stock),
        concerns: Array.isArray(form.concerns) ? form.concerns : [],
        published: Boolean(form.published),
        featured: Boolean(form.featured),
        images: Array.isArray(form.images) ? form.images : []
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedForm)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to save product details");
      }

      setSuccess(editing ? "Product details updated successfully." : "Product created successfully.");
      setForm(empty);
      setEditing("");
      load();
    } catch (err: any) {
      console.warn("Save error:", err);
      setError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (confirm("Are you sure you want to delete this product?")) {
      setError("");
      setSuccess("");
      try {
        const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to delete product");
        }
        setSuccess("Product deleted successfully.");
        load();
      } catch (err: any) {
        console.warn("Delete error:", err);
        setError(err.message || "Failed to delete product from database.");
      }
    }
  }

  return (
    <div className="grid admin-products-layout">
      <form className="card pad form" onSubmit={save}>
        <h2 style={{ fontSize: 22, borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 14 }}>
          {editing ? "✏️ Edit Product Details" : "🧴 Add Catalog Product"}
        </h2>

        {error && (
          <div style={{ color: "var(--error)", fontSize: 13, background: "rgba(201, 74, 74, 0.08)", padding: "10px 14px", borderRadius: "6px", marginBottom: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{ color: "var(--success)", fontSize: 13, background: "rgba(74, 201, 102, 0.08)", padding: "10px 14px", borderRadius: "6px", marginBottom: 14 }}>
            ✓ {success}
          </div>
        )}
        
        <div className="field">
          <label>Product Name</label>
          <input className="input" placeholder="e.g. Daily Repair Cream" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required disabled={saving} />
        </div>

        <div className="field">
          <label>Brand</label>
          <input className="input" placeholder="e.g. DermaDental360 Select" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required disabled={saving} />
        </div>

        <div className="grid cols-2" style={{ gap: 14 }}>
          <div className="field">
            <label>Primary Category</label>
            <select 
              className="input" 
              value={form.category} 
              onChange={(e) => {
                const cat = e.target.value;
                const subs = subcategoriesMap[cat] || [];
                setForm({ ...form, category: cat, subcategory: subs[0] || "" });
              }} 
              disabled={saving}
            >
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Subcategory</label>
            <select 
              className="input" 
              value={form.subcategory || ""} 
              onChange={(e) => setForm({ ...form, subcategory: e.target.value })} 
              disabled={saving}
            >
              {(subcategoriesMap[form.category] || []).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Concerns (Hold Ctrl to Multi-select)</label>
          <select className="input" multiple style={{ height: 110 }} value={form.concerns} onChange={(e) => setForm({ ...form, concerns: Array.from(e.target.selectedOptions).map((option) => option.value) })} disabled={saving}>
            {concerns.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>

        <div className="grid cols-3" style={{ gap: 14 }}>
          <div className="field">
            <label>Original Price (₹)</label>
            <input className="input" type="number" placeholder="999" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required disabled={saving} />
          </div>
          <div className="field">
            <label>Discount Price (₹)</label>
            <input className="input" type="number" placeholder="799" value={form.discountedPrice || ""} onChange={(e) => setForm({ ...form, discountedPrice: Number(e.target.value) })} required disabled={saving} />
          </div>
          <div className="field">
            <label>Current Stock</label>
            <input className="input" type="number" placeholder="10" value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} required disabled={saving} />
          </div>
        </div>

        <div className="field">
          <label>Description</label>
          <textarea className="input" rows={3} placeholder="Describe product benefits..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={saving} />
        </div>

        <div className="field">
          <label>How to Use</label>
          <textarea className="input" rows={2} placeholder="Usage instructions..." value={form.usage} onChange={(e) => setForm({ ...form, usage: e.target.value })} disabled={saving} />
        </div>

        <div className="field">
          <label>Ingredients</label>
          <textarea className="input" rows={2} placeholder="Active compounds..." value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} disabled={saving} />
        </div>

        <div className="field">
          <label>Product Images Upload (Multiple files supported)</label>
          <div className="upload-zone" style={{ opacity: saving ? 0.6 : 1, pointerEvents: saving ? "none" : "auto" }}>
            <label className="upload-label">
              <span className="upload-icon" style={{ fontSize: 24 }}>⬆️</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {uploading ? "Uploading files..." : "Click to select product images"}
              </span>
              <input type="file" accept="image/*" multiple onChange={(e) => uploadMultiple(e.target.files)} style={{ display: "none" }} disabled={uploading || saving} />
            </label>
          </div>
          {form.images && form.images.length > 0 && (
            <div className="image-previews">
              {form.images.map((img: string, idx: number) => (
                <div key={idx} className="preview-container">
                  <img src={img} alt={`Preview ${idx + 1}`} />
                  <button type="button" className="remove-preview-btn" onClick={() => {
                    setForm({ ...form, images: form.images.filter((_: any, i: number) => i !== idx) });
                  }} disabled={saving}>&times;</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 20, margin: "6px 0" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} disabled={saving} />
            Published (visible on shop)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} disabled={saving} />
            Featured (homepage display)
          </label>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn" type="submit" style={{ flexGrow: 1 }} disabled={uploading || saving}>
            {saving ? "Saving Details..." : editing ? "Update Product" : "Save Product"}
          </button>
          {editing && (
            <button className="btn secondary" type="button" onClick={() => { setEditing(""); setForm(empty); setError(""); setSuccess(""); }} disabled={saving}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        <h2 style={{ fontSize: 22, borderBottom: "1px solid var(--line)", paddingBottom: 10, marginBottom: 18 }}>
          🧴 Live Catalog ({products.length})
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {products.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock < 10;
            return (
              <div className="card pad admin-catalog-item" key={product._id}>
                <img src={product.images[0]} alt={product.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)" }} />
                <div>
                  <h3 style={{ fontSize: 16, margin: 0 }}>{product.name}</h3>
                  <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0 0" }}>
                    {product.brand} · {product.category} ({product.subcategory}) · ₹{product.discountedPrice}{" "}
                    {isOutOfStock ? (
                      <span className="status-pill cancelled" style={{ fontSize: 10, padding: "1px 6px", marginLeft: 6 }}>Out of Stock</span>
                    ) : isLowStock ? (
                      <span className="status-pill packed" style={{ fontSize: 10, padding: "1px 6px", marginLeft: 6 }}>Low Stock ({product.stock})</span>
                    ) : (
                      <span className="status-pill confirmed" style={{ fontSize: 10, padding: "1px 6px", marginLeft: 6 }}>Stock ({product.stock})</span>
                    )}
                  </p>
                </div>
                <div className="actions" style={{ gap: 8 }}>
                  <button className="btn secondary" style={{ padding: "8px 12px", fontSize: 12 }} onClick={() => { setEditing(product._id); setForm(product); }}>
                    Edit
                  </button>
                  <button className="btn soft" style={{ padding: "8px 12px", fontSize: 12, color: "var(--error)" }} onClick={() => remove(product._id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
