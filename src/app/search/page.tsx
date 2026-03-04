"use client";
import { useState, useRef } from "react";
import AdCard from "@/components/AdCard";
import { Ad } from "@/lib/types";

const COUNTRIES = [
  { value: "US", label: "🇺🇸 United States" },
  { value: "GB", label: "🇬🇧 United Kingdom" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "AU", label: "🇦🇺 Australia" },
  { value: "DE", label: "🇩🇪 Germany" },
  { value: "FR", label: "🇫🇷 France" },
];

const inputStyle: React.CSSProperties = {
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "8px",
  color: "#fafafa",
  fontSize: "0.875rem",
  padding: "0.5rem 0.75rem",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("US");
  const [status, setStatus] = useState("ACTIVE");
  const [sortBy, setSortBy] = useState("running");
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState("");
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function fetchAds(cursor = "") {
    if (!query.trim()) return;
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      q: query.trim(),
      country,
      status,
      limit: "30",
    });
    if (cursor) params.set("after", cursor);

    try {
      const res = await fetch(`/api/ads?${params}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      let results: Ad[] = data.data ?? [];

      // Sort by running time (longest first = best performing)
      if (sortBy === "running") {
        results = results.sort((a, b) => {
          const aStart = a.ad_delivery_start_time ? new Date(a.ad_delivery_start_time).getTime() : 0;
          const bStart = b.ad_delivery_start_time ? new Date(b.ad_delivery_start_time).getTime() : 0;
          return aStart - bStart; // oldest start = longest running
        });
      }

      if (cursor) {
        setAds((prev) => [...prev, ...results]);
      } else {
        setAds(results);
      }

      setNextCursor(data.paging?.cursors?.after ?? "");
      setSearched(true);
    } catch {
      setError("Something went wrong. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setNextCursor("");
    fetchAds();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#fafafa" }}>
          Search Ads
        </h1>
        <p style={{ color: "#71717a", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
          Search Facebook & Instagram ads by keyword or niche. Longer-running ads = winning ads.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {/* Main search bar */}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='e.g. "weight loss supplement" or "dropshipping"'
            style={{
              ...inputStyle,
              flex: 1,
              fontSize: "1rem",
              padding: "0.625rem 1rem",
            }}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            style={{
              background: loading || !query.trim() ? "#27272a" : "#3b82f6",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              cursor: loading || !query.trim() ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              padding: "0.625rem 1.5rem",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Filters row */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={selectStyle}
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={selectStyle}
          >
            <option value="ACTIVE">Active Ads Only</option>
            <option value="ALL">Active + Inactive</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={selectStyle}
          >
            <option value="running">Sort: Longest Running First</option>
            <option value="recent">Sort: Most Recent First</option>
          </select>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#450a0a",
            border: "1px solid #7f1d1d",
            borderRadius: "8px",
            color: "#fca5a5",
            fontSize: "0.875rem",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
          }}
        >
          {error.includes("META_ACCESS_TOKEN") ? (
            <>
              <strong>Setup needed:</strong> Add your Meta access token to <code>.env.local</code>.{" "}
              See <code>SETUP.md</code> for instructions.
            </>
          ) : (
            error
          )}
        </div>
      )}

      {/* Results */}
      {searched && !loading && ads.length === 0 && !error && (
        <div style={{ textAlign: "center", color: "#52525b", padding: "3rem 0", fontSize: "0.875rem" }}>
          No ads found. Try a different keyword or change the filters.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>

      {/* Load more */}
      {nextCursor && !loading && (
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            onClick={() => fetchAds(nextCursor)}
            style={{
              background: "#27272a",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#a1a1aa",
              cursor: "pointer",
              fontSize: "0.875rem",
              padding: "0.625rem 1.5rem",
            }}
          >
            Load More
          </button>
        </div>
      )}

      {loading && ads.length > 0 && (
        <div style={{ textAlign: "center", marginTop: "1rem", color: "#52525b", fontSize: "0.875rem" }}>
          Loading more...
        </div>
      )}

      {!searched && !loading && (
        <div
          style={{
            textAlign: "center",
            color: "#3f3f46",
            padding: "5rem 0",
            fontSize: "0.875rem",
          }}
        >
          Search any keyword to find ads
        </div>
      )}
    </div>
  );
}
