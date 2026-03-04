"use client";
import { useState } from "react";
import AdCard from "@/components/AdCard";
import FilterSidebar from "@/components/FilterSidebar";
import { Ad, Filters } from "@/lib/types";

const DEFAULT_FILTERS: Filters = { countries: ["US"], status: "ACTIVE", platforms: [], runTime: 0, sortBy: "running" };

export default function SpyPage() {
  const [brand, setBrand] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState("");
  const [searched, setSearched] = useState(false);
  const [searchedBrand, setSearchedBrand] = useState("");

  function applyFilters(raw: Ad[], f: Filters): Ad[] {
    let out = [...raw];
    if (f.platforms.length > 0) out = out.filter(a => f.platforms.some(p => a.publisher_platforms?.includes(p)));
    if (f.runTime > 0) out = out.filter(a => { if (!a.ad_delivery_start_time) return false; return Math.floor((Date.now() - new Date(a.ad_delivery_start_time).getTime()) / 86400000) >= f.runTime; });
    out.sort((a, b) => { const aT = a.ad_delivery_start_time ? new Date(a.ad_delivery_start_time).getTime() : 0; const bT = b.ad_delivery_start_time ? new Date(b.ad_delivery_start_time).getTime() : 0; return aT - bT; });
    return out;
  }

  async function fetchAds(cursor = "", f = filters) {
    if (!brand.trim()) return;
    setLoading(true); setError("");
    const params = new URLSearchParams({ q: brand.trim(), country: f.countries[0] ?? "US", status: f.status, limit: "50" });
    if (cursor) params.set("after", cursor);
    try {
      const res = await fetch(`/api/ads?${params}`);
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      const filtered = applyFilters(data.data ?? [], f);
      if (cursor) { setAds(prev => [...prev, ...filtered]); } else { setAds(filtered); setSearchedBrand(brand.trim()); }
      setNextCursor(data.paging?.cursors?.after ?? "");
      setSearched(true);
    } catch { setError("Connection error."); } finally { setLoading(false); }
  }

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setNextCursor(""); fetchAds("", filters); };
  const handleFilterChange = (f: Filters) => { setFilters(f); if (searched) { setNextCursor(""); fetchAds("", f); } };
  const topPerformers = ads.filter(a => { if (!a.ad_delivery_start_time) return false; return Math.floor((Date.now() - new Date(a.ad_delivery_start_time).getTime()) / 86400000) >= 60; });

  return (
    <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
      <FilterSidebar filters={filters} onChange={handleFilterChange} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: 0, color: "#fafafa" }}>Competitor Spy</h1>
          <p style={{ color: "#52525b", margin: "0.2rem 0 0", fontSize: "0.8rem" }}>Search a brand. Ads running 60+ days are their winners.</p>
        </div>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder='"Athletic Greens" or "Manscaped"'
            style={{ background: "#111115", border: "1px solid #1e1e23", borderRadius: "8px", color: "#fafafa", fontSize: "1rem", padding: "0.7rem 1rem", outline: "none", flex: 1 }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#22c55e"}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#1e1e23"} />
          <button type="submit" disabled={loading || !brand.trim()} style={{ background: loading || !brand.trim() ? "#1e1e23" : "#22c55e", border: "none", borderRadius: "8px", color: loading || !brand.trim() ? "#52525b" : "#000", cursor: loading || !brand.trim() ? "not-allowed" : "pointer", fontSize: "0.875rem", fontWeight: 700, padding: "0.7rem 1.5rem" }}>
            {loading ? "Spying…" : "Spy"}
          </button>
        </form>
        {searched && ads.length > 0 && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
            {[{ val: ads.length, label: `Ads for "${searchedBrand}"`, color: "#fafafa" }, { val: topPerformers.length, label: "Running 60+ days 🔥", color: "#22c55e" }].map(({ val, label, color }) => (
              <div key={label} style={{ background: "#111115", border: "1px solid #1e1e23", borderRadius: "8px", padding: "0.75rem 1.25rem" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: "0.7rem", color: "#52525b", marginTop: "0.2rem" }}>{label}</div>
              </div>
            ))}
          </div>
        )}
        {error && <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "8px", color: "#fca5a5", fontSize: "0.8rem", padding: "0.75rem 1rem", marginBottom: "1rem" }}>{error}</div>}
        {topPerformers.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>🔥 Top Performers — 60+ days running</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.875rem" }}>{topPerformers.map(ad => <AdCard key={ad.id} ad={ad} />)}</div>
          </div>
        )}
        {ads.length > 0 && (
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem" }}>All Ads — Sorted by Running Time</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.875rem" }}>{ads.map(ad => <AdCard key={ad.id} ad={ad} />)}</div>
          </div>
        )}
        {nextCursor && !loading && <div style={{ textAlign: "center", marginTop: "1.5rem" }}><button onClick={() => fetchAds(nextCursor)} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#71717a", cursor: "pointer", fontSize: "0.875rem", padding: "0.625rem 2rem" }}>Load More</button></div>}
        {searched && !loading && ads.length === 0 && !error && <div style={{ textAlign: "center", color: "#3f3f46", padding: "3rem 0", fontSize: "0.875rem" }}>No ads found for "{searchedBrand}". Try their exact brand name.</div>}
        {!searched && !loading && <div style={{ textAlign: "center", color: "#27272a", padding: "5rem 0", fontSize: "0.875rem" }}>Enter a competitor brand to spy on their ads</div>}
      </div>
    </div>
  );
}
