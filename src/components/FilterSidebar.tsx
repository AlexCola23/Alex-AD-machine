"use client";
import { useState } from "react";
import { Filters } from "@/lib/types";

const COUNTRIES = [
  { value: "US", flag: "🇺🇸", label: "United States" },
  { value: "GB", flag: "🇬🇧", label: "United Kingdom" },
  { value: "CA", flag: "🇨🇦", label: "Canada" },
  { value: "AU", flag: "🇦🇺", label: "Australia" },
  { value: "DE", flag: "🇩🇪", label: "Germany" },
  { value: "FR", flag: "🇫🇷", label: "France" },
  { value: "NL", flag: "🇳🇱", label: "Netherlands" },
  { value: "IT", flag: "🇮🇹", label: "Italy" },
  { value: "ES", flag: "🇪🇸", label: "Spain" },
  { value: "SE", flag: "🇸🇪", label: "Sweden" },
];

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ borderBottom: "1px solid #1e1e23" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "0.75rem 1rem", background: "none",
          border: "none", color: "#e4e4e7", fontSize: "0.8rem", fontWeight: 600,
          cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em",
        }}
      >
        {title}
        <span style={{ color: "#52525b", fontSize: "0.75rem" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div style={{ padding: "0 1rem 0.75rem" }}>{children}</div>}
    </div>
  );
}

function Checkbox({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.25rem 0", fontSize: "0.8rem", color: checked ? "#e4e4e7" : "#71717a" }}>
      <span style={{
        width: "15px", height: "15px", borderRadius: "3px", flexShrink: 0,
        background: checked ? "#22c55e" : "transparent",
        border: checked ? "none" : "1px solid #3f3f46",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {checked && <span style={{ color: "#000", fontSize: "10px", fontWeight: 700 }}>✓</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      {label}
    </label>
  );
}

function Radio({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.25rem 0", fontSize: "0.8rem", color: checked ? "#e4e4e7" : "#71717a" }}>
      <span style={{
        width: "15px", height: "15px", borderRadius: "50%", flexShrink: 0,
        background: checked ? "#22c55e" : "transparent",
        border: checked ? "none" : "1px solid #3f3f46",
      }} />
      <input type="radio" checked={checked} onChange={onChange} style={{ display: "none" }} />
      {label}
    </label>
  );
}

export default function FilterSidebar({ filters, onChange }: Props) {
  const [countrySearch, setCountrySearch] = useState("");

  const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

  const toggleCountry = (v: string) => {
    const next = filters.countries.includes(v)
      ? filters.countries.filter((c) => c !== v)
      : [...filters.countries, v];
    set({ countries: next.length ? next : [v] });
  };

  const togglePlatform = (v: string) => {
    const next = filters.platforms.includes(v)
      ? filters.platforms.filter((p) => p !== v)
      : [...filters.platforms, v];
    set({ platforms: next });
  };

  const filteredCountries = COUNTRIES.filter((c) =>
    c.label.toLowerCase().includes(countrySearch.toLowerCase())
  );

  return (
    <aside style={{
      width: "220px", flexShrink: 0, background: "#111115",
      border: "1px solid #1e1e23", borderRadius: "10px",
      height: "fit-content", position: "sticky", top: "72px",
      overflowY: "auto", maxHeight: "calc(100vh - 88px)",
    }}>
      {/* Header */}
      <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid #1e1e23", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fafafa" }}>Filters</span>
        <button onClick={() => onChange({ countries: ["US"], status: "ACTIVE", platforms: [], runTime: 0, sortBy: "running" })}
          style={{ fontSize: "0.7rem", color: "#22c55e", background: "none", border: "none", cursor: "pointer" }}>
          Reset
        </button>
      </div>

      {/* Country */}
      <Section title="Country">
        <input
          type="text" placeholder="Search..." value={countrySearch}
          onChange={(e) => setCountrySearch(e.target.value)}
          style={{ width: "100%", background: "#18181b", border: "1px solid #27272a", borderRadius: "6px", color: "#fafafa", fontSize: "0.75rem", padding: "0.375rem 0.5rem", outline: "none", marginBottom: "0.5rem" }}
        />
        {filteredCountries.map((c) => (
          <Checkbox key={c.value} checked={filters.countries.includes(c.value)} label={`${c.flag} ${c.label}`} onChange={() => toggleCountry(c.value)} />
        ))}
      </Section>

      {/* Status */}
      <Section title="Status">
        {[["ACTIVE", "Active only"], ["ALL", "Active + Inactive"], ["INACTIVE", "Inactive only"]].map(([v, l]) => (
          <Radio key={v} checked={filters.status === v} label={l} onChange={() => set({ status: v })} />
        ))}
      </Section>

      {/* Platform */}
      <Section title="Platform">
        <Checkbox checked={filters.platforms.includes("facebook")} label="Facebook" onChange={() => togglePlatform("facebook")} />
        <Checkbox checked={filters.platforms.includes("instagram")} label="Instagram" onChange={() => togglePlatform("instagram")} />
      </Section>

      {/* Run Time */}
      <Section title="Run Time">
        {[[0, "Any"], [7, "7+ days"], [30, "30+ days"], [60, "60+ days"], [90, "90+ days"]].map(([v, l]) => (
          <Radio key={v} checked={filters.runTime === v} label={l as string} onChange={() => set({ runTime: v as number })} />
        ))}
      </Section>

      {/* Sort */}
      <Section title="Sort By">
        <Radio checked={filters.sortBy === "running"} label="Longest running first" onChange={() => set({ sortBy: "running" })} />
        <Radio checked={filters.sortBy === "recent"} label="Most recent first" onChange={() => set({ sortBy: "recent" })} />
      </Section>
    </aside>
  );
}
