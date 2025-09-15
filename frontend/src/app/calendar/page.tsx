"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";

// 공고 타입 정의 (API에서 가져온 실제 데이터 구조)
type NoticeData = {
  title: string;
  href: string;
  due: string;
  region: string;
  source: "LH" | "SH";
};

// 캘린더용 공고 타입 정의
type CalendarAnnouncement = {
  id: string;
  title: string;
  location: string;
  type: "national" | "public" | "purchase" | "happy" | "other";
  source: "LH" | "SH";
  href: string;
  dueDate?: Date;
  status: "upcoming" | "open" | "closed" | "announced";
};

// 지역 타입 정의
type Region = "전체" | "서울" | "경기" | "인천" | "부산" | "대구" | "광주" | "대전" | "울산" | "세종" | "강원" | "충북" | "충남" | "전북" | "전남" | "경북" | "경남" | "제주";

// 서울시 구 목록 (notices 페이지와 동일)
const seoulDistricts = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
  '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구',
  '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
];

// 지역 정규화 함수 (notices 페이지와 동일)
const normalizeRegion = (region: string): string => {
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

// 공고 타입 추론 함수
const inferAnnouncementType = (title: string): CalendarAnnouncement["type"] => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('국민임대') || lowerTitle.includes('국민')) return 'national';
  if (lowerTitle.includes('공공임대') || lowerTitle.includes('임대')) return 'public';
  if (lowerTitle.includes('분양') || lowerTitle.includes('공공분양')) return 'purchase';
  if (lowerTitle.includes('행복주택') || lowerTitle.includes('행복')) return 'happy';
  return 'other';
};

// 날짜 파싱 함수
const parseDueDate = (dueString: string): Date | undefined => {
  if (!dueString) return undefined;
  
  try {
    // "YYYY.MM.DD" 형식 파싱
    const match = dueString.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    if (match) {
      const [_, year, month, day] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // "MM.DD" 형식의 경우 현재 연도 사용
    const shortMatch = dueString.match(/(\d{1,2})\.(\d{1,2})/);
    if (shortMatch) {
      const [_, month, day] = shortMatch;
      const currentYear = new Date().getFullYear();
      return new Date(currentYear, parseInt(month) - 1, parseInt(day));
    }
    
    // 기타 형식 시도
    const parsed = new Date(dueString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch (error) {
    console.warn('날짜 파싱 실패:', dueString, error);
  }
  
  return undefined;
};

// API 데이터를 캘린더 형식으로 변환
const convertNoticeToCalendarAnnouncement = (notice: NoticeData, index: number): CalendarAnnouncement => {
  const normalizedRegion = normalizeRegion(notice.region || '');
  const dueDate = parseDueDate(notice.due);
  
  return {
    id: `${notice.source}-${index}`,
    title: notice.title,
    location: normalizedRegion || notice.region || '지역 미상',
    type: inferAnnouncementType(notice.title),
    source: notice.source,
    href: notice.href,
    dueDate: dueDate,
    status: dueDate && dueDate > new Date() ? 'upcoming' : 'open'
  };
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [announcements, setAnnouncements] = useState<CalendarAnnouncement[]>([]);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [selectedRegion, setSelectedRegion] = useState<Region>("전체");
  const [selectedType, setSelectedType] = useState<CalendarAnnouncement["type"] | "전체">("전체");
  const [loading, setLoading] = useState(true);

  // API에서 공고 데이터 가져오기
  useEffect(() => {
    fetchNotices();
  }, []);

  async function fetchNotices() {
    try {
      setLoading(true);
      const response = await fetch("/api/notices");
      const data = await response.json();
      const notices: NoticeData[] = data.items || [];
      
      // API 데이터를 캘린더 형식으로 변환
      const calendarAnnouncements = notices.map((notice, index) => 
        convertNoticeToCalendarAnnouncement(notice, index)
      );
      
      setAnnouncements(calendarAnnouncements);
    } catch (error) {
      console.error("공고 조회 실패:", error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }

  // 현재 달의 첫째 날과 마지막 날
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // 달력 시작일 (월요일부터 시작)
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - (firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1));

  // 필터링된 공고 리스트
  const filteredAnnouncements = announcements.filter(announcement => {
    const regionMatch = selectedRegion === "전체" || announcement.location.includes(selectedRegion);
    const typeMatch = selectedType === "전체" || announcement.type === selectedType;
    return regionMatch && typeMatch;
  });

  // 달력에 표시할 날짜들 생성
  const calendarDays = [];
  const currentCalendarDate = new Date(startDate);
  
  for (let i = 0; i < 42; i++) { // 6주 * 7일
    calendarDays.push(new Date(currentCalendarDate));
    currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
  }

  // 특정 날짜의 이벤트 찾기 (필터링된 공고에서)
  const getEventsForDate = (date: Date) => {
    return filteredAnnouncements.filter(announcement => {
      if (!announcement.dueDate) return false;
      const dateStr = date.toDateString();
      return announcement.dueDate.toDateString() === dateStr;
    });
  };

  // 이벤트 타입 확인 (실제 데이터에 맞게 수정)
  const getEventType = (announcement: CalendarAnnouncement, date: Date) => {
    if (!announcement.dueDate) return "📋 공고";
    const dateStr = date.toDateString();
    if (announcement.dueDate.toDateString() === dateStr) {
      return "⏰ 마감일";
    }
    return "📋 공고";
  };

  // 청약 유형별 색상
  const getTypeColor = (type: CalendarAnnouncement["type"]) => {
    switch (type) {
      case "national": return "#22c55e"; // 초록
      case "public": return "#3b82f6";   // 파랑
      case "purchase": return "#f59e0b"; // 노랑
      case "happy": return "#ec4899";    // 핑크
      case "other": return "#6b7280";    // 회색
      default: return "#6b7280";
    }
  };

  const getTypeName = (type: CalendarAnnouncement["type"]) => {
    switch (type) {
      case "national": return "국민임대";
      case "public": return "공공임대";
      case "purchase": return "공공분양";
      case "happy": return "행복주택";
      case "other": return "기타";
      default: return "";
    }
  };

  // 공고 링크 생성 함수 (notices 페이지와 동일)
  function getNoticeHref(announcement: CalendarAnnouncement): string {
    const raw = String(announcement?.href || "");
    // javascript: 또는 빈 링크는 폴백 처리
    if (!raw || raw.startsWith("javascript") || raw === "#") {
      return announcement?.source === "SH"
        ? `https://www.i-sh.co.kr/main/lay2/program/S1T294C295/www/brd/m_247/list.do`
        : `https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?viewType=srch`;
    }
    if (raw.startsWith("http")) return raw;
    const base = announcement?.source === "SH" ? "https://www.i-sh.co.kr" : "https://apply.lh.or.kr";
    try { 
      return new URL(raw, base).href; 
    } catch {
      return announcement?.source === "SH"
        ? `https://www.i-sh.co.kr/main/lay2/program/S1T294C295/www/brd/m_247/list.do`
        : `https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?viewType=srch`;
    }
  }

  return (
    <AuthGuard>
      <div style={{ 
        padding: "20px 16px",
        maxWidth: "95vw",
        margin: "0 auto",
        fontFamily: "Pretendard-Regular"
      }}>
        {/* 헤더 */}
        <div className="glass" style={{ 
          padding: 32, 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 40 }}>📅</div>
            <div>
              <h1 style={{ 
                fontSize: 32,
                fontFamily: 'Pretendard-Bold',
                margin: 0,
                color: '#fff'
              }}>
                청약 공고 캘린더
              </h1>
              <p style={{ 
                fontSize: 16, 
                color: 'rgba(255,255,255,0.8)', 
                margin: "8px 0 0 0" 
              }}>
                중요한 청약 일정을 놓치지 마세요
              </p>
            </div>
          </div>

          {/* 필터 및 로딩 영역 */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: 16,
            marginBottom: 20
          }}>
            {/* 뷰 모드 선택 및 새로고침 */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={() => setViewMode("month")}
                className={viewMode === "month" ? "button-primary" : "badge"}
                style={{
                  background: viewMode === "month" ? "#e50914" : "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 16px"
                }}
              >
                📅 월별 보기
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "button-primary" : "badge"}
                style={{
                  background: viewMode === "list" ? "#e50914" : "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px 16px"
                }}
              >
                📋 목록 보기
              </button>
              
              <button 
                onClick={fetchNotices}
                disabled={loading}
                style={{
                  background: "rgba(34, 197, 94, 0.2)",
                  border: "1px solid rgba(34, 197, 94, 0.4)",
                  borderRadius: 8,
                  color: "#22c55e",
                  padding: "8px 16px",
                  fontSize: 14,
                  fontFamily: "Pretendard-Medium",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? "새로고침 중..." : "🔄 새로고침"}
              </button>
            </div>

            {/* 지역 및 타입 필터 */}
            <div style={{ 
              display: "flex", 
              gap: 16, 
              flexWrap: "wrap",
              alignItems: "center"
            }}>
              {/* 지역 필터 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ 
                  color: "rgba(255,255,255,0.9)", 
                  fontSize: 14,
                  fontFamily: "Pretendard-Medium",
                  minWidth: "40px"
                }}>
                  🌍 지역:
                </span>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value as Region)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    color: "#fff",
                    padding: "8px 12px",
                    fontSize: 14,
                    fontFamily: "Pretendard-Regular",
                    cursor: "pointer",
                    minWidth: "120px"
                  }}
                >
                  <option value="전체" style={{ background: "#1a1a1a", color: "#fff" }}>전체</option>
                  {[...new Set(announcements
                    .map(a => a.location)
                    .filter(location => location && location !== '지역 미상')
                    .sort()
                  )].map(region => (
                    <option key={region} value={region} style={{ background: "#1a1a1a", color: "#fff" }}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* 기관 필터 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ 
                  color: "rgba(255,255,255,0.9)", 
                  fontSize: 14,
                  fontFamily: "Pretendard-Medium",
                  minWidth: "40px"
                }}>
                  🏢 기관:
                </span>
                <select
                  value={selectedType === "전체" ? "전체" : selectedType}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "LH" || value === "SH") {
                      setSelectedType("전체");
                      // 별도 기관 필터 상태가 필요하다면 추가
                    } else {
                      setSelectedType(value as CalendarAnnouncement["type"] | "전체");
                    }
                  }}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    color: "#fff",
                    padding: "8px 12px",
                    fontSize: 14,
                    fontFamily: "Pretendard-Regular",
                    cursor: "pointer",
                    minWidth: "120px"
                  }}
                >
                  <option value="전체" style={{ background: "#1a1a1a", color: "#fff" }}>전체</option>
                  <option value="national" style={{ background: "#1a1a1a", color: "#fff" }}>국민임대</option>
                  <option value="public" style={{ background: "#1a1a1a", color: "#fff" }}>공공임대</option>
                  <option value="purchase" style={{ background: "#1a1a1a", color: "#fff" }}>공공분양</option>
                  <option value="happy" style={{ background: "#1a1a1a", color: "#fff" }}>행복주택</option>
                  <option value="other" style={{ background: "#1a1a1a", color: "#fff" }}>기타</option>
                </select>
              </div>

              {/* 필터 결과 */}
              <div style={{
                background: "rgba(229,9,20,0.2)",
                border: "1px solid rgba(229,9,20,0.4)",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                color: "#fff",
                fontFamily: "Pretendard-SemiBold"
              }}>
                📊 {filteredAnnouncements.length}개 공고
              </div>
            </div>
          </div>
        </div>

        {viewMode === "month" ? (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 400px", 
            gap: 24 
          }}>
            {/* 왼쪽: 달력 영역 */}
            <div>
              {/* 달력 헤더 */}
              <div className="glass" style={{ padding: 24, marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                    className="badge"
                    style={{ 
                      background: "rgba(255,255,255,0.1)", 
                      cursor: "pointer",
                      padding: "12px 20px",
                      fontSize: "16px",
                      fontFamily: "Pretendard-Medium"
                    }}
                  >
                    ◀ 이전
                  </button>
                  
                  <h2 style={{ 
                    fontSize: 28, 
                    fontFamily: "Pretendard-Bold",
                    margin: 0,
                    color: "#fff"
                  }}>
                    {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                  </h2>
                  
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                    className="badge"
                    style={{ 
                      background: "rgba(255,255,255,0.1)", 
                      cursor: "pointer",
                      padding: "12px 20px",
                      fontSize: "16px",
                      fontFamily: "Pretendard-Medium"
                    }}
                  >
                    다음 ▶
                  </button>
                </div>

                {/* 요일 헤더 */}
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(7, 1fr)", 
                  gap: 2,
                  marginBottom: 12
                }}>
                  {["월", "화", "수", "목", "금", "토", "일"].map((day, index) => (
                    <div key={day} style={{ 
                      padding: 12,
                      textAlign: "center",
                      fontWeight: 700,
                      color: index >= 5 ? "#ef4444" : "#bbb",
                      fontSize: 16,
                      fontFamily: "Pretendard-Bold"
                    }}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* 달력 본체 */}
                <div className="calendar-grid" style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(7, 1fr)", 
                  gap: 3,
                  minHeight: "500px"
                }}>
                  {calendarDays.map((day, index) => {
                    const events = getEventsForDate(day);
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                    return (
                      <div
                        key={index}
                        className="calendar-day"
                        onClick={() => setSelectedDate(day)}
                        style={{
                          minHeight: 140,
                          padding: 10,
                          background: isToday ? 
                            "rgba(229,9,20,0.2)" : 
                            isCurrentMonth ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                          border: selectedDate?.toDateString() === day.toDateString() ? 
                            "2px solid #e50914" : "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12,
                          cursor: "pointer",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column"
                        }}
                      >
                        <div style={{ 
                          fontSize: 18,
                          fontWeight: isToday ? 700 : 500,
                          fontFamily: "Pretendard-SemiBold",
                          color: !isCurrentMonth ? "#666" : 
                                 isWeekend ? "#ef4444" : 
                                 isToday ? "#e50914" : "#fff",
                          marginBottom: 6
                        }}>
                          {day.getDate()}
                        </div>
                        
                        {/* 이벤트 점 표시 */}
                        {events.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
                            {events.slice(0, 2).map((event, eventIndex) => (
                              <div
                                key={eventIndex}
                                style={{
                                  width: "100%",
                                  height: 32,
                                  background: getTypeColor(event.type),
                                  borderRadius: 10,
                                  fontSize: 14,
                                  color: "#fff",
                                  textAlign: "center",
                                  lineHeight: "32px",
                                  overflow: "hidden",
                                  fontFamily: "Pretendard-Bold",
                                  fontWeight: 700,
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                                }}
                              >
                                {getEventType(event, day)}
                              </div>
                            ))}
                            {events.length > 2 && (
                              <div style={{ 
                                fontSize: 13, 
                                color: "#bbb", 
                                textAlign: "center",
                                fontFamily: "Pretendard-SemiBold",
                                fontWeight: 600,
                                marginTop: 3
                              }}>
                                +{events.length - 2}개 더
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 오른쪽: 사이드바 */}
            <div>
              {selectedDate ? (
              <div className="glass" style={{ 
                padding: 24, 
                position: "sticky", 
                top: 20,
                maxHeight: "calc(100vh - 100px)",
                overflowY: "auto"
              }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  marginBottom: 20
                }}>
                  <h3 style={{ 
                    fontSize: 24,
                    fontFamily: "Pretendard-Bold", 
                    margin: 0,
                    color: "#fff"
                  }}>
                    📅 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
                  </h3>
                  <button
                    onClick={() => setSelectedDate(null)}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 18,
                      width: 32,
                      height: 32,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    ×
                  </button>
                </div>
                
                {getEventsForDate(selectedDate).length > 0 ? (
                  <div style={{ display: "grid", gap: 16 }}>
                    {getEventsForDate(selectedDate).map((event, index) => (
                      <div key={index} className="glass" style={{ 
                        padding: 16,
                        background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                        border: `1px solid ${getTypeColor(event.type)}40`,
                        borderRadius: 12
                      }}>
                        <div style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: 12,
                          marginBottom: 12
                        }}>
                          <div style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            background: getTypeColor(event.type)
                          }} />
                          <div className="badge" style={{ 
                            background: getTypeColor(event.type),
                            color: "#fff",
                            fontSize: 12,
                            padding: "4px 8px",
                            fontFamily: "Pretendard-SemiBold"
                          }}>
                            {getEventType(event, selectedDate)}
                          </div>
                        </div>
                        
                        <div style={{ 
                          fontSize: 16, 
                          fontWeight: 600, 
                          color: "#fff", 
                          marginBottom: 8,
                          fontFamily: "Pretendard-SemiBold",
                          lineHeight: 1.3
                        }}>
                          {event.title}
                        </div>
                        
                        <div style={{ 
                          fontSize: 13, 
                          color: "#bbb", 
                          marginBottom: 12,
                          fontFamily: "Pretendard-Regular"
                        }}>
                          📍 {event.location} • {getTypeName(event.type)} • {event.source}
                        </div>
                        
                        <div style={{ 
                          fontSize: 12, 
                          color: "#aaa", 
                          fontFamily: "Pretendard-Regular", 
                          lineHeight: 1.5
                        }}>
                          {event.dueDate && (
                            <div style={{ marginBottom: 6, color: "#f59e0b", fontWeight: 600 }}>
                              ⏰ 마감일: {event.dueDate.toLocaleDateString()}
                            </div>
                          )}
                          <div style={{ 
                            display: "flex", 
                            gap: 8, 
                            marginTop: 8
                          }}>
                            <a 
                              href={getNoticeHref(event)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{
                                background: "rgba(59, 130, 246, 0.2)",
                                border: "1px solid rgba(59, 130, 246, 0.4)",
                                borderRadius: 6,
                                color: "#3b82f6",
                                padding: "4px 8px",
                                fontSize: 11,
                                textDecoration: "none",
                                fontFamily: "Pretendard-Medium"
                              }}
                            >
                              🔗 공고 보기
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: "center", 
                    color: "#888", 
                    padding: 32,
                    fontSize: 14,
                    fontFamily: "Pretendard-Regular",
                    lineHeight: 1.6
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                    <div>이 날에는</div>
                    <div>예정된 일정이 없습니다</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass" style={{ 
                padding: 32, 
                textAlign: "center",
                position: "sticky", 
                top: 20
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                <div style={{ 
                  fontSize: 18, 
                  color: "#bbb", 
                  fontFamily: "Pretendard-Medium",
                  lineHeight: 1.6
                }}>
                  달력에서 날짜를<br />클릭해보세요
                </div>
              </div>
            )}
            </div>
          </div>
        ) : (
          /* 목록 보기 */
          <div>
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
            ) : filteredAnnouncements.length === 0 ? (
              <div className="glass" style={{ 
                padding: 40, 
                textAlign: "center", 
                borderRadius: 12,
                fontFamily: "Pretendard-Regular"
              }}>
                <div style={{ fontSize: 18, marginBottom: 8 }}>📭</div>
                <div>조건에 맞는 공고가 없습니다.</div>
                {announcements.length === 0 && (
                  <div style={{ marginTop: 12, fontSize: 14, color: "#888" }}>
                    새로고침을 눌러 최신 공고를 확인해보세요.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {filteredAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="glass" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                      <div>
                        <h3 style={{ 
                          fontSize: 20, 
                          fontFamily: "Pretendard-Bold",
                          margin: "0 0 8px 0",
                          color: "#fff",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden"
                        }}>
                          {announcement.title}
                        </h3>
                        <div style={{ fontSize: 14, color: "#bbb", marginBottom: 8 }}>
                          📍 {announcement.location} • {announcement.source}
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
                        <div className="badge" style={{ 
                          background: getTypeColor(announcement.type),
                          color: "#fff"
                        }}>
                          {getTypeName(announcement.type)}
                        </div>
                        <div className="badge" style={{ 
                          background: announcement.source === "LH" 
                            ? "linear-gradient(90deg, #22c55e 0%, #3b82f6 100%)"
                            : "linear-gradient(90deg, #34d399 0%, #059669 100%)",
                          color: "#fff"
                        }}>
                          {announcement.source}
                        </div>
                      </div>
                    </div>

                    {announcement.dueDate && (
                      <div style={{ 
                        background: "rgba(245, 158, 11, 0.1)",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 12
                      }}>
                        <div style={{ color: "#f59e0b", fontWeight: 600, marginBottom: 4, fontSize: 14 }}>
                          ⏰ 마감일
                        </div>
                        <div style={{ color: "#fff", fontSize: 16, fontFamily: "Pretendard-SemiBold" }}>
                          {announcement.dueDate.toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                      <a 
                        href={getNoticeHref(announcement)} 
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
                      >
                        🔗 공고 보기
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 반응형 CSS */}
        <style jsx>{`
          @media (max-width: 1024px) {
            div[style*="grid-template-columns: 1fr 400px"] {
              grid-template-columns: 1fr !important;
              gap: 16px !important;
            }
          }
          
          @media (max-width: 768px) {
            .glass {
              padding: 16px !important;
            }
            
            .calendar-grid {
              grid-template-columns: repeat(7, 1fr) !important;
              gap: 1px !important;
              min-height: 350px !important;
            }
            
            .calendar-day {
              min-height: 60px !important;
              padding: 2px !important;
              font-size: 12px !important;
            }
            
            div[style*="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))"] {
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
            }
            
            /* 필터 영역 반응형 */
            div[style*="display: flex"][style*="gap: 16"] {
              flex-direction: column !important;
              gap: 12px !important;
            }
            
            div[style*="display: flex"][style*="gap: 12"] {
              flex-wrap: wrap !important;
              gap: 8px !important;
            }
            
            select {
              min-width: 100px !important;
              width: 100% !important;
            }
          }
          
          @media (max-width: 480px) {
            .calendar-day {
              min-height: 50px !important;
              font-size: 10px !important;
            }
            
            div[style*="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))"] {
              grid-template-columns: 1fr 1fr !important;
            }
            
            h1 {
              font-size: 24px !important;
            }
            
            h2 {
              font-size: 20px !important;
            }
            
            /* 모바일에서 필터 레이아웃 */
            div[style*="display: flex"][style*="alignItems: center"][style*="gap: 12"] {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 8px !important;
            }
            
            span[style*="minWidth: \"40px\""] {
              min-width: auto !important;
            }
            
            select {
              font-size: 12px !important;
              padding: 6px 8px !important;
            }
          }
        `}</style>

        {/* 범례 */}
        <div className="glass" style={{ padding: 24, marginTop: 24 }}>
          <h4 style={{ 
            fontSize: 24,
            fontFamily: "Pretendard-Bold",
            margin: "0 0 20px 0",
            color: "#fff"
          }}>
            📊 청약 유형 안내
          </h4>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            fontSize: 16
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                background: getTypeColor("national"),
                borderRadius: 6 
              }} />
              <span style={{ fontFamily: "Pretendard-Medium", fontWeight: 500 }}>국민임대 (소득 7분위 이하)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                background: getTypeColor("public"),
                borderRadius: 6 
              }} />
              <span style={{ fontFamily: "Pretendard-Medium", fontWeight: 500 }}>공공임대 (소득 6분위 이하)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                background: getTypeColor("purchase"),
                borderRadius: 6 
              }} />
              <span style={{ fontFamily: "Pretendard-Medium", fontWeight: 500 }}>공공분양 (분양가 상한제)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                background: getTypeColor("happy"),
                borderRadius: 6 
              }} />
              <span style={{ fontFamily: "Pretendard-Medium", fontWeight: 500 }}>행복주택 (청년, 신혼부부)</span>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
