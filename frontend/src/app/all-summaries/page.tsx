"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";
import Swal from 'sweetalert2';
import { InlineLoading } from "@/components/LoadingAnimation";

type Video = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnails?: any;
};

type VideoSummary = {
  videoId: string;
  summary: string;
  keywords: string[];
  category: string;
  video: {
    title: string;
    publishedAt: string;
    viewCount: string;
    duration: string;
    thumbnails: any;
  };
};

const CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "youth", label: "청년" },
  { key: "newlywed", label: "신혼" },
  { key: "lhsh", label: "LH/SH" },
  { key: "announce", label: "공고/모집" },
];

export default function AllSummariesPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [summaries, setSummaries] = useState<VideoSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    loadVideos();
  }, []);

  async function loadVideos() {
    try {
      setLoading(true);
      setError(null);
      // 임시로 handle 사용하되, 실제 채널 ID를 찾아서 교체 예정  
      const handle = "%40%EC%95%84%EC%98%81%EC%9D%B4%EB%84%A4%ED%96%89%EB%B3%B5%EC%A3%BC%ED%83%9D";
      const res = await fetch(`/api/videos?handle=${handle}`);
      const data = await res.json();
      
      if (!res.ok) {
        // 할당량 초과 에러 특별 처리
        if (data.code === "QUOTA_EXCEEDED" || res.status === 429) {
          throw new Error("🚫 YouTube API 일일 할당량이 초과되었습니다.\n내일 다시 시도해주세요.");
        }
        throw new Error(data.message || `API 오류: ${res.status}`);
      }
      
      setVideos(data.items || []);
      
      // 영상들의 요약을 순차적으로 로드
      if (data.items && data.items.length > 0) {
        await loadAllSummaries(data.items);
      } else {
        const errorMessage = "영상을 찾을 수 없습니다. YouTube 채널을 확인해주세요.";
        setError(errorMessage);
        
        await Swal.fire({
          title: '🔍 영상 없음',
          text: errorMessage,
          icon: 'warning',
          confirmButtonText: '확인',
          confirmButtonColor: '#f59e0b',
          background: '#fff',
          customClass: {
            popup: 'swal-popup'
          }
        });
      }
    } catch (e: any) {
      const errorMessage = e?.message || "로드 실패";
      setError(errorMessage);
      
      await Swal.fire({
        title: '❌ 로드 실패',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: '다시 시도',
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

  async function loadAllSummaries(videoList: Video[]) {
    const summaryResults: VideoSummary[] = [];
    const total = Math.min(videoList.length, 10); // 최대 10개만 로드 (할당량 절약)
    
    for (let i = 0; i < total; i++) {
      const video = videoList[i];
      try {
        const response = await fetch(`/api/video-summary?videoId=${video.videoId}`);
        const summaryData = await response.json();
        
        if (response.ok && summaryData.video) {
          summaryResults.push({
            videoId: video.videoId,
            summary: summaryData.summary,
            keywords: summaryData.keywords,
            category: summaryData.category,
            video: summaryData.video
          });
        }
      } catch (error) {
        console.error(`Failed to load summary for ${video.videoId}:`, error);
      }
      
      setLoadingProgress(Math.round(((i + 1) / total) * 100));
      setSummaries([...summaryResults]);
    }
  }

  const filteredSummaries = summaries.filter(summary => {
    if (category === "all") return true;
    
    const categoryMap: Record<string, string[]> = {
      youth: ["청년"],
      newlywed: ["신혼"],
      lhsh: ["LH/SH"],
      announce: ["공고/모집"]
    };
    
    const targetCategories = categoryMap[category] || [];
    return targetCategories.some(cat => 
      summary.category.includes(cat) || 
      summary.keywords.some(keyword => keyword.includes(cat))
    );
  });

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

  return (
    <AuthGuard>
      <main style={{ 
      padding: "20px", 
      maxWidth: "1400px", 
      margin: "0 auto",
      fontFamily: "Pretendard-Regular"
    }}>
      {/* 헤더 */}
      <div className="summary-page-header" style={{ 
        marginBottom: "40px",
        paddingBottom: "20px",
        borderBottom: "1px solid #eee"
      }}>
        <h1 style={{ 
          fontSize: "36px", 
          fontFamily: "Pretendard-Bold",
          margin: "0 0 12px 0",
          color: "#ffffff"
        }}>
          전체 영상 AI 요약
        </h1>
        <p style={{ 
          color: "#ffffff", 
          margin: 0,
          fontSize: "18px",
          lineHeight: "1.6"
        }}>
          아영이네행복주택 채널의 모든 영상을 AI가 분석하고 요약했습니다
        </p>
      </div>

      {/* 카테고리 필터 */}
      <div className="category-filters" style={{ 
        marginBottom: "30px",
        display: "flex",
        gap: "12px",
        flexWrap: "wrap"
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            style={{
              padding: "10px 20px",
              borderRadius: "25px",
              border: "2px solid #e0e0e0",
              backgroundColor: category === cat.key ? "#007bff" : "#fff",
              color: category === cat.key ? "#fff" : "#333",
              fontFamily: "Pretendard-Medium",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
              fontWeight: category === cat.key ? 600 : 400
            }}
            onMouseOver={(e) => {
              if (category !== cat.key) {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }
            }}
            onMouseOut={(e) => {
              if (category !== cat.key) {
                e.currentTarget.style.backgroundColor = "#fff";
              }
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          marginBottom: "30px"
        }}>
          <InlineLoading 
            text="영상들을 분석하고 있습니다..." 
            size={100}
          />
          <div style={{
            width: "100%",
            maxWidth: "400px",
            height: "8px",
            backgroundColor: "#e0e0e0",
            borderRadius: "4px",
            margin: "20px auto 10px",
            overflow: "hidden"
          }}>
            <div style={{
              height: "100%",
              backgroundColor: "#007bff",
              borderRadius: "4px",
              width: `${loadingProgress}%`,
              transition: "width 0.3s ease"
            }} />
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            {loadingProgress}% 완료 ({summaries.length}개 영상 분석됨)
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          fontSize: "18px",
          color: "#f55",
          backgroundColor: "#fff5f5",
          borderRadius: "12px",
          border: "1px solid #fecaca",
          marginBottom: "30px"
        }}>
          {error}
        </div>
      )}

      {/* 통계 */}
      {!loading && summaries.length > 0 && (
        <div className="stats-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "40px"
        }}>
          <div style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            textAlign: "center",
            border: "1px solid #f0f0f0"
          }}>
            <div style={{ 
              fontSize: "32px", 
              fontFamily: "Pretendard-Bold",
              color: "#007bff",
              marginBottom: "8px"
            }}>
              {summaries.length}
            </div>
            <div style={{ fontSize: "14px", color: "#666" }}>
              분석된 영상 수
            </div>
          </div>
          <div style={{
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            textAlign: "center",
            border: "1px solid #f0f0f0"
          }}>
            <div style={{ 
              fontSize: "32px", 
              fontFamily: "Pretendard-Bold",
              color: "#28a745",
              marginBottom: "8px"
            }}>
              {filteredSummaries.length}
            </div>
            <div style={{ fontSize: "14px", color: "#666" }}>
              현재 카테고리 영상 수
            </div>
          </div>
        </div>
      )}

      {/* 요약 목록 */}
      <div className="all-summaries-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
        gap: "24px"
      }}>
        {filteredSummaries.map((summary) => (
          <div key={summary.videoId} style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            border: "1px solid #f0f0f0",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
          }}>
            {/* 썸네일과 기본 정보 */}
            <div className="summary-video-info" style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
              <img 
                src={summary.video.thumbnails?.medium?.url || summary.video.thumbnails?.default?.url}
                alt={summary.video.title}
                style={{
                  width: "120px",
                  height: "90px",
                  borderRadius: "8px",
                  objectFit: "cover",
                  flexShrink: 0
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontSize: "16px",
                  fontFamily: "Pretendard-SemiBold",
                  margin: "0 0 8px 0",
                  color: "#222",
                  lineHeight: "1.4",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}>
                  {summary.video.title}
                </h3>
                <div style={{ 
                  fontSize: "12px", 
                  color: "#666",
                  marginBottom: "8px"
                }}>
                  {formatDuration(summary.video.duration)} • {new Date(summary.video.publishedAt).toLocaleDateString('ko-KR')}
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{
                    padding: "2px 8px",
                    backgroundColor: "#e3f2fd",
                    color: "#1565c0",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontFamily: "Pretendard-Medium"
                  }}>
                    {summary.category}
                  </span>
                </div>
              </div>
            </div>

            {/* 키워드 */}
            {summary.keywords.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ 
                  fontSize: "12px", 
                  color: "#666", 
                  marginBottom: "6px",
                  fontFamily: "Pretendard-Medium"
                }}>
                  키워드
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {summary.keywords.map((keyword, index) => (
                    <span key={index} style={{
                      padding: "2px 8px",
                      backgroundColor: "#f5f5f5",
                      color: "#555",
                      borderRadius: "10px",
                      fontSize: "11px"
                    }}>
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 요약 */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ 
                fontSize: "12px", 
                color: "#666", 
                marginBottom: "8px",
                fontFamily: "Pretendard-Medium"
              }}>
                AI 요약
              </div>
              <p style={{
                fontSize: "14px",
                lineHeight: "1.6",
                color: "#444",
                margin: 0,
                padding: "12px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                borderLeft: "3px solid #007bff"
              }}>
                {summary.summary}
              </p>
            </div>

            {/* 액션 버튼들 */}
            <div style={{ 
              display: "flex", 
              gap: "8px",
              justifyContent: "space-between"
            }}>
              <Link 
                href={`/video-summary?videoId=${summary.videoId}`}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontFamily: "Pretendard-Medium",
                  textAlign: "center",
                  transition: "background-color 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#0056b3"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#007bff"}
              >
                📝 상세 요약 보기
              </Link>
              <a 
                href={`https://www.youtube.com/watch?v=${summary.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  backgroundColor: "#ff0000",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontFamily: "Pretendard-Medium",
                  textAlign: "center",
                  transition: "background-color 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#cc0000"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#ff0000"}
              >
                🎬 YouTube 보기
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {!loading && filteredSummaries.length === 0 && summaries.length > 0 && (
        <div style={{
          textAlign: "center",
          padding: "80px 20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "12px",
          color: "#666"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <div style={{ fontSize: "18px", marginBottom: "8px" }}>
            해당 카테고리에 영상이 없습니다
          </div>
          <div style={{ fontSize: "14px" }}>
            다른 카테고리를 선택해보세요
          </div>
        </div>
      )}
    </main>
    </AuthGuard>
  );
}
