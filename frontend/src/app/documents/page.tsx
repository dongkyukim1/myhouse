"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";

// 서류 타입 정의
type Document = {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  isOnlineAvailable: boolean;
  issuer: string;
  validPeriod: string;
  notes?: string;
  category: "identity" | "income" | "housing" | "family" | "etc";
};

type DocumentCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

// 청약 유형별 필요 서류 정의
const documentCategories: DocumentCategory[] = [
  { id: "identity", name: "신원확인", description: "본인 신원을 확인하는 서류", icon: "🆔" },
  { id: "income", name: "소득증명", description: "소득 및 자산을 증명하는 서류", icon: "💰" },
  { id: "housing", name: "주거현황", description: "현재 주거 상황을 증명하는 서류", icon: "🏠" },
  { id: "family", name: "가족관계", description: "가족 구성을 증명하는 서류", icon: "👨‍👩‍👧‍👦" },
  { id: "etc", name: "기타", description: "추가 필요 서류", icon: "📋" }
];

const allDocuments: Document[] = [
  // 신원확인
  {
    id: "resident_card",
    name: "주민등록등본",
    description: "세대주 및 세대원 정보 확인",
    isRequired: true,
    isOnlineAvailable: true,
    issuer: "주민센터/온라인",
    validPeriod: "3개월",
    category: "identity",
    notes: "발급일로부터 3개월 이내, 세대주 관계 명시"
  },
  {
    id: "resident_abstract",
    name: "주민등록초본",
    description: "주소 이전 내역 확인",
    isRequired: true,
    isOnlineAvailable: true,
    issuer: "주민센터/온라인",
    validPeriod: "3개월",
    category: "identity",
    notes: "주소변동 사항 포함"
  },
  {
    id: "id_copy",
    name: "신분증 사본",
    description: "주민등록증 또는 운전면허증",
    isRequired: true,
    isOnlineAvailable: false,
    issuer: "본인 소지",
    validPeriod: "유효기간 내",
    category: "identity"
  },
  
  // 소득증명
  {
    id: "income_proof",
    name: "소득증명원",
    description: "연간 소득 확인",
    isRequired: true,
    isOnlineAvailable: true,
    issuer: "국세청/온라인",
    validPeriod: "1개월",
    category: "income",
    notes: "최근 1년간 소득 내역"
  },
  {
    id: "employment_cert",
    name: "재직증명서",
    description: "현재 직장 재직 확인",
    isRequired: true,
    isOnlineAvailable: false,
    issuer: "소속 직장",
    validPeriod: "1개월",
    category: "income"
  },
  {
    id: "salary_cert",
    name: "급여명세서",
    description: "최근 3개월 급여 내역",
    isRequired: false,
    isOnlineAvailable: false,
    issuer: "소속 직장",
    validPeriod: "3개월",
    category: "income",
    notes: "3개월분 제출"
  },
  {
    id: "asset_proof",
    name: "재산세 납세증명서",
    description: "부동산 소유 현황",
    isRequired: true,
    isOnlineAvailable: true,
    issuer: "지방세청/온라인",
    validPeriod: "1개월",
    category: "income"
  },

  // 주거현황
  {
    id: "housing_cert",
    name: "무주택 확인서",
    description: "무주택 세대주 확인",
    isRequired: true,
    isOnlineAvailable: true,
    issuer: "청약홈/온라인",
    validPeriod: "1개월",
    category: "housing",
    notes: "세대원 전체 무주택 확인"
  },
  {
    id: "subscription_cert",
    name: "청약통장 가입확인서",
    description: "청약저축 납입 내역",
    isRequired: true,
    isOnlineAvailable: true,
    issuer: "청약홈/은행",
    validPeriod: "1개월",
    category: "housing",
    notes: "납입횟수 및 납입금액 확인"
  },

  // 가족관계
  {
    id: "family_cert",
    name: "가족관계증명서",
    description: "가족 구성원 확인",
    isRequired: true,
    isOnlineAvailable: true,
    issuer: "주민센터/온라인",
    validPeriod: "3개월",
    category: "family",
    notes: "배우자, 자녀 관계 확인"
  },
  {
    id: "marriage_cert",
    name: "혼인관계증명서",
    description: "혼인 상태 확인",
    isRequired: false,
    isOnlineAvailable: true,
    issuer: "주민센터/온라인",
    validPeriod: "3개월",
    category: "family",
    notes: "신혼부부 특별공급시"
  },

  // 기타
  {
    id: "consent_form",
    name: "개인정보 수집동의서",
    description: "개인정보 처리 동의",
    isRequired: true,
    isOnlineAvailable: false,
    issuer: "신청기관 제공",
    validPeriod: "제출시",
    category: "etc",
    notes: "신청기관에서 제공하는 양식"
  },
  {
    id: "application_form",
    name: "신청서",
    description: "청약 신청서",
    isRequired: true,
    isOnlineAvailable: false,
    issuer: "신청기관 제공",
    validPeriod: "제출시",
    category: "etc"
  }
];

export default function DocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [checkedDocuments, setCheckedDocuments] = useState<Set<string>>(new Set());
  const [subscriptionType, setSubscriptionType] = useState<string>("national");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 청약 유형별 필터링
  const getFilteredDocuments = () => {
    let filtered = allDocuments;

    // 청약 유형별 필수 서류 필터링
    if (subscriptionType === "first-time") {
      // 생애최초 특별공급시 추가 서류
      filtered = filtered.filter(doc => 
        doc.isRequired || 
        ["marriage_cert", "salary_cert"].includes(doc.id)
      );
    }

    // 카테고리 필터링
    if (selectedCategory !== "all") {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const handleDocumentCheck = (documentId: string) => {
    const newChecked = new Set(checkedDocuments);
    if (newChecked.has(documentId)) {
      newChecked.delete(documentId);
    } else {
      newChecked.add(documentId);
    }
    setCheckedDocuments(newChecked);
  };

  // 로컬 스토리지에 체크 상태 저장
  useEffect(() => {
    const saved = localStorage.getItem("document-checklist");
    if (saved) {
      setCheckedDocuments(new Set(JSON.parse(saved)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("document-checklist", JSON.stringify([...checkedDocuments]));
  }, [checkedDocuments]);

  const filteredDocuments = getFilteredDocuments();
  const completionRate = Math.round((checkedDocuments.size / allDocuments.length) * 100);
  const requiredDocs = filteredDocuments.filter(doc => doc.isRequired);
  const requiredChecked = requiredDocs.filter(doc => checkedDocuments.has(doc.id)).length;

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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 40 }}>📄</div>
            <div>
              <h1 style={{ 
                fontSize: 32,
                fontFamily: 'Pretendard-Bold',
                margin: 0,
                color: '#fff'
              }}>
                서류 체크리스트
              </h1>
              <p style={{ 
                fontSize: 16, 
                color: 'rgba(255,255,255,0.8)', 
                margin: "8px 0 0 0" 
              }}>
                청약 신청에 필요한 서류를 체계적으로 준비하세요
              </p>
            </div>
          </div>

          {/* 진행률 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}>전체 진행률</span>
              <span style={{ color: "#fff", fontWeight: 700 }}>{completionRate}%</span>
            </div>
            <div style={{ 
              width: "100%", 
              height: 8, 
              background: "rgba(255,255,255,0.2)", 
              borderRadius: 4,
              overflow: "hidden"
            }}>
              <div style={{ 
                width: `${completionRate}%`, 
                height: "100%", 
                background: "#fff",
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
            <div style={{ color: "rgba(255,255,255,0.9)" }}>
              ✅ 완료: {checkedDocuments.size}개
            </div>
            <div style={{ color: "rgba(255,255,255,0.9)" }}>
              📋 전체: {allDocuments.length}개
            </div>
            <div style={{ color: "rgba(255,255,255,0.9)" }}>
              ⚠️ 필수: {requiredChecked}/{requiredDocs.length}개
            </div>
          </div>
        </div>

        <div className="documents-layout">
          {/* 사이드바 필터 */}
          <aside>
            {/* 청약 유형 선택 */}
            <div className="glass" style={{ padding: 16, marginBottom: 16 }}>
              <h3 style={{ 
                fontSize: 16,
                fontFamily: "Pretendard-Bold",
                margin: "0 0 12px 0",
                color: "#fff"
              }}>
                📋 청약 유형
              </h3>
              <select
                value={subscriptionType}
                onChange={(e) => setSubscriptionType(e.target.value)}
                className="input"
                style={{ width: "100%" }}
              >
                <option value="national">국민임대주택</option>
                <option value="public">공공임대주택</option>
                <option value="purchase">공공분양주택</option>
                <option value="happy">행복주택</option>
                <option value="first-time">생애최초 특별공급</option>
              </select>
            </div>

            {/* 검색 */}
            <div className="glass" style={{ padding: 16, marginBottom: 16 }}>
              <h3 style={{ 
                fontSize: 16,
                fontFamily: "Pretendard-Bold",
                margin: "0 0 12px 0",
                color: "#fff"
              }}>
                🔍 서류 검색
              </h3>
              <input
                type="text"
                placeholder="서류명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
                style={{ width: "100%" }}
              />
            </div>

            {/* 카테고리 필터 */}
            <div className="glass" style={{ padding: 16 }}>
              <h3 style={{ 
                fontSize: 16,
                fontFamily: "Pretendard-Bold",
                margin: "0 0 12px 0",
                color: "#fff"
              }}>
                📂 카테고리
              </h3>
              <div style={{ display: "grid", gap: 8 }}>
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={selectedCategory === "all" ? "button-primary" : "badge"}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: selectedCategory === "all" ? "#e50914" : "rgba(255,255,255,0.1)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 12px"
                  }}
                >
                  📄 전체 ({allDocuments.length})
                </button>
                {documentCategories.map((category) => {
                  const count = allDocuments.filter(doc => doc.category === category.id).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={selectedCategory === category.id ? "button-primary" : "badge"}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        background: selectedCategory === category.id ? "#e50914" : "rgba(255,255,255,0.1)",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        padding: "8px 12px"
                      }}
                    >
                      {category.icon} {category.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* 메인 콘텐츠 */}
          <main>
            {/* 서류 목록 */}
            <div style={{ display: "grid", gap: 12 }}>
              {filteredDocuments.map((document) => {
                const isChecked = checkedDocuments.has(document.id);
                return (
                  <div 
                    key={document.id}
                    className="glass"
                    style={{ 
                      padding: 16,
                      border: isChecked ? "2px solid #22c55e" : "1px solid rgba(255,255,255,0.1)",
                      background: isChecked ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)"
                    }}
                  >
                    <div style={{ display: "flex", gap: 16, alignItems: "start" }}>
                      {/* 체크박스 */}
                      <div style={{ flex: "0 0 auto", paddingTop: 2 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleDocumentCheck(document.id)}
                          style={{
                            width: 20,
                            height: 20,
                            cursor: "pointer"
                          }}
                        />
                      </div>

                      {/* 서류 정보 */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                          <div>
                            <h4 style={{ 
                              fontSize: 18,
                              fontFamily: "Pretendard-Bold",
                              margin: "0 0 4px 0",
                              color: isChecked ? "#22c55e" : "#fff",
                              textDecoration: isChecked ? "line-through" : "none"
                            }}>
                              {document.name}
                              {document.isRequired && (
                                <span style={{ 
                                  color: "#ef4444", 
                                  fontSize: 12, 
                                  marginLeft: 8 
                                }}>
                                  ⚠️ 필수
                                </span>
                              )}
                            </h4>
                            <p style={{ 
                              fontSize: 14, 
                              color: "#bbb", 
                              margin: "0 0 8px 0" 
                            }}>
                              {document.description}
                            </p>
                          </div>

                          <div style={{ display: "flex", gap: 8 }}>
                            {document.isOnlineAvailable && (
                              <div className="badge" style={{ 
                                background: "#3b82f6",
                                color: "#fff",
                                fontSize: 10
                              }}>
                                🌐 온라인
                              </div>
                            )}
                            <div className="badge" style={{ 
                              background: "rgba(255,255,255,0.1)",
                              color: "#fff",
                              fontSize: 10
                            }}>
                              {documentCategories.find(cat => cat.id === document.category)?.icon}
                            </div>
                          </div>
                        </div>

                        {/* 상세 정보 */}
                        <div style={{ 
                          display: "grid", 
                          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: 12,
                          fontSize: 12,
                          color: "#bbb"
                        }}>
                          <div>
                            <span style={{ fontWeight: 600 }}>📍 발급처:</span> {document.issuer}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600 }}>⏰ 유효기간:</span> {document.validPeriod}
                          </div>
                        </div>

                        {/* 참고사항 */}
                        {document.notes && (
                          <div style={{ 
                            marginTop: 8,
                            padding: 8,
                            background: "rgba(59,130,246,0.1)",
                            borderRadius: 6,
                            fontSize: 12,
                            color: "#3b82f6"
                          }}>
                            💡 <strong>참고:</strong> {document.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredDocuments.length === 0 && (
              <div style={{ 
                textAlign: "center", 
                color: "#bbb", 
                padding: 40,
                fontSize: 16
              }}>
                검색 조건에 맞는 서류가 없습니다.
              </div>
            )}

            {/* 도움말 */}
            <div className="glass" style={{ padding: 16, marginTop: 24 }}>
              <h3 style={{ 
                fontSize: 16,
                fontFamily: "Pretendard-Bold",
                margin: "0 0 12px 0",
                color: "#fff"
              }}>
                💡 서류 준비 팁
              </h3>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: "#bbb" }}>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: "#22c55e" }}>🌐 온라인 발급:</strong> 
                  정부24, 청약홈, 홈택스에서 24시간 발급 가능
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: "#3b82f6" }}>📅 유효기간:</strong> 
                  발급일 기준이므로 신청 직전에 발급받으세요
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ color: "#f59e0b" }}>⚠️ 필수서류:</strong> 
                  누락시 신청이 불가하니 반드시 확인하세요
                </div>
                <div style={{ 
                  padding: 8,
                  borderRadius: 6,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#ef4444"
                }}>
                  ⚠️ 청약 기관별로 요구 서류가 다를 수 있으니 공고문을 반드시 확인하세요.
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* 반응형 CSS */}
        <style jsx>{`
          .documents-layout {
            display: grid;
            grid-template-columns: minmax(280px, 300px) 1fr;
            gap: 24px;
          }
          
          @media (max-width: 1024px) {
            .documents-layout {
              grid-template-columns: 250px 1fr;
              gap: 20px;
            }
          }
          
          @media (max-width: 768px) {
            .documents-layout {
              grid-template-columns: 1fr;
              gap: 16px;
            }
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}
