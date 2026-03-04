"use client";
import { useState, useEffect } from "react";
import { Ad } from "@/lib/types";
import { saveAd, removeAd, isSaved } from "@/lib/swipeStorage";

function daysRunning(start?: string): number | null {
  if (!start) return null;
  const ms = Date.now() - new Date(start).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function runningColor(days: number | null): string {
  if (days === null) return "#52525b";
  if (days >= 60) return "#22c55e";
  if (days >= 30) return "#f59e0b";
  return "#71717a";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Props {
  ad: Ad;
  onRemove?: () => void;
}

export default function AdCard({ ad, onRemove }: Props) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isSaved(ad.id));
  }, [ad.id]);

  const toggle = () => {
    if (saved) {
      removeAd(ad.id);
      setSaved(false);
      onRemove?.();
    } else {
      saveAd(ad);
      setSaved(true);
    }
  };

  const days = daysRunning(ad.ad_delivery_start_time);
  const color = runningColor(days);
  const body = ad.ad_creative_bodies?.[0] ?? "";
  const title = ad.ad_creative_link_titles?.[0] ?? "";
  const platforms = ad.publisher_platforms ?? [];
  const isActive = !ad.ad_delivery_stop_time;

  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: "10px",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = "#3f3f46")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.borderColor = "#27272a")
      }
    >
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "#fafafa",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {ad.page_name || "Unknown Advertiser"}
          </span>
          {/* Platform badges */}
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {platforms.includes("facebook") && (
              <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: "4px", background: "#1d4ed8", color: "#bfdbfe", fontWeight: 600 }}>
                FB
              </span>
            )}
            {platforms.includes("instagram") && (
              <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: "4px", background: "#7c3aed", color: "#ddd6fe", fontWeight: 600 }}>
                IG
              </span>
            )}
            {isActive && (
              <span style={{ fontSize: "0.65rem", padding: "1px 6px", borderRadius: "4px", background: "#14532d", color: "#86efac", fontWeight: 600 }}>
                ACTIVE
              </span>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={toggle}
          title={saved ? "Remove from swipe file" : "Save to swipe file"}
          style={{
            background: saved ? "#14532d" : "#27272a",
            border: "none",
            borderRadius: "6px",
            color: saved ? "#22c55e" : "#a1a1aa",
            cursor: "pointer",
            fontSize: "1rem",
            padding: "0.375rem 0.5rem",
            lineHeight: 1,
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          {saved ? "★" : "☆"}
        </button>
      </div>

      {/* Ad title */}
      {title && (
        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#d4d4d8" }}>
          {title}
        </p>
      )}

      {/* Ad body */}
      {body ? (
        <p
          style={{
            margin: 0,
            fontSize: "0.8rem",
            color: "#a1a1aa",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {body}
        </p>
      ) : (
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#52525b", fontStyle: "italic" }}>
          No copy preview available
        </p>
      )}

      {/* Running time */}
      <div
        style={{
          borderTop: "1px solid #27272a",
          paddingTop: "0.625rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          {days !== null ? (
            <span style={{ fontSize: "0.8rem", color, fontWeight: 600 }}>
              {days >= 60 ? "🔥 " : ""}Running {days}d
            </span>
          ) : (
            <span style={{ fontSize: "0.8rem", color: "#52525b" }}>
              Started {formatDate(ad.ad_delivery_start_time)}
            </span>
          )}
          <div style={{ fontSize: "0.7rem", color: "#52525b", marginTop: "1px" }}>
            Since {formatDate(ad.ad_delivery_start_time)}
          </div>
        </div>

        {ad.ad_snapshot_url && (
          <a
            href={ad.ad_snapshot_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "0.75rem",
              color: "#3b82f6",
              textDecoration: "none",
              padding: "0.25rem 0.625rem",
              border: "1px solid #1d4ed8",
              borderRadius: "5px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "#1e3a5f")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "transparent")
            }
          >
            View Ad ↗
          </a>
        )}
      </div>
    </div>
  );
}
