"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/search", label: "Search Ads" },
  { href: "/spy", label: "Competitor Spy" },
  { href: "/swipe", label: "Swipe File" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <nav
      style={{
        background: "#111115",
        borderBottom: "1px solid #27272a",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: "80rem",
          margin: "0 auto",
          padding: "0 1rem",
          display: "flex",
          alignItems: "center",
          gap: "2rem",
          height: "56px",
        }}
      >
        {/* Logo */}
        <Link href="/search" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "#3b82f6",
              letterSpacing: "-0.02em",
            }}
          >
            AdVault
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", gap: "0.25rem" }}>
          {links.map(({ href, label }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "0.375rem 0.875rem",
                  borderRadius: "6px",
                  fontSize: "0.875rem",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#fafafa" : "#a1a1aa",
                  background: active ? "#27272a" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
