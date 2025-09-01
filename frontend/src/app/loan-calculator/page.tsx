"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";

export default function LoanCalculatorPage() {
  const [loanAmount, setLoanAmount] = useState<number>(120000000); // 대출원금 (기본값: 1억 2천만원)
  const [interestRate, setInterestRate] = useState<number>(4.5); // 연이율 (%)
  const [loanTerm, setLoanTerm] = useState<number>(30); // 대출기간 (년)
  const [isGraceType, setIsGraceType] = useState<boolean>(false); // 거치식 여부
  
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);

  // OCR 관련 상태
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // 월 상환액 계산
  useEffect(() => {
    if (loanAmount > 0 && interestRate > 0 && loanTerm > 0) {
      const monthlyRate = interestRate / 100 / 12; // 월 이자율
      const totalMonths = loanTerm * 12; // 총 상환 개월 수
      
      if (isGraceType) {
        // 거치식 (이자만 상환)
        const monthly = loanAmount * monthlyRate;
        setMonthlyPayment(monthly);
        setTotalPayment(monthly * totalMonths + loanAmount);
        setTotalInterest(monthly * totalMonths);
      } else {
        // 원리금 균등상환
        const monthly = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                       (Math.pow(1 + monthlyRate, totalMonths) - 1);
        setMonthlyPayment(monthly);
        setTotalPayment(monthly * totalMonths);
        setTotalInterest(monthly * totalMonths - loanAmount);
      }
    }
  }, [loanAmount, interestRate, loanTerm, isGraceType]);

  // OCR 처리
  async function handleOcrUpload(file: File) {
    if (!file) return;
    
    setOcrLoading(true);
    setOcrError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('OCR 처리 실패');
      }
      
      const result = await response.json();
      setOcrResult(result);
      
      // OCR 결과에서 정보 자동 입력
      if (result.price) {
        setLoanAmount(result.price);
      }
      if (result.interestRate) {
        setInterestRate(result.interestRate);
      }
      if (result.loanTerm) {
        setLoanTerm(result.loanTerm);
      }
    } catch (error: any) {
      setOcrError(error.message || 'OCR 처리 중 오류가 발생했습니다.');
    } finally {
      setOcrLoading(false);
    }
  }

  return (
    <AuthGuard>
      <div className="container loan-calculator-grid" style={{ 
      display: "grid", 
      gridTemplateColumns: "1fr 400px", 
      gap: 20, 
      paddingBottom: 24 
    }}>
      {/* 메인 컨텐츠 */}
      <main style={{ display: 'grid', gap: 14 }}>
        {/* 히어로 섹션 */}
        <section className="hero gradient-orange glass" style={{ 
          display: "grid", 
          gridTemplateColumns: "1.2fr 1fr", 
          marginBottom: 6 
        }}>
          <div style={{ position: "relative" }}>
            <div className="hero-mask" />
            <div style={{ position: "absolute", left: 20, bottom: 12, right: 20 }}>
              <h1 className="black-han-sans-regular" style={{ margin: 0, fontSize: 28 }}>
                🏠 예상 한달 지출 비용
              </h1>
              <p className="subtle" style={{ marginTop: 4, fontSize: 12 }}>
                주택 구매 시 월 상환액을 미리 계산해보세요
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <a href="/" className="button-primary">대시보드</a>
                <a href="/my-info" className="badge" style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}>내 정보</a>
              </div>
            </div>
          </div>
          <div style={{ padding: 12 }}>
            <div className="glass" style={{ padding: 12, height: "100%" }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>계산 결과</div>
              <div style={{ display: "grid", gap: 8 }}>
                <Metric 
                  title="월 상환액" 
                  value={`${Math.round(monthlyPayment/10000)}만원`} 
                  trend="📈" 
                  color="#22c55e" 
                />
                <Metric 
                  title="총 이자" 
                  value={`${Math.round(totalInterest/100000000*10)/10}억`} 
                  trend="📊" 
                  color="#f59e0b" 
                />
              </div>
            </div>
          </div>
        </section>

        {/* 계산기 폼 */}
        <div className="glass" style={{ padding: 16 }}>
          <h2 className="black-han-sans-regular" style={{ margin: "0 0 12px 0", fontSize: 18 }}>
            💰 대출 정보 입력
          </h2>
          
          <div style={{ display: "grid", gap: 12 }}>
            {/* 대출원금 */}
            <div>
              <label className="subtle" style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
                대출원금 (원)
              </label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="input"
                style={{ width: "100%" }}
                placeholder="예: 120000000"
              />
              <div style={{ marginTop: 4, fontSize: 12, color: "#22c55e" }}>
                {loanAmount.toLocaleString('ko-KR')}원 (약 {Math.round(loanAmount/100000000*10)/10}억)
              </div>
            </div>

            {/* 연이율 */}
            <div>
              <label className="subtle" style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
                연이율 (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="input"
                style={{ width: "100%" }}
                placeholder="예: 4.5"
              />
              <div style={{ marginTop: 4, fontSize: 12, color: "#3b82f6" }}>
                월 이자율: {(interestRate/12).toFixed(3)}%
              </div>
            </div>

            {/* 대출기간 */}
            <div>
              <label className="subtle" style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
                대출기간 (년)
              </label>
              <input
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="input"
                style={{ width: "100%" }}
                placeholder="예: 30"
              />
              <div style={{ marginTop: 4, fontSize: 12, color: "#eab308" }}>
                총 {loanTerm * 12}개월 상환
              </div>
            </div>

            {/* 상환방식 선택 */}
            <div>
              <label className="subtle" style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
                상환방식
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setIsGraceType(false)}
                  className={`badge ${!isGraceType ? 'button-primary' : ''}`}
                  style={{
                    background: !isGraceType ? "#e50914" : "rgba(255,255,255,0.06)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 12px"
                  }}
                >
                  원리금 균등상환
                </button>
                <button
                  onClick={() => setIsGraceType(true)}
                  className={`badge ${isGraceType ? 'button-primary' : ''}`}
                  style={{
                    background: isGraceType ? "#e50914" : "rgba(255,255,255,0.06)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 12px"
                  }}
                >
                  거치식 (이자만)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 상세 계산 결과 */}
        <div className="grid-gap" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="glass gradient-violet" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#22c55e" }}>💳 월 상환액</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
              {monthlyPayment.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
            </div>
            <div className="subtle" style={{ fontSize: 12 }}>
              {isGraceType ? "매월 이자만" : "원금 + 이자"}
            </div>
          </div>

          <div className="glass gradient-violet" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#3b82f6" }}>💰 총 상환액</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
              {totalPayment.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
            </div>
            <div className="subtle" style={{ fontSize: 12 }}>
              {loanTerm}년간 총 납부금액
            </div>
          </div>

          <div className="glass gradient-violet" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: "#f59e0b" }}>📊 총 이자</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
              {totalInterest.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원
            </div>
            <div className="subtle" style={{ fontSize: 12 }}>
              원금 대비 {((totalInterest / loanAmount) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* 공식 설명 */}
        <div className="glass" style={{ padding: 16 }}>
          <h3 className="black-han-sans-regular" style={{ margin: "0 0 12px 0", fontSize: 16 }}>
            🧮 계산 공식
          </h3>
          {isGraceType ? (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>거치식 (이자만 상환):</div>
              <div style={{ 
                background: "rgba(0,0,0,0.3)",
                padding: 12,
                borderRadius: 8,
                fontFamily: "monospace",
                fontSize: 14,
                marginBottom: 8
              }}>
                M = P × (연이율 ÷ 12)
              </div>
              <div className="subtle" style={{ fontSize: 12 }}>
                M = 월 상환액, P = 대출원금
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>원리금 균등상환:</div>
              <div style={{ 
                background: "rgba(0,0,0,0.3)",
                padding: 12,
                borderRadius: 8,
                fontFamily: "monospace",
                fontSize: 14,
                marginBottom: 8
              }}>
                M = P × [r(1+r)ⁿ] / [(1+r)ⁿ - 1]
              </div>
              <div className="subtle" style={{ fontSize: 12 }}>
                M = 월 상환액, P = 대출원금, r = 월이율, n = 총 개월수
              </div>
            </div>
          )}
        </div>
      </main>

      {/* OCR 사이드바 */}
      <aside className="sidebar">
        <div className="glass" style={{ padding: 16 }}>
          <h2 className="black-han-sans-regular" style={{ margin: "0 0 12px 0", fontSize: 18 }}>
            📄 문서/이미지 OCR 분석
          </h2>
          <p className="subtle" style={{ fontSize: 12, marginBottom: 16 }}>
            주택 매물 PDF나 이미지를 업로드하면 자동으로 가격과 정보를 추출합니다
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setOcrFile(file);
                    handleOcrUpload(file);
                  }
                }}
                style={{ display: "none" }}
                id="ocr-file-input"
              />
              <button
                onClick={() => document.getElementById('ocr-file-input')?.click()}
                className="button-primary"
                style={{ width: "100%" }}
                disabled={ocrLoading}
              >
                {ocrLoading ? "분석 중..." : "📁 파일 업로드"}
              </button>
              <div className="subtle" style={{ fontSize: 11, marginTop: 4, textAlign: "center" }}>
                PDF, JPG, PNG, WebP 지원
              </div>
            </div>

            {ocrFile && (
              <div style={{ display: "grid", gap: 8 }}>
                <div className="badge" style={{ background: "rgba(255,255,255,0.06)" }}>
                  {ocrFile.name}
                </div>
                {ocrFile.type.startsWith('image/') && (
                  <div style={{ 
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    overflow: "hidden"
                  }}>
                    <img
                      src={URL.createObjectURL(ocrFile)}
                      alt="업로드된 이미지"
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: "200px",
                        objectFit: "contain",
                        background: "rgba(255,255,255,0.05)"
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {ocrError && (
              <div style={{ 
                padding: 12,
                borderRadius: 8,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444",
                fontSize: 12
              }}>
                ⚠️ {ocrError}
              </div>
            )}

            {ocrResult && (
              <div className="glass" style={{ padding: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>📊 추출된 정보</div>
                <div style={{ display: "grid", gap: 8, fontSize: 12, maxHeight: "300px", overflowY: "auto" }}>
                  {ocrResult.price && (
                    <div>
                      <span className="subtle">💰 매매가격:</span>
                      <div style={{ fontWeight: 600, color: "#22c55e" }}>
                        {ocrResult.price.toLocaleString('ko-KR')}원
                        <span className="subtle" style={{ marginLeft: 4 }}>
                          (약 {Math.round(ocrResult.price/100000000*10)/10}억)
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {ocrResult.loanAmount && (
                    <div>
                      <span className="subtle">🏦 대출가능금액:</span>
                      <div style={{ fontWeight: 600, color: "#3b82f6" }}>
                        {ocrResult.loanAmount.toLocaleString('ko-KR')}원
                      </div>
                    </div>
                  )}
                  
                  {ocrResult.monthlyPayment && (
                    <div>
                      <span className="subtle">💳 월 지출:</span>
                      <div style={{ fontWeight: 600, color: "#f59e0b" }}>
                        {ocrResult.monthlyPayment.toLocaleString('ko-KR')}원
                      </div>
                    </div>
                  )}
                  
                  {ocrResult.managementFee && (
                    <div>
                      <span className="subtle">🏢 관리비:</span>
                      <div style={{ fontWeight: 600 }}>
                        {ocrResult.managementFee.toLocaleString('ko-KR')}원
                      </div>
                    </div>
                  )}
                  
                  {ocrResult.interestRate && (
                    <div>
                      <span className="subtle">📈 금리:</span>
                      <div style={{ fontWeight: 600, color: "#8b5cf6" }}>
                        {ocrResult.interestRate}%
                      </div>
                    </div>
                  )}
                  
                  {ocrResult.loanTerm && (
                    <div>
                      <span className="subtle">⏰ 대출기간:</span>
                      <div style={{ fontWeight: 600 }}>
                        {ocrResult.loanTerm}년
                      </div>
                    </div>
                  )}
                  
                  {ocrResult.area && (
                    <div>
                      <span className="subtle">📐 면적:</span>
                      <div style={{ fontWeight: 600 }}>{ocrResult.area}</div>
                    </div>
                  )}
                  
                  {ocrResult.location && (
                    <div>
                      <span className="subtle">📍 위치:</span>
                      <div style={{ fontWeight: 600 }}>{ocrResult.location}</div>
                    </div>
                  )}
                  
                  {ocrResult.type && (
                    <div>
                      <span className="subtle">🏠 주택유형:</span>
                      <div style={{ fontWeight: 600 }}>{ocrResult.type}</div>
                    </div>
                  )}
                  
                  {ocrResult.additionalCosts && (
                    <div>
                      <span className="subtle">💼 부대비용:</span>
                      <div style={{ fontWeight: 600, color: "#ef4444" }}>
                        {ocrResult.additionalCosts.toLocaleString('ko-KR')}원
                      </div>
                      {ocrResult.additionalCostDetails && (
                        <div style={{ marginTop: 4, fontSize: 11 }}>
                          {ocrResult.additionalCostDetails.map((cost: any, index: number) => (
                            <div key={index} className="subtle">
                              • {cost.type}: {cost.amount.toLocaleString('ko-KR')}원
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {ocrResult.keywords && ocrResult.keywords.length > 0 && (
                    <div>
                      <span className="subtle">🏷️ 키워드:</span>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                        {ocrResult.keywords.map((keyword: string, index: number) => (
                          <span key={index} className="badge" style={{ 
                            background: "rgba(34,197,94,0.2)", 
                            color: "#22c55e",
                            fontSize: 10
                          }}>
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ display: "grid", gap: 6, marginTop: 12 }}>
                  {ocrResult.price && (
                    <button
                      onClick={() => {
                        setLoanAmount(ocrResult.price);
                        if (ocrResult.interestRate) setInterestRate(ocrResult.interestRate);
                        if (ocrResult.loanTerm) setLoanTerm(ocrResult.loanTerm);
                      }}
                      className="button-primary"
                      style={{ width: "100%", fontSize: 12 }}
                    >
                      모든 정보 자동 입력
                    </button>
                  )}
                  
                  {ocrResult.summary && (
                    <details style={{ marginTop: 8 }}>
                      <summary className="subtle" style={{ fontSize: 11, cursor: "pointer" }}>
                        📄 원본 텍스트 보기
                      </summary>
                      <div style={{ 
                        marginTop: 8, 
                        padding: 8, 
                        background: "rgba(0,0,0,0.3)", 
                        borderRadius: 6, 
                        fontSize: 10, 
                        lineHeight: 1.4,
                        maxHeight: "150px",
                        overflowY: "auto",
                        whiteSpace: "pre-wrap"
                      }}>
                        {ocrResult.summary}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 참고사항 */}
        <div className="glass" style={{ padding: 16, marginTop: 14 }}>
          <h3 className="black-han-sans-regular" style={{ margin: "0 0 8px 0", fontSize: 16 }}>
            💡 참고사항
          </h3>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: "#bbb" }}>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: "#a855f7" }}>원리금 균등상환:</strong><br />
              매월 동일한 금액을 상환하며, 초기에는 이자 비중이 높습니다.
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ color: "#ec4899" }}>거치식 상환:</strong><br />
              일정 기간 동안 이자만 납부하고, 만기에 원금을 일시 상환합니다.
            </div>
            <div style={{ 
              padding: 8,
              borderRadius: 6,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#ef4444"
            }}>
              ⚠️ 실제 대출 조건은 금융기관별로 다를 수 있습니다.
            </div>
          </div>
        </div>
      </aside>
    </div>
    </AuthGuard>
  );
}

function Metric({ title, value, trend, color }: { title: string; value: string; trend: string; color: string }) {
  return (
    <div className="glass" style={{ padding: 10 }}>
      <div className="subtle" style={{ fontSize: 12 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <div style={{ fontWeight: 900, fontSize: 20 }}>{value}</div>
        <span style={{ color }}>{trend}</span>
      </div>
    </div>
  );
}