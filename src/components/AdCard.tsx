"use client";
import { useState, useEffect } from "react";
import { Ad } from "@/lib/types";
import { saveAd, removeAd, isSaved } from "@/lib/swipeStorage";

function daysRunning(start?: string): number | null {
  if (!start) return null;
  return Math.floor((Date.now() - new Date(start).getTime()) / 86400000);
}

function stars(days: number | null): number {
  if (!days) return 1;
  if (days >= 90) return 5;
  if (days >= 60) return 4;
  if (days >= 30) return 3;
  if (days >= 14) return 2;
  return 1;
}

function fmt(n: string | undefined): string {
  if (!n) return "—";
  const num = parseInt(n);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return n;
}

function brandColor(name: string): string {
  const palette = ["#ef4444","#f97316","#eab308","#22c55e","#14b8a6","#3b82f6","#8b5cf6","#ec4899"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function formatDate(d?: string): string {
  if (!d) return "Unknown";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props { ad: Ad; onRemove?: () => void; }

export default function AdCard({ ad, onRemove }: Props) {
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSaved(isSaved(ad.id)); }, [ad.id]);

  const toggle = () => {
    if (saved) { removeAd(ad.id); setSaved(false); onRemove?.(); }
    else { saveAd(ad); setSaved(true); }
  };

  const days = daysRunning(ad.ad_delivery_start_time);
  const rating = stars(days);
  const body = ad.ad_creative_bodies?.[0] ?? "";
  const title = ad.ad_creative_link_titles?.[0] ?? "";
  const caption = ad.ad_creative_link_captions?.[0] ?? "";
  const platforms = ad.publisher_platforms ?? [];
  const isActive = !ad.ad_delivery_stop_time;
  const color = brandColor(ad.page_name);
  const initial = (ad.page_name || "?")[0].toUpperCase();
  const impressions = ad.impressions?.lower_bound;

  return (
    <div style={{
      background: "#111115", border: "1px solid #1e1e23", borderRadius: "12px",
      display: "flex", flexDirection: "column", overflow: "hidden",
      transition: "border-color 0.15s, transform 0.15s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#22c55e40"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1e1e23"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
    >
      {/* Metrics row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem 0", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {impressions && (
            <span style={{ fontSize: "0.7rem", color: "#71717a", display: "flex", alignItems: "center", gap: "0.2rem" }}>
              <span>👁</span> {fmt(impressions)}
            </span>
          )}
          <span style={{ fontSize: "0.7rem", color: "#71717a" }}>
            {days !== null ? `${days}d` : "New"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "1px" }}>
          {[1,2,3,4,5].map(s => (
            <span key={s} style={{ fontSize: "0.65rem", color: s <= rating ? "#22c55e" : "#27272a" }}>★</span>
          ))}
        </div>
      </div>

      {/* Brand row */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.875rem 0.625rem" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#fafafa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {ad.page_name}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#52525b", display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ color: isActive ? "#22c55e" : "#71717a", fontSize: "0.55rem" }}>●</span>
            {formatDate(ad.ad_delivery_start_time)} – {isActive ? "Present" : formatDate(ad.ad_delivery_stop_time)}
            {days !== null && <span style={{ color: "#3f3f46" }}>&nbsp;{days}d</span>}
          </div>
        </div>
        {/* Platform badges */}
        <div style={{ display: "flex", gap: "0.2rem" }}>
          {platforms.includes("facebook") && <span style={{ fontSize: "0.6rem", padding: "1px 5px", borderRadius: "3px", background: "#1d4ed820", color: "#93c5fd", border: "1px solid #1d4ed840" }}>FB</span>}
          {platforms.includes("instagram") && <span style={{ fontSize: "0.6rem", padding: "1px 5px", borderRadius: "3px", background: "#7c3aed20", color: "#c4b5fd", border: "1px solid #7c3aed40" }}>IG</span>}
        </div>
      </div>

      {/* Creative area */}
      <div style={{
        margin: "0 0.875rem", borderRadius: "8px", background: "#0d0d10",
        border: "1px solid #1e1e23", padding: "1rem", minHeight: "140px",
        display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "0.5rem",
        position: "relative", overflow: "hidden",
      }}>
        {/* Subtle gradient accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${color}80, transparent)` }} />

        {title && (
          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "#e4e4e7", lineHeight: 1.4 }}>
            {title.length > 80 ? title.slice(0, 80) + "…" : title}
          </p>
        )}

        {body && (
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#71717a", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {body}
          </p>
        )}

        {!title && !body && (
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#3f3f46", fontStyle: "italic" }}>No copy preview</p>
        )}

        {caption && (
          <div style={{ fontSize: "0.65rem", color: "#22c55e", background: "#22c55e10", padding: "0.2rem 0.5rem", borderRadius: "4px", alignSelf: "flex-start", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {caption}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div style={{ display: "flex", gap: "0.5rem", padding: "0.75rem 0.875rem", marginTop: "auto" }}>
        {ad.ad_snapshot_url ? (
          <a href={ad.ad_snapshot_url} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, textAlign: "center", fontSize: "0.75rem", color: "#a1a1aa", padding: "0.4rem 0", border: "1px solid #27272a", borderRadius: "6px", textDecoration: "none", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#3f3f46"; (e.currentTarget as HTMLElement).style.color = "#fafafa"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#27272a"; (e.currentTarget as HTMLElement).style.color = "#a1a1aa"; }}
          >
            Details ↗
          </a>
        ) : <div style={{ flex: 1 }} />}

        <button onClick={toggle}
          style={{
            flex: 1, fontSize: "0.75rem", fontWeight: 600, padding: "0.4rem 0",
            border: "none", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s",
            background: saved ? "#22c55e" : "#22c55e20",
            color: saved ? "#000" : "#22c55e",
          }}
        >
          {saved ? "★ Saved" : "☆ Save"}
        </button>
      </div>
    </div>
  );
}
