"use client";

import React from "react";

type Props = {
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  onClick?: () => void;
  onSummaryClick?: (videoId: string) => void;
};

export default function VideoCard({ videoId, title, thumbnailUrl, onClick, onSummaryClick }: Props) {
  return (
    <div
      className="video-card"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(20,20,20,0.8)",
        cursor: "pointer",
        textAlign: "left",
        position: "relative",
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div 
        className="video-thumbnail" 
        onClick={onClick}
        style={{ 
          position: "relative", 
          width: "100%", 
          height: "160px", 
          overflow: "hidden", 
          backgroundColor: "#222",
          cursor: "pointer"
        }}
      >
        <img
          src={thumbnailUrl}
          alt={title}
          style={{ 
            width: "100%", 
            height: "100%", 
            objectFit: "cover", 
            objectPosition: "center",
            display: "block",
            transition: "transform 0.3s ease"
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.8))" }} />
        {!thumbnailUrl && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#666",
            fontSize: 12
          }}>
            썸네일 없음
          </div>
        )}
      </div>
      <div style={{ padding: 12 }}>
        <div 
          onClick={onClick}
          style={{ 
            color: "#fff", 
            fontFamily: "Suit",
            fontWeight: 600, 
            fontSize: 14, 
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minHeight: "2.8em",
            wordBreak: "keep-all",
            marginBottom: "8px",
            cursor: "pointer"
          }}
        >
          {title}
        </div>
        
        {onSummaryClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSummaryClick(videoId);
            }}
            style={{
              width: "100%",
              padding: "6px 12px",
              backgroundColor: "rgba(0, 123, 255, 0.8)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: "Suit",
              fontWeight: 500,
              cursor: "pointer",
              transition: "background-color 0.2s",
              backdropFilter: "blur(10px)"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 123, 255, 1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 123, 255, 0.8)";
            }}
          >
            📝 AI 요약 보기
          </button>
        )}
      </div>
    </div>
  );
}
