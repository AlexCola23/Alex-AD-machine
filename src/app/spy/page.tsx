"use client";
import { useState } from "react";
import AdCard from "@/components/AdCard";
import { Ad } from "@/lib/types";

const inputStyle: React.CSSProperties = {
  background: "#18181b",
  border: "1px solid #27272a",
  borderRadius: "8px",
  color: "#fafafa",
  fontSize: "0.875rem",
  padding: "0.5rem 0.75rem",
  outline: "none",
};

const COUNTRIES = [
  { value: "US", label: "🇺🇸 United States" },
  { value: "GB", label: "🇬🇧 United Kingdom" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "AU", label: "🇦🇺 Australia" },
  { value: "DE", label: "🇩🇪 Germany" },
  { value: "FR", label: "🇫🇷 France" },
  { value: "NL", label: "🇳🇱 Netherlands" },
];

export default function SpyPage() {
  const [brand, setBrand] = useState("");
  const [country, setCountry] = useState("US");
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState("");
  const [searched, setSearched] = useState(false);
  const [searchedBrand, setSearchedBrand] = useState("");

  async function fetchAds(cursor = "") {
    if (!brand.trim()) return;
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      q: brand.trim(),
      country,
      status: "ACTIVE",
      limit: "50",
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

      // Sort by longest running first — these are the winning ads
      results = results.sort((a, b) => {
        const aStart = a.ad_delivery_start_time ? new Date(a.ad_delivery_start_time).getTime() : Date.now();
        const bStart = b.ad_delivery_start_time ? new Date(b.ad_delivery_start_time).getTime() : Date.now();
        return aStart - bStart;
      });

      if (cursor) {
        setAds((prev) => [...prev, ...results]);
      } else {
        setAds(results);
        setSearchedBrand(brand.trim());
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

  // Top performers = running 60+ days
  const topPerformers = ads.filter((ad) => {
    if (!ad.ad_delivery_start_time) return false;
    const days = Math.floor((Date.now() - new Date(ad.ad_delivery_start_time).getTime()) / (1000 * 60 * 60 * 24));
    return days >= 60;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#fafafa" }}>
          Competitor Spy
        </h1>
        <p style={{ color: "#71717a", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
          Enter a brand or product name. Ads running 60+ days are their winners — steal the formula.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder='e.g. "Athletic Greens" or "Manscaped"'
          style={{ ...inputStyle, flex: 1, minWidth: "200px", fontSize: "1rem", padding: "0.625rem 1rem" }}
        />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading || !brand.trim()}
          style={{
            background: loading || !brand.trim() ? "#27272a" : "#3b82f6",
            border: "none",
            borderRadius: "8px",
            color: "#fff",
            cursor: loading || !brand.trim() ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            padding: "0.625rem 1.5rem",
          }}
        >
          {loading ? "Spying..." : "Spy"}
        </button>
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
          {error}
        </div>
      )}

      {/* Stats bar */}
      {searched && ads.length > 0 && (
        <div
          style={{
            background: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "8px",
            padding: "0.875rem 1rem",
            marginBottom: "1.25rem",
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fafafa" }}>{ads.length}</div>
            <div style={{ fontSize: "0.75rem", color: "#71717a" }}>Active ads found for "{searchedBrand}"</div>
          </div>
          <div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#22c55e" }}>{topPerformers.length}</div>
            <div style={{ fontSize: "0.75rem", color: "#71717a" }}>Running 60+ days (top performers)</div>
          </div>
        </div>
      )}

      {/* Top performers section */}
      {topPerformers.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#22c55e", margin: "0 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            🔥 Top Performers (60+ days running)
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {topPerformers.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </div>
      )}

      {/* All ads */}
      {searched && ads.length > 0 && (
        <div>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#71717a", margin: "0 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            All Active Ads — Sorted by Running Time
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </div>
      )}

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

      {searched && !loading && ads.length === 0 && !error && (
        <div style={{ textAlign: "center", color: "#52525b", padding: "3rem 0", fontSize: "0.875rem" }}>
          No active ads found for "{searchedBrand}". Try their exact brand name.
        </div>
      )}

      {!searched && !loading && (
        <div style={{ textAlign: "center", color: "#3f3f46", padding: "5rem 0", fontSize: "0.875rem" }}>
          Enter a competitor's brand name to see all their ads
        </div>
      )}
    </div>
  );
}
