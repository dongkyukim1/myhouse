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
      console.log('API 응답 데이터:', data);
      console.log('영상 개수:', data.items?.length || 0);
      
      if (data.items && data.items.length > 0) {
        console.log('영상 목록 로딩 시작:', data.items.length, '개');
        await loadAllSummaries(data.items);
      } else {
        const errorMessage = "영상을 찾을 수 없습니다. YouTube 채널을 확인해주세요.";
        console.error('영상 목록이 비어있음:', data);
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
    const total = Math.min(videoList.length, 20); // 최대 20개로 증가
    
    console.log(`전체 영상 요약 로딩 시작: ${total}개 영상`);
    
    for (let i = 0; i < total; i++) {
      const video = videoList[i];
      try {
        console.log(`영상 ${i + 1}/${total} 요약 로딩 중: ${video.title}`);
        
        const response = await fetch(`/api/video-summary?videoId=${video.videoId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`영상 ${video.videoId} 요약 로딩 실패:`, errorData);
          
          // 할당량 초과인 경우 중단
          if (errorData.code === "QUOTA_EXCEEDED" || response.status === 429) {
            console.log('YouTube API 할당량 초과로 인한 중단');
            break;
          }
          continue;
        }
        
        const summaryData = await response.json();
        
        console.log(`영상 ${video.videoId} API 응답:`, summaryData);
        console.log(`영상 ${video.videoId} 응답 키들:`, Object.keys(summaryData || {}));
        console.log(`영상 ${video.videoId} has video:`, !!summaryData?.video);
        console.log(`영상 ${video.videoId} has summary:`, !!summaryData?.summary);
        
        if (summaryData && (summaryData.video || summaryData.summary)) {
          console.log(`영상 ${video.videoId} 요약 완료`);
          
          // video 데이터가 없으면 기본 데이터로 구성
          const videoData = summaryData.video || {
            videoId: video.videoId,
            title: video.title,
            description: video.description,
            publishedAt: video.publishedAt,
            duration: "정보 없음",
            viewCount: "0",
            likeCount: "0",
            thumbnails: video.thumbnails
          };
          
          summaryResults.push({
            videoId: video.videoId,
            summary: summaryData.summary || '요약 정보를 생성할 수 없습니다.',
            keywords: summaryData.keywords || [],
            category: summaryData.category || '일반',
            video: videoData
          });
          
          console.log(`요약 추가 성공 - 현재 총 ${summaryResults.length}개`);
        } else {
          console.warn(`영상 ${video.videoId} 요약 데이터가 부족함:`, summaryData);
        }
      } catch (error) {
        console.error(`영상 ${video.videoId} 요약 로딩 중 에러:`, error);
        // 개별 영상 실패는 전체 프로세스를 중단하지 않음
      }
      
      // 진행률 업데이트
      const progress = Math.round(((i + 1) / total) * 100);
      setLoadingProgress(progress);
      
      // 상태 업데이트 전에 로그 찍기
      console.log(`진행률 ${progress}% - 현재까지 ${summaryResults.length}개 요약 완료`);
      setSummaries([...summaryResults]);
      
      // 서버 부하 방지를 위한 약간의 지연
      if (i < total - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`전체 영상 요약 로딩 완료: ${summaryResults.length}개 성공`);
    console.log('최종 summaryResults:', summaryResults);
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

  // 렌더링 시 상태 로그
  console.log('현재 렌더링 상태:');
  console.log('- loading:', loading);
  console.log('- summaries 개수:', summaries.length);
  console.log('- filteredSummaries 개수:', filteredSummaries.length);
  console.log('- error:', error);

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
          marginBottom: "30px",
          border: "1px solid #e0e0e0"
        }}>
          <InlineLoading 
            text="영상들을 AI로 분석하고 있습니다..." 
            size={100}
          />
          <div style={{
            width: "100%",
            maxWidth: "500px",
            height: "12px",
            backgroundColor: "#e0e0e0",
            borderRadius: "6px",
            margin: "25px auto 15px",
            overflow: "hidden",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <div style={{
              height: "100%",
              background: "linear-gradient(90deg, #007bff 0%, #0056b3 100%)",
              borderRadius: "6px",
              width: `${loadingProgress}%`,
              transition: "width 0.5s ease",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                animation: "shimmer 2s infinite linear"
              }} />
            </div>
          </div>
          <div style={{ 
            fontSize: "16px", 
            color: "#333",
            fontFamily: "Pretendard-Medium",
            marginBottom: "8px"
          }}>
            {loadingProgress}% 완료
          </div>
          <div style={{ 
            fontSize: "14px", 
            color: "#666" 
          }}>
            {summaries.length}개 영상 분석 완료 • YouTube API로 실시간 처리 중
          </div>
          {summaries.length > 0 && (
            <div style={{
              marginTop: "20px",
              padding: "12px",
              backgroundColor: "#e8f4fd",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#0066cc"
            }}>
              💡 분석된 영상들은 아래에서 실시간으로 확인하실 수 있습니다
            </div>
          )}
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div style={{ 
          textAlign: "center", 
          padding: "60px 20px",
          backgroundColor: "#fff5f5",
          borderRadius: "12px",
          border: "1px solid #fecaca",
          marginBottom: "30px"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <div style={{ 
            fontSize: "18px",
            color: "#dc2626",
            fontFamily: "Pretendard-SemiBold",
            marginBottom: "12px"
          }}>
            영상 로딩 중 문제가 발생했습니다
          </div>
          <div style={{ 
            fontSize: "14px",
            color: "#666",
            marginBottom: "20px",
            lineHeight: "1.6"
          }}>
            {error}
          </div>
          <button
            onClick={() => {
              setError(null);
              loadVideos();
            }}
            style={{
              padding: "12px 24px",
              backgroundColor: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "Pretendard-Medium",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#b91c1c"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#dc2626"}
          >
            🔄 다시 시도
          </button>
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

      {/* CSS 애니메이션 추가 */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </main>
    </AuthGuard>
  );
}
