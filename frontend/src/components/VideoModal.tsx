"use client";

import React, { useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  videoId?: string;
  title?: string;
};

export default function VideoModal({ open, onClose, videoId, title }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !videoId) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(960px, 100%)", background: "#000", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ position: "relative", paddingTop: "56.25%" }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
        <div style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "#fff", fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} style={{ color: "#fff", background: "transparent", border: 0, fontSize: 16 }}>닫기</button>
        </div>
      </div>
    </div>
  );
}
