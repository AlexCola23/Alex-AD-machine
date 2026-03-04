"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import AdCard from "@/components/AdCard";
import FilterSidebar from "@/components/FilterSidebar";
import { Ad, Filters } from "@/lib/types";

const DEFAULT_FILTERS: Filters = {
  countries: ["US"],
  status: "ACTIVE",
  platforms: [],
  runTime: 0,
  sortBy: "running",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const didMount = useRef(false);

  const applyFilters = useCallback((raw: Ad[], f: Filters): Ad[] => {
    let out = [...raw];
    if (f.platforms.length > 0) {
      out = out.filter(a => f.platforms.some(p => a.publisher_platforms?.includes(p)));
    }
    if (f.runTime > 0) {
      out = out.filter(a => {
        if (!a.ad_delivery_start_time) return false;
        const d = Math.floor((Date.now() - new Date(a.ad_delivery_start_time).getTime()) / 86400000);
        return d >= f.runTime;
      });
    }
    if (f.sortBy === "running") {
      out.sort((a, b) => {
        const aT = a.ad_delivery_start_time ? new Date(a.ad_delivery_start_time).getTime() : 0;
        const bT = b.ad_delivery_start_time ? new Date(b.ad_delivery_start_time).getTime() : 0;
        return aT - bT;
      });
    } else {
      out.sort((a, b) => {
        const aT = a.ad_creation_time ? new Date(a.ad_creation_time).getTime() : 0;
        const bT = b.ad_creation_time ? new Date(b.ad_creation_time).getTime() : 0;
        return bT - aT;
      });
    }
    return out;
  }, []);

  async function fetchAds(cursor = "", currentFilters = filters, q = query) {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      country: currentFilters.countries[0] ?? "US",
      status: currentFilters.status,
      limit: "40",
    });
    if (q.trim()) params.set("q", q.trim());
    if (cursor) params.set("after", cursor);

    try {
      const res = await fetch(`/api/ads?${params}`);
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }

      const filtered = applyFilters(data.data ?? [], currentFilters);
      if (cursor) {
        setAds(prev => [...prev, ...filtered]);
        setTotalCount(prev => prev + filtered.length);
      } else {
        setAds(filtered);
        setTotalCount(filtered.length);
      }
      setNextCursor(data.paging?.cursors?.after ?? "");
    } catch {
      setError("Connection error. Check your network.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-load on mount
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      fetchAds("", DEFAULT_FILTERS, "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setNextCursor("");
    fetchAds("", filters, query);
  };

  const handleFilterChange = (f: Filters) => {
    setFilters(f);
    setNextCursor("");
    fetchAds("", f, query);
  };

  const inputStyle: React.CSSProperties = {
    background: "#111115", border: "1px solid #1e1e23", borderRadius: "8px",
    color: "#fafafa", fontSize: "1rem", padding: "0.7rem 1rem", outline: "none",
    flex: 1, transition: "border-color 0.15s",
  };

  return (
    <div style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
      <FilterSidebar filters={filters} onChange={handleFilterChange} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: 0, color: "#fafafa" }}>Search Ads</h1>
          <p style={{ color: "#52525b", margin: "0.2rem 0 0", fontSize: "0.8rem" }}>
            Browse winning Facebook & Instagram ads. Longest-running = proven winners.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder='Filter by keyword: "weight loss", "skincare"…'
            style={inputStyle}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#22c55e"}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#1e1e23"}
          />
          <button type="submit" disabled={loading} style={{
            background: loading ? "#1e1e23" : "#22c55e",
            border: "none", borderRadius: "8px",
            color: loading ? "#52525b" : "#000",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "0.875rem", fontWeight: 700, padding: "0.7rem 1.5rem",
            transition: "all 0.15s",
          }}>
            {loading ? "Loading…" : "Search"}
          </button>
        </form>

        {/* Results count */}
        {!loading && totalCount > 0 && (
          <div style={{ fontSize: "0.75rem", color: "#52525b", marginBottom: "0.75rem" }}>
            {totalCount} ads{query ? ` for "${query}"` : ""}
            {filters.runTime > 0 && ` · ${filters.runTime}+ days`}
            {filters.platforms.length > 0 && ` · ${filters.platforms.join(", ")}`}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "8px", color: "#fca5a5", fontSize: "0.8rem", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && ads.length === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.875rem" }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{ background: "#111115", border: "1px solid #1e1e23", borderRadius: "12px", height: "360px", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "linear-gradient(90deg, #111115 25%, #1a1a1f 50%, #111115 75%)", backgroundSize: "200% 100%", animation: "skeleton 1.4s ease infinite" }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && ads.length === 0 && !error && (
          <div style={{ textAlign: "center", color: "#3f3f46", padding: "4rem 0", fontSize: "0.875rem" }}>
            No ads found. Try adjusting filters.
          </div>
        )}

        {/* Grid */}
        {ads.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.875rem" }}>
            {ads.map(ad => <AdCard key={ad.id} ad={ad} />)}
          </div>
        )}

        {/* Load more */}
        {nextCursor && !loading && (
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <button onClick={() => fetchAds(nextCursor, filters, query)} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#71717a", cursor: "pointer", fontSize: "0.875rem", padding: "0.625rem 2rem" }}>
              Load More
            </button>
          </div>
        )}
        {loading && ads.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "1rem", color: "#3f3f46", fontSize: "0.8rem" }}>Loading…</div>
        )}
      </div>
    </div>
  );
}
