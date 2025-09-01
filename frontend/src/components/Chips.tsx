"use client";

import React from "react";

type Chip = { key: string; label: string };

export default function Chips({ items, value, onChange }: { items: Chip[]; value: string; onChange: (v: string) => void; }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>
      {items.map((it) => (
        <button key={it.key} onClick={() => onChange(it.key)}
          style={{
            borderRadius: 999,
            padding: "8px 12px",
            border: value === it.key ? "1px solid #e50914" : "1px solid #444",
            background: value === it.key ? "#290507" : "#141414",
            color: value === it.key ? "#fff" : "#ddd",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13
          }}
        >{it.label}</button>
      ))}
    </div>
  );
}
