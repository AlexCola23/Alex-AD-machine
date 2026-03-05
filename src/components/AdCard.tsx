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
  if (!d) return "?";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

interface Props { ad: Ad; onRemove?: () => void; }

export default function AdCard({ ad, onRemove }: Props) {
  const [saved, setSaved] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(true);

  useEffect(() => { setSaved(isSaved(ad.id)); }, [ad.id]);

  useEffect(() => {
    if (!ad.id) { setImgLoading(false); return; }
    // Pass the full snapshot URL so the proxy uses it directly (better token handling)
    const param = ad.ad_snapshot_url
      ? `snapUrl=${encodeURIComponent(ad.ad_snapshot_url)}`
      : `id=${ad.id}`;
    fetch(`/api/snapshot?${param}`)
      .then(r => r.json())
      .then(d => { setImgUrl(d.imageUrl ?? null); setImgLoading(false); })
      .catch(() => setImgLoading(false));
  }, [ad.id, ad.ad_snapshot_url]);

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
  const color = brandColor(ad.page_name ?? "");
  const initial = (ad.page_name || "?")[0].toUpperCase();
  const impressions = ad.impressions?.lower_bound;
  const spend = ad.spend?.lower_bound;

  return (
    <div
      style={{
        background: "#111115", border: "1px solid #1e1e23", borderRadius: "12px",
        display: "flex", flexDirection: "column", overflow: "hidden",
        transition: "border-color 0.15s, transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#22c55e50"; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#1e1e23"; el.style.transform = "none"; el.style.boxShadow = "none"; }}
    >

      {/* ── CREATIVE AREA ── */}
      <div style={{ position: "relative", width: "100%", height: "260px", background: "#0a0a0d", overflow: "hidden", flexShrink: 0 }}>

        {/* Skeleton */}
        {imgLoading && (
          <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(90deg, #0d0d10 25%, #1a1a1f 50%, #0d0d10 75%)", backgroundSize: "200% 100%", animation: "skeleton 1.4s ease infinite" }} />
        )}

        {/* Real image from snapshot proxy */}
        {!imgLoading && imgUrl && (
          <img
            src={imgUrl} alt="Ad creative"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={() => setImgUrl(null)}
          />
        )}

        {/* Styled text fallback — looks like an actual Facebook post */}
        {!imgLoading && !imgUrl && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Color accent bar */}
            <div style={{ height: "3px", background: `linear-gradient(90deg, ${color}, ${color}44)`, flexShrink: 0 }} />
            {/* Post body */}
            <div style={{ flex: 1, padding: "1rem", display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.5rem", overflow: "hidden" }}>
              {body && (
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#d4d4d8", lineHeight: 1.55,
                  display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {body}
                </p>
              )}
              {!body && title && (
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#e4e4e7", lineHeight: 1.4 }}>
                  {title.length > 100 ? title.slice(0, 100) + "…" : title}
                </p>
              )}
              {!body && !title && (
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#52525b", fontStyle: "italic", textAlign: "center" }}>Preview not available</p>
              )}
            </div>
            {/* CTA bar at bottom of creative */}
            {(title || caption) && (
              <div style={{ padding: "0.5rem 0.875rem", background: "#0d0d10", borderTop: "1px solid #1e1e23", flexShrink: 0 }}>
                {title && <p style={{ margin: "0 0 1px", fontSize: "0.72rem", fontWeight: 700, color: "#e4e4e7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>}
                {caption && <p style={{ margin: 0, fontSize: "0.65rem", color: "#52525b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{caption}</p>}
              </div>
            )}
          </div>
        )}

        {/* ── OVERLAY BADGES ── */}
        {/* Top-left: run time */}
        {days !== null && (
          <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem", zIndex: 3, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", borderRadius: "6px", padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700, color: days >= 30 ? "#22c55e" : "#a1a1aa" }}>
            🕒 {days}d
          </div>
        )}

        {/* Top-right: platform badges */}
        <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", zIndex: 3, display: "flex", gap: "0.2rem" }}>
          {platforms.includes("facebook") && <span style={{ fontSize: "0.6rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(29,78,216,0.9)", color: "#bfdbfe", fontWeight: 600 }}>FB</span>}
          {platforms.includes("instagram") && <span style={{ fontSize: "0.6rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(124,58,237,0.9)", color: "#ddd6fe", fontWeight: 600 }}>IG</span>}
        </div>

        {/* Bottom gradient + brand overlay */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)", padding: "2rem 0.75rem 0.55rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#fafafa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ad.page_name}</div>
              <div style={{ fontSize: "0.6rem", color: "#a1a1aa", display: "flex", alignItems: "center", gap: "3px" }}>
                <span style={{ color: isActive ? "#22c55e" : "#71717a", fontSize: "0.5rem" }}>●</span>
                {formatDate(ad.ad_delivery_start_time)} – {isActive ? "Now" : formatDate(ad.ad_delivery_stop_time)}
              </div>
            </div>
            <div style={{ display: "flex", gap: "1px", flexShrink: 0 }}>
              {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: "0.58rem", color: s <= rating ? "#22c55e" : "#3f3f46" }}>★</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* ── AD COPY ── */}
      <div style={{ padding: "0.6rem 0.875rem", flex: 1 }}>
        {title && (
          <p style={{ margin: "0 0 0.2rem", fontSize: "0.77rem", fontWeight: 700, color: "#e4e4e7", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</p>
        )}
        {body && (
          <p style={{ margin: 0, fontSize: "0.71rem", color: "#71717a", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{body}</p>
        )}
        {!title && !body && <p style={{ margin: 0, fontSize: "0.71rem", color: "#3f3f46", fontStyle: "italic" }}>No ad copy</p>}

        {/* Stats pills */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
          {impressions && <span style={{ fontSize: "0.64rem", color: "#52525b" }}>👁 {fmt(impressions)}</span>}
          {spend && <span style={{ fontSize: "0.64rem", color: "#52525b" }}>💸 ${fmt(spend)}+</span>}
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      <div style={{ display: "flex", gap: "0.5rem", padding: "0 0.875rem 0.75rem" }}>
        {ad.ad_snapshot_url ? (
          <a href={ad.ad_snapshot_url} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, textAlign: "center", fontSize: "0.72rem", fontWeight: 500, color: "#a1a1aa", padding: "0.45rem 0", border: "1px solid #27272a", borderRadius: "7px", textDecoration: "none", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#52525b"; (e.currentTarget as HTMLElement).style.color = "#fafafa"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#27272a"; (e.currentTarget as HTMLElement).style.color = "#a1a1aa"; }}>
            View Ad ↗
          </a>
        ) : <div style={{ flex: 1 }} />}
        <button onClick={toggle}
          style={{ flex: 1, fontSize: "0.72rem", fontWeight: 700, padding: "0.45rem 0", border: "none", borderRadius: "7px", cursor: "pointer", transition: "all 0.15s", background: saved ? "#22c55e" : "#22c55e18", color: saved ? "#000" : "#22c55e" }}>
          {saved ? "★ Saved" : "☆ Save"}
        </button>
      </div>
    </div>
  );
}
