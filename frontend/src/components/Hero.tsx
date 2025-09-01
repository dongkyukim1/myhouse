"use client";

import React from "react";

type Props = {
  title?: string;
  description?: string;
  backgroundUrl?: string;
  onPlay?: () => void;
  videoId?: string;
  playing?: boolean;
};

export default function Hero({ title, description, backgroundUrl, onPlay, videoId, playing }: Props) {
  return (
    <section id="hero-top" style={{ position: "relative", height: 420, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
      {/* 재생 중이면 인라인 플레이어 */}
      {playing && videoId ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      ) : (
        <>
          <div style={{ position: "absolute", inset: 0, background: "#111" }} />
          {backgroundUrl && (
            <img src={backgroundUrl} alt={title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6)" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.0) 100%)" }} />
          <div style={{ position: "absolute", left: 24, bottom: 24, right: 24, maxWidth: 720 }}>
            <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 32, margin: 0, marginBottom: 8 }}>{title}</h1>
            <p style={{ color: "#ddd", fontSize: 14, lineHeight: 1.6, margin: 0, marginBottom: 14, maxHeight: 68, overflow: "hidden" }}>{description}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onPlay} style={primaryBtn}>▶ 재생</button>
              <button style={secondaryBtn}>자세히</button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

const primaryBtn: React.CSSProperties = {
  background: "#e50914",
  color: "#fff",
  border: 0,
  padding: "10px 16px",
  borderRadius: 8,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.25)",
  padding: "10px 16px",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
};
