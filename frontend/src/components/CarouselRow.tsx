"use client";

import React, { useRef } from "react";

export default function CarouselRow({ title, children }: { title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  function page(delta: number) {
    const el = ref.current;
    if (!el) return;
    
    // 반응형 카드 폭 계산
    const screenWidth = window.innerWidth;
    let cardWidth = 280 + 16; // 기본: 카드 폭 + 갭
    if (screenWidth <= 480) {
      cardWidth = 200 + 16;
    } else if (screenWidth <= 768) {
      cardWidth = 240 + 16;
    }
    
    const cardsPerPage = Math.floor(el.clientWidth / cardWidth) || 1;
    const step = cardWidth * cardsPerPage;
    el.scrollBy({ left: step * delta, behavior: "smooth" });
  }

  return (
    <section style={{ marginBottom: 32, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 className="black-han-sans-regular" style={{ fontSize: 24, fontWeight: 400, color: "#fff", margin: 0 }}>{title}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => page(-1)} style={btn} aria-label="이전">◀</button>
          <button onClick={() => page(1)} style={btn} aria-label="다음">▶</button>
        </div>
      </div>

      <div style={edgeLeft} />
      <div style={edgeRight} />

      {/* 뷰포트: 스크롤은 유지하되 스크롤바는 숨김 */}
      <div
        ref={ref}
        style={{
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none" as any,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            paddingBottom: 6,
            width: "fit-content",
            minWidth: "100%",
          }}
        >
          {React.Children.map(children, (child, i) => (
            <div key={i} className="carousel-item" style={item}>
              {child}
            </div>
          ))}
        </div>
      </div>
      <style>
        {`
        div[ref]::-webkit-scrollbar { display: none; }
      `}
      </style>
    </section>
  );
}

const btn: React.CSSProperties = {
  background: "rgba(20,20,20,0.9)",
  color: "#fff",
  border: "1px solid #333",
  borderRadius: 12,
  padding: "8px 12px",
  cursor: "pointer",
  zIndex: 2
};

const edgeLeft: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 34,
  bottom: 6,
  width: 40,
  background: "linear-gradient(90deg, rgba(0,0,0,0.9), rgba(0,0,0,0))",
  pointerEvents: "none",
  zIndex: 1
};

const edgeRight: React.CSSProperties = {
  position: "absolute",
  right: 0,
  top: 34,
  bottom: 6,
  width: 40,
  background: "linear-gradient(270deg, rgba(0,0,0,0.9), rgba(0,0,0,0))",
  pointerEvents: "none",
  zIndex: 1
};

// 카드 크기를 고정하여 일관된 레이아웃 제공 (반응형 고려)
const item: React.CSSProperties = {
  flex: "0 0 280px", // 고정 폭으로 일관성 확보
  minWidth: "280px",
  height: "240px", // 고정 높이로 균등한 카드 크기
};
