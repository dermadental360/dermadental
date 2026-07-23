"use client";

import React, { useState } from "react";
import { categories, concerns, skincareConcerns, oralCareConcerns, hairConcerns } from "@/lib/constants";
import Link from "next/link";

interface ShopFiltersProps {
  initialQ?: string;
  initialCategory?: string;
  initialConcern?: string;
}

export const ShopFilters = React.memo(function ShopFilters({ initialQ = "", initialCategory = "", initialConcern = "" }: ShopFiltersProps) {
  const [category, setCategory] = useState(initialCategory);
  const [concern, setConcern] = useState(initialConcern);
  const [q, setQ] = useState(initialQ);

  const getConcernsForCategory = (cat: string) => {
    if (cat === "Skin") return skincareConcerns;
    if (cat === "Oral Care") return oralCareConcerns;
    if (cat === "Hair") return hairConcerns;
    return concerns; // Default to all concerns
  };

  const activeConcerns = getConcernsForCategory(category);

  // If the currently selected concern is not in the active concerns list, reset it
  const isConcernValid = !category || activeConcerns.includes(concern) || concern === "";
  const currentConcernValue = isConcernValid ? concern : "";

  return (
    <aside className="card pad reveal shop-sidebar">
      <h2 className="filters-title">Filter Catalog</h2>
      <form className="form" method="GET" action="/shop">
        <div className="filters-group">
          <label className="filters-group-title">Search Key</label>
          <input 
            className="input" 
            name="q" 
            placeholder="Type keywords..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
          />
        </div>
        
        <div className="filters-group">
          <label className="filters-group-title">Category</label>
          <select 
            className="input" 
            name="category" 
            value={category} 
            onChange={(e) => {
              const cat = e.target.value;
              setCategory(cat);
              // reset concern if not valid under the new category
              const nextActiveConcerns = getConcernsForCategory(cat);
              if (cat && !nextActiveConcerns.includes(concern)) {
                setConcern("");
              }
            }}
          >
            <option value="">All Categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="filters-group">
          <label className="filters-group-title">Concern</label>
          <select 
            className="input" 
            name="concern" 
            value={currentConcernValue} 
            onChange={(e) => setConcern(e.target.value)}
          >
            <option value="">All Concerns</option>
            {activeConcerns.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginTop: 14 }}>
          <button className="btn" type="submit" style={{ width: "100%" }}>Filter</button>
          {(q || category || concern) && (
            <Link className="btn secondary" href="/shop" style={{ padding: "12px 16px", display: "grid", placeItems: "center" }} title="Reset Filters">
              &times;
            </Link>
          )}
        </div>
      </form>
    </aside>
  );
});
