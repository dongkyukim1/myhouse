"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Swal from 'sweetalert2';

type VideoSummary = {
  video: {
    videoId: string;
    title: string;
    description: string;
    publishedAt: string;
    duration: string;
    viewCount: string;
    likeCount: string;
    thumbnails: any;
  };
  summary: string;
  keywords: string[];
  category: string;
  captions: number;
  hasSubtitles: boolean;
};

export default function VideoSummaryPage() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("videoId");
  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoId) {
      loadVideoSummary(videoId);
    }
  }, [videoId]);

  async function loadVideoSummary(id: string) {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/video-summary?videoId=${id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "요약 로드 실패");
      }
      
      setSummary(data);
    } catch (err: any) {
      const errorMessage = err.message || "요약을 불러오는데 실패했습니다";
      setError(errorMessage);
      
      // 에러 알림
      await Swal.fire({
        title: '📹 영상 로드 실패',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: '확인',
        confirmButtonColor: '#ef4444',
        background: '#fff',
        customClass: {
          popup: 'swal-popup',
          confirmButton: 'swal-error-btn'
        }
      });
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  function formatNumber(num: string): string {
    return parseInt(num).toLocaleString();
  }

  if (loading) {
    return (
      <AuthGuard>
        <main style={{ 
          padding: "20px", 
          maxWidth: "1200px", 
          margin: "0 auto",
          fontFamily: "Pretendard-Regular"
        }}>
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          fontSize: "18px",
          color: "#666"
        }}>
          영상을 분석하고 있습니다...
        </div>
      </main>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <main style={{ 
          padding: "20px", 
          maxWidth: "1200px", 
          margin: "0 auto",
          fontFamily: "Pretendard-Regular"
        }}>
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          fontSize: "18px",
          color: "#f55"
        }}>
          {error}
        </div>
      </main>
      </AuthGuard>
    );
  }

  if (!videoId) {
    return (
      <AuthGuard>
        <main style={{ 
          padding: "20px", 
          maxWidth: "1200px", 
          margin: "0 auto",
          fontFamily: "Pretendard-Regular"
        }}>
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          fontSize: "18px",
          color: "#666"
        }}>
          영상 ID가 필요합니다.
        </div>
      </main>
      </AuthGuard>
    );
  }

  if (!summary) {
    return (
      <AuthGuard>
        <main style={{ 
          padding: "20px", 
          maxWidth: "1200px", 
          margin: "0 auto",
          fontFamily: "Pretendard-Regular"
        }}>
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          fontSize: "18px",
          color: "#666"
        }}>
          요약 정보를 찾을 수 없습니다.
        </div>
      </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <main style={{ 
        padding: "20px", 
        maxWidth: "1200px", 
        margin: "0 auto",
        fontFamily: "Pretendard-Regular",
        lineHeight: "1.6"
      }}>
      {/* 헤더 */}
      <div className="summary-page-header" style={{ 
        marginBottom: "30px",
        paddingBottom: "20px",
        borderBottom: "1px solid #eee"
      }}>
        <h1 style={{ 
          fontSize: "32px", 
          fontFamily: "Pretendard-Bold",
          margin: "0 0 10px 0",
          color: "#222"
        }}>
          영상 요약
        </h1>
        <p style={{ 
          color: "#666", 
          margin: 0,
          fontSize: "16px"
        }}>
          AI가 분석한 영상 요약 정보입니다
        </p>
      </div>

      {/* 영상 정보 카드 */}
      <div className="summary-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "30px",
        marginBottom: "40px"
      }}>
        {/* 썸네일 및 기본 정보 */}
        <div className="summary-card" style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          border: "1px solid #f0f0f0"
        }}>
          <img 
            src={summary.video.thumbnails?.maxres?.url || summary.video.thumbnails?.high?.url || summary.video.thumbnails?.medium?.url}
            alt={summary.video.title}
            style={{
              width: "100%",
              borderRadius: "8px",
              marginBottom: "16px"
            }}
          />
          <h2 style={{
            fontSize: "20px",
            fontFamily: "Pretendard-SemiBold",
            margin: "0 0 12px 0",
            color: "#222",
            lineHeight: "1.4"
          }}>
            {summary.video.title}
          </h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            fontSize: "14px",
            color: "#666"
          }}>
            <div>
              <strong>재생시간:</strong><br />
              {formatDuration(summary.video.duration)}
            </div>
            <div>
              <strong>조회수:</strong><br />
              {formatNumber(summary.video.viewCount)}회
            </div>
            <div>
              <strong>좋아요:</strong><br />
              {formatNumber(summary.video.likeCount)}개
            </div>
            <div>
              <strong>업로드:</strong><br />
              {new Date(summary.video.publishedAt).toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>

        {/* 분석 정보 */}
        <div className="summary-card" style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          border: "1px solid #f0f0f0"
        }}>
          <h3 style={{
            fontSize: "18px",
            fontFamily: "Pretendard-SemiBold",
            margin: "0 0 16px 0",
            color: "#222"
          }}>
            분석 결과
          </h3>

          {/* 카테고리 */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ 
              fontSize: "14px", 
              color: "#666", 
              marginBottom: "6px",
              fontFamily: "Pretendard-Medium"
            }}>
              카테고리
            </div>
            <span style={{
              display: "inline-block",
              padding: "6px 12px",
              backgroundColor: "#e3f2fd",
              color: "#1565c0",
              borderRadius: "20px",
              fontSize: "14px",
              fontFamily: "Pretendard-Medium"
            }}>
              {summary.category}
            </span>
          </div>

          {/* 키워드 */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ 
              fontSize: "14px", 
              color: "#666", 
              marginBottom: "8px",
              fontFamily: "Pretendard-Medium"
            }}>
              주요 키워드
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {summary.keywords.map((keyword, index) => (
                <span key={index} style={{
                  padding: "4px 10px",
                  backgroundColor: "#f5f5f5",
                  color: "#555",
                  borderRadius: "16px",
                  fontSize: "13px",
                  fontFamily: "Pretendard-Regular"
                }}>
                  {keyword}
                </span>
              ))}
              {summary.keywords.length === 0 && (
                <span style={{ color: "#999", fontSize: "13px" }}>
                  키워드가 없습니다
                </span>
              )}
            </div>
          </div>

          {/* 자막 정보 */}
          <div>
            <div style={{ 
              fontSize: "14px", 
              color: "#666", 
              marginBottom: "6px",
              fontFamily: "Pretendard-Medium"
            }}>
              자막 정보
            </div>
            <div style={{
              padding: "8px 12px",
              backgroundColor: summary.hasSubtitles ? "#e8f5e8" : "#fff3e0",
              color: summary.hasSubtitles ? "#2e7d32" : "#ef6c00",
              borderRadius: "6px",
              fontSize: "14px"
            }}>
              {summary.hasSubtitles 
                ? `자막 사용 가능 (${summary.captions}개)` 
                : "자막 없음"
              }
            </div>
          </div>
        </div>
      </div>

      {/* 요약 내용 */}
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        padding: "32px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        border: "1px solid #f0f0f0",
        marginBottom: "30px"
      }}>
        <h3 style={{
          fontSize: "24px",
          fontFamily: "Pretendard-SemiBold",
          margin: "0 0 20px 0",
          color: "#222"
        }}>
          📝 AI 요약
        </h3>
        <p style={{
          fontSize: "16px",
          lineHeight: "1.8",
          color: "#444",
          margin: 0,
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          borderLeft: "4px solid #007bff"
        }}>
          {summary.summary}
        </p>
      </div>

      {/* 원본 설명 */}
      {summary.video.description && (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          border: "1px solid #f0f0f0"
        }}>
          <h3 style={{
            fontSize: "20px",
            fontFamily: "Pretendard-SemiBold",
            margin: "0 0 20px 0",
            color: "#222"
          }}>
            📄 원본 설명
          </h3>
          <div style={{
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#555",
            whiteSpace: "pre-wrap",
            maxHeight: "300px",
            overflow: "auto",
            padding: "16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px"
          }}>
            {summary.video.description}
          </div>
        </div>
      )}

      {/* YouTube 링크 */}
      <div style={{
        textAlign: "center",
        marginTop: "40px",
        paddingTop: "30px",
        borderTop: "1px solid #eee"
      }}>
        <a 
          href={`https://www.youtube.com/watch?v=${summary.video.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: "#ff0000",
            color: "white",
            textDecoration: "none",
            borderRadius: "6px",
            fontFamily: "Pretendard-Medium",
            fontSize: "16px",
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#cc0000"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#ff0000"}
        >
          🎬 YouTube에서 보기
        </a>
      </div>
    </main>
    </AuthGuard>
  );
}
