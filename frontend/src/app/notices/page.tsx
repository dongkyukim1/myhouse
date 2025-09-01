"use client";

import React, { useEffect, useState } from "react";

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchNotices();
  }, []);

  async function fetchNotices() {
    try {
      setLoading(true);
      const response = await fetch("/api/notices");
      const data = await response.json();
      setNotices(data.items || []);
    } catch (error) {
      console.error("공고 조회 실패:", error);
      setNotices([]);
    } finally {
      setLoading(false);
    }
  }

  function getNoticeHref(n: any): string {
    const raw = String(n?.href || "");
    // javascript: 또는 빈 링크는 폴백 처리
    if (!raw || raw.startsWith("javascript") || raw === "#") {
      return n?.source === "SH"
        ? `https://www.i-sh.co.kr/main/lay2/program/S1T294C295/www/brd/m_247/list.do`
        : `https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?viewType=srch`;
    }
    if (raw.startsWith("http")) return raw;
    const base = n?.source === "SH" ? "https://www.i-sh.co.kr" : "https://apply.lh.or.kr";
    try { 
      return new URL(raw, base).href; 
    } catch {
      return n?.source === "SH"
        ? `https://www.i-sh.co.kr/main/lay2/program/S1T294C295/www/brd/m_247/list.do`
        : `https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?viewType=srch`;
    }
  }

  // 서울시 구 목록
  const seoulDistricts = [
    '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
    '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
    '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
  ];

  // 지역 정규화 함수
  const normalizeRegion = (region: string) => {
    if (!region) return '';
    
    // 서울시 구들을 "서울"로 통합
    for (const district of seoulDistricts) {
      if (region.includes(district)) {
        return '서울';
      }
    }
    
    // 서울시 전체, 서울시, 서울 등도 "서울"로 통합
    if (region.includes('서울')) {
      return '서울';
    }
    
    // 강남권, 강남·서초·송파 등도 "서울"로 통합
    if (region.includes('강남권') || region.includes('권')) {
      return '서울';
    }
    
    // 기타 지역은 그대로 유지
    return region;
  };

  const filteredNotices = notices.filter(notice => {
    const matchesSource = selectedSource === "all" || notice.source === selectedSource;
    const normalizedNoticeRegion = normalizeRegion(notice.region || '');
    const matchesRegion = selectedRegion === "all" || normalizedNoticeRegion === selectedRegion;
    const matchesSearch = searchTerm === "" || 
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notice.region && notice.region.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSource && matchesRegion && matchesSearch;
  });

  // 지역 목록 추출 (정규화 후 중복 제거)
  const regions = [...new Set(notices
    .map(notice => normalizeRegion(notice.region || ''))
    .filter(region => region && region.trim() !== "")
    .sort()
  )];

  const lhCount = notices.filter(n => n.source === "LH").length;
  const shCount = notices.filter(n => n.source === "SH").length;

  return (
      <div className="container" style={{ 
        maxWidth: 1200, 
        margin: "0 auto", 
        padding: isMobile ? "12px" : "20px"
      }}>
      {/* 헤더 섹션 */}
      <section className="hero gradient-blue glass" style={{ 
        padding: isMobile ? 16 : 24, 
        marginBottom: isMobile ? 16 : 24, 
        borderRadius: 16,
        position: "relative",
        overflow: "hidden"
      }}>
        <div className="hero-mask" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="black-han-sans-regular" style={{ 
            margin: 0, 
            fontSize: isMobile ? 24 : 32, 
            marginBottom: 8,
            fontFamily: "Pretendard-Bold"
          }}>
            🏠 지원 가능 공고
          </h1>
          <p className="subtle" style={{ 
            fontSize: isMobile ? 14 : 16, 
            marginBottom: isMobile ? 12 : 16,
            fontFamily: "Pretendard-Regular"
          }}>
            청년, 신혼, 행복, 국민, 매입, 분양 키워드로 필터링된 최신 공고를 확인하세요
          </p>
          <div style={{ display: "flex", gap: isMobile ? 8 : 16, alignItems: "center", flexWrap: "wrap" }}>
            <div className="badge" style={{ 
              background: "rgba(34, 197, 94, 0.1)", 
              border: "1px solid rgba(34, 197, 94, 0.3)",
              color: "#22c55e",
              fontFamily: "Pretendard-Medium"
            }}>
              총 {notices.length}개 공고
            </div>
            <div className="badge" style={{ 
              background: "rgba(59, 130, 246, 0.1)", 
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#3b82f6",
              fontFamily: "Pretendard-Medium"
            }}>
              LH {lhCount}개
            </div>
            <div className="badge" style={{ 
              background: "rgba(52, 211, 153, 0.1)", 
              border: "1px solid rgba(52, 211, 153, 0.3)",
              color: "#34d399",
              fontFamily: "Pretendard-Medium"
            }}>
              SH {shCount}개
            </div>
            <button 
              onClick={fetchNotices}
              className="button-primary"
              disabled={loading}
              style={{ fontFamily: "Pretendard-Medium" }}
            >
              {loading ? "새로고침 중..." : "🔄 새로고침"}
            </button>
          </div>
        </div>
      </section>

      {/* 필터 및 검색 */}
      <section className="glass" style={{ 
        padding: isMobile ? 12 : 16, 
        marginBottom: isMobile ? 16 : 24, 
        borderRadius: 12
      }}>
        {/* 상단 필터 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          alignItems: "center",
          marginBottom: 16
        }}>
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: 4, 
              fontSize: 14, 
              fontFamily: "Pretendard-Medium",
              color: "#ddd" 
            }}>
              기관 필터
            </label>
            <select 
              value={selectedSource} 
              onChange={(e) => setSelectedSource(e.target.value)}
              className="input"
              style={{ fontFamily: "Pretendard-Regular" }}
            >
              <option value="all">전체</option>
              <option value="LH">LH 공사</option>
              <option value="SH">SH 공사</option>
            </select>
          </div>
          
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: 4, 
              fontSize: 14, 
              fontFamily: "Pretendard-Medium",
              color: "#ddd" 
            }}>
              검색
            </label>
            <input 
              type="text"
              placeholder="공고명 또는 지역으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              style={{ fontFamily: "Pretendard-Regular" }}
            />
          </div>
        </div>

        {/* 지역별 탭 */}
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: 8, 
            fontSize: 14, 
            fontFamily: "Pretendard-Medium",
            color: "#ddd" 
          }}>
            지역별 보기
          </label>
          <div style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            <button
              onClick={() => setSelectedRegion("all")}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.2)",
                background: selectedRegion === "all" 
                  ? "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)"
                  : "rgba(255,255,255,0.05)",
                color: selectedRegion === "all" ? "#fff" : "#ddd",
                fontSize: 12,
                fontFamily: "Pretendard-Medium",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              전체
            </button>
            {regions.map(region => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: selectedRegion === region 
                    ? region === "서울" 
                      ? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)" // 서울은 주황색
                      : "linear-gradient(90deg, #34d399 0%, #059669 100%)" // 기타 지역은 초록색
                    : "rgba(255,255,255,0.05)",
                  color: selectedRegion === region ? "#fff" : "#ddd",
                  fontSize: 12,
                  fontFamily: "Pretendard-Medium",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (selectedRegion !== region) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRegion !== region) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }
                }}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 공고 목록 */}
      {loading ? (
        <div className="glass" style={{ 
          padding: 40, 
          textAlign: "center", 
          borderRadius: 12,
          fontFamily: "Pretendard-Regular"
        }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>🔄</div>
          <div>공고를 불러오는 중...</div>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="glass" style={{ 
          padding: 40, 
          textAlign: "center", 
          borderRadius: 12,
          fontFamily: "Pretendard-Regular"
        }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>📭</div>
          <div>조건에 맞는 공고가 없습니다.</div>
          {notices.length === 0 && (
            <div style={{ marginTop: 12, fontSize: 14, color: "#888" }}>
              새로고침을 눌러 최신 공고를 확인해보세요.
            </div>
          )}
        </div>
      ) : (
        <div className="grid-gap" style={{ 
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(350px, 1fr))",
          gap: isMobile ? 12 : 16 
        }}>
          {filteredNotices.map((notice, index) => {
            const href = getNoticeHref(notice);
            return (
              <div key={index} className="glass gradient-violet" style={{ 
                borderRadius: 12, 
                overflow: "hidden",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "";
              }}>
                <div style={{ padding: isMobile ? 12 : 16 }}>
                  {/* 헤더 */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start", 
                    marginBottom: 12 
                  }}>
                    <span className="badge" style={{ 
                      background: notice.source === "LH" 
                        ? "linear-gradient(90deg, #22c55e 0%, #3b82f6 100%)"
                        : "linear-gradient(90deg, #34d399 0%, #059669 100%)",
                      color: "#fff",
                      fontFamily: "Pretendard-Bold",
                      fontSize: 12
                    }}>
                      {notice.source}
                    </span>
                    {notice.region && (
                      <span className="badge" style={{ 
                        background: "rgba(255,255,255,0.08)",
                        fontFamily: "Pretendard-Regular",
                        fontSize: 11
                      }}>
                        {notice.region}
                      </span>
                    )}
                  </div>

                  {/* 제목 */}
                  <h3 style={{ 
                    margin: "0 0 12px 0", 
                    fontSize: 16, 
                    lineHeight: 1.4,
                    fontFamily: "Pretendard-SemiBold",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}>
                    {notice.title}
                  </h3>

                  {/* 기간 */}
                  {notice.due && (
                    <div style={{ 
                      fontSize: 12, 
                      color: "#888", 
                      marginBottom: 16,
                      fontFamily: "Pretendard-Regular"
                    }}>
                      📅 {notice.due}
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="button-primary"
                      style={{ 
                        flex: 1, 
                        textAlign: "center", 
                        textDecoration: "none",
                        fontFamily: "Pretendard-Medium",
                        fontSize: 14
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      🔗 공고 보기
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 푸터 정보 */}
      <div className="glass" style={{ 
        padding: 16, 
        marginTop: 32, 
        borderRadius: 12, 
        textAlign: "center",
        fontSize: 12,
        color: "#888",
        fontFamily: "Pretendard-Regular"
      }}>
        <div style={{ marginBottom: 8 }}>
          💡 공고 정보는 실시간으로 업데이트되며, 자세한 내용은 해당 기관 웹사이트에서 확인하세요.
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
          <a 
            href="https://apply.lh.or.kr" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: "#3b82f6", textDecoration: "none" }}
          >
            🏢 LH 청약센터
          </a>
          <a 
            href="https://www.i-sh.co.kr" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: "#34d399", textDecoration: "none" }}
          >
            🏢 SH 청약센터
          </a>
        </div>
      </div>
    </div>
  );
}
