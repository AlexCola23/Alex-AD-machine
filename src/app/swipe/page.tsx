"use client";
import { useState, useEffect, useCallback } from "react";
import AdCard from "@/components/AdCard";
import { SwipeAd } from "@/lib/types";
import { getSwipeFile } from "@/lib/swipeStorage";

export default function SwipePage() {
  const [ads, setAds] = useState<SwipeAd[]>([]);
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => {
    setAds(getSwipeFile());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = ads.filter((ad) => {
    if (filter === "facebook") return ad.publisher_platforms?.includes("facebook");
    if (filter === "instagram") return ad.publisher_platforms?.includes("instagram");
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "#fafafa" }}>
            Swipe File
          </h1>
          <p style={{ color: "#71717a", margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
            {ads.length} saved ad{ads.length !== 1 ? "s" : ""} — yours forever, even if they go inactive.
          </p>
        </div>

        {/* Platform filter */}
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {["all", "facebook", "instagram"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? "#27272a" : "transparent",
                border: "1px solid",
                borderColor: filter === f ? "#3f3f46" : "#27272a",
                borderRadius: "6px",
                color: filter === f ? "#fafafa" : "#71717a",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: filter === f ? 600 : 400,
                padding: "0.375rem 0.75rem",
                textTransform: "capitalize",
              }}
            >
              {f === "all" ? "All" : f === "facebook" ? "Facebook" : "Instagram"}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {ads.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "5rem 1rem",
            color: "#52525b",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>★</div>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>
            No saved ads yet. Hit ☆ on any ad to save it here.
          </p>
        </div>
      )}

      {/* Filtered empty */}
      {ads.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "#52525b", padding: "3rem 0", fontSize: "0.875rem" }}>
          No {filter} ads saved yet.
        </div>
      )}

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
        }}
      >
        {filtered.map((ad) => (
          <AdCard key={ad.id} ad={ad} onRemove={load} />
        ))}
      </div>

      {ads.length > 0 && (
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "#52525b" }}>
            Saved locally in your browser
          </span>
          <button
            onClick={() => {
              const data = JSON.stringify(ads, null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "swipe-file.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              background: "transparent",
              border: "1px solid #27272a",
              borderRadius: "6px",
              color: "#71717a",
              cursor: "pointer",
              fontSize: "0.75rem",
              padding: "0.375rem 0.75rem",
            }}
          >
            Export JSON
          </button>
        </div>
      )}
    </div>
  );
}
