"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { formatPrice, formatChange, getChangeColor } from "@/lib/finnhub";
import Swal from 'sweetalert2';
import Link from 'next/link';

interface PortfolioItem {
  id: number;
  symbol: string;
  name: string;
  quantity: number;
  purchase_price: number;
  market: string;
  current_price?: number;
  current_value?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
  created_at: string;
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    quantity: '',
    purchase_price: '',
    market: 'US'
  });

  // 반응형 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 초기 로드
  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stocks/portfolio');
      const data = await response.json();

      if (data.success) {
        // 현재가 정보 추가
        const portfolioWithPrices = await Promise.all(
          data.portfolio.map(async (item: PortfolioItem) => {
            try {
              const priceResponse = await fetch(`/api/stocks/quote?symbol=${item.symbol}`);
              const priceData = await priceResponse.json();
              
              if (priceData.success && priceData.data.quote) {
                const currentPrice = priceData.data.quote.c;
                const currentValue = currentPrice * item.quantity;
                const purchaseValue = item.purchase_price * item.quantity;
                const profitLoss = currentValue - purchaseValue;
                const profitLossPercent = (profitLoss / purchaseValue) * 100;

                return {
                  ...item,
                  current_price: currentPrice,
                  current_value: currentValue,
                  profit_loss: profitLoss,
                  profit_loss_percent: profitLossPercent
                };
              }
              return item;
            } catch (error) {
              return item;
            }
          })
        );

        setPortfolio(portfolioWithPrices);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('포트폴리오 로드 실패:', error);
      await Swal.fire({
        title: '❌ 로드 실패',
        text: '포트폴리오를 불러오는 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.name || !formData.quantity || !formData.purchase_price) {
      await Swal.fire({
        title: '모든 필드를 입력해주세요',
        icon: 'warning',
        confirmButtonText: '확인'
      });
      return;
    }

    try {
      const response = await fetch('/api/stocks/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: formData.symbol.toUpperCase(),
          name: formData.name,
          quantity: parseFloat(formData.quantity),
          purchase_price: parseFloat(formData.purchase_price),
          market: formData.market
        })
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          title: '✅ 추가 완료!',
          text: '포트폴리오에 종목이 추가되었습니다.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        
        setFormData({
          symbol: '',
          name: '',
          quantity: '',
          purchase_price: '',
          market: 'US'
        });
        setShowAddForm(false);
        loadPortfolio();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      await Swal.fire({
        title: '❌ 추가 실패',
        text: error.message || '종목 추가 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인'
      });
    }
  };

  const handleDeleteStock = async (id: number, symbol: string) => {
    const result = await Swal.fire({
      title: `${symbol}을(를) 삭제하시겠습니까?`,
      text: '포트폴리오에서 해당 종목이 제거됩니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/stocks/portfolio?id=${id}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
          await Swal.fire({
            title: '✅ 삭제 완료',
            text: '포트폴리오에서 삭제되었습니다.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
          loadPortfolio();
        } else {
          throw new Error(data.error);
        }
      } catch (error: any) {
        await Swal.fire({
          title: '❌ 삭제 실패',
          text: error.message || '삭제 중 오류가 발생했습니다.',
          icon: 'error',
          confirmButtonText: '확인'
        });
      }
    }
  };

  // 총 포트폴리오 요약 계산
  const portfolioSummary = portfolio.reduce(
    (acc, item) => {
      const purchaseValue = item.purchase_price * item.quantity;
      const currentValue = item.current_value || purchaseValue;
      const profitLoss = item.profit_loss || 0;

      return {
        totalPurchaseValue: acc.totalPurchaseValue + purchaseValue,
        totalCurrentValue: acc.totalCurrentValue + currentValue,
        totalProfitLoss: acc.totalProfitLoss + profitLoss
      };
    },
    { totalPurchaseValue: 0, totalCurrentValue: 0, totalProfitLoss: 0 }
  );

  const totalProfitLossPercent = portfolioSummary.totalPurchaseValue > 0
    ? (portfolioSummary.totalProfitLoss / portfolioSummary.totalPurchaseValue) * 100
    : 0;

  return (
    <AuthGuard>
      <div className="container" style={{ 
        padding: isMobile ? "10px" : "20px",
        minHeight: "100vh",
        maxWidth: "1400px",
        margin: "0 auto"
      }}>
        {/* 헤더 */}
        <div className="glass" style={{ 
          padding: isMobile ? 20 : 32, 
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 40 }}>💼</div>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? 24 : 32,
                fontFamily: 'Pretendard-Bold',
                margin: 0,
                color: '#fff'
              }}>
                내 포트폴리오
              </h1>
              <p style={{ 
                fontSize: 16, 
                color: 'rgba(255,255,255,0.8)', 
                margin: "8px 0 0 0" 
              }}>
                보유 주식을 관리하고 수익률을 확인하세요
              </p>
            </div>
          </div>

          {/* 컨트롤 영역 */}
          <div style={{ 
            display: 'flex', 
            gap: 12,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between'
          }}>
            <Link href="/stocks" className="button-primary" style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              textDecoration: 'none'
            }}>
              ← 주식 대시보드
            </Link>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="button-primary"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              >
                ➕ 종목 추가
              </button>
              <button
                onClick={loadPortfolio}
                className="button-primary"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              >
                🔄 새로고침
              </button>
            </div>
          </div>
        </div>

        {/* 포트폴리오 요약 */}
        {portfolio.length > 0 && (
          <div className="glass" style={{ 
            padding: isMobile ? 20 : 24,
            marginBottom: 24
          }}>
            <h2 style={{ 
              fontSize: 18,
              fontFamily: 'Pretendard-Bold',
              color: '#fff',
              marginBottom: 16
            }}>
              📊 포트폴리오 요약
            </h2>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
              gap: 16
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>총 투자금액</div>
                <div style={{ fontSize: 18, fontFamily: 'Pretendard-SemiBold', color: '#fff' }}>
                  {formatPrice(portfolioSummary.totalPurchaseValue, 'USD')}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>현재가치</div>
                <div style={{ fontSize: 18, fontFamily: 'Pretendard-SemiBold', color: '#fff' }}>
                  {formatPrice(portfolioSummary.totalCurrentValue, 'USD')}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>손익</div>
                <div style={{ 
                  fontSize: 18, 
                  fontFamily: 'Pretendard-SemiBold', 
                  color: getChangeColor(portfolioSummary.totalProfitLoss)
                }}>
                  {formatChange(portfolioSummary.totalProfitLoss, totalProfitLossPercent)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>보유종목</div>
                <div style={{ fontSize: 18, fontFamily: 'Pretendard-SemiBold', color: '#fff' }}>
                  {portfolio.length}개
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 종목 추가 폼 */}
        {showAddForm && (
          <div className="glass" style={{ 
            padding: isMobile ? 20 : 24,
            marginBottom: 24
          }}>
            <h2 style={{ 
              fontSize: 18,
              fontFamily: 'Pretendard-Bold',
              color: '#fff',
              marginBottom: 16
            }}>
              ➕ 새 종목 추가
            </h2>

            <form onSubmit={handleAddStock} style={{ 
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr 1fr 1fr 1fr',
              gap: 12,
              alignItems: 'end'
            }}>
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 12,
                  color: '#ccc',
                  marginBottom: 4
                }}>
                  시장
                </label>
                <select
                  value={formData.market}
                  onChange={(e) => setFormData({...formData, market: e.target.value})}
                  className="input"
                  style={{ width: '100%' }}
                >
                  <option value="US">🇺🇸 미국</option>
                  <option value="KR">🇰🇷 한국</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 12,
                  color: '#ccc',
                  marginBottom: 4
                }}>
                  심볼
                </label>
                <input
                  type="text"
                  placeholder="AAPL, 005930.KS"
                  value={formData.symbol}
                  onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 12,
                  color: '#ccc',
                  marginBottom: 4
                }}>
                  종목명
                </label>
                <input
                  type="text"
                  placeholder="Apple Inc."
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 12,
                  color: '#ccc',
                  marginBottom: 4
                }}>
                  수량
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  placeholder="10"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 12,
                  color: '#ccc',
                  marginBottom: 4
                }}>
                  매입가
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                  className="input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ 
                gridColumn: isMobile ? '1' : 'span 5',
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                marginTop: 16
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="button-primary"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="button-primary"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 포트폴리오 목록 */}
        <div>
          <h2 style={{ 
            fontSize: 20,
            fontFamily: 'Pretendard-Bold',
            color: '#fff',
            marginBottom: 16
          }}>
            📈 보유 종목
          </h2>
          
          {loading ? (
            <div className="glass" style={{ 
              padding: 40, 
              textAlign: 'center',
              color: '#fff'
            }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
              포트폴리오를 불러오는 중...
            </div>
          ) : portfolio.length === 0 ? (
            <div className="glass" style={{ 
              padding: 40, 
              textAlign: 'center',
              color: '#fff'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💼</div>
              <h3 style={{ fontFamily: 'Pretendard-SemiBold', marginBottom: 8 }}>
                포트폴리오가 비어있습니다
              </h3>
              <p style={{ color: '#ccc', marginBottom: 20 }}>
                첫 번째 종목을 추가해보세요!
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="button-primary"
              >
                종목 추가하기
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: 16
            }}>
              {portfolio.map((item) => (
                <div key={item.id} className="glass" style={{ 
                  padding: 20,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: 12
                  }}>
                    <div>
                      <h3 style={{ 
                        fontSize: 16,
                        fontFamily: 'Pretendard-SemiBold',
                        color: '#fff',
                        margin: '0 0 4px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}>
                        {item.market === 'KR' ? '🇰🇷' : '🇺🇸'} {item.symbol}
                      </h3>
                      <p style={{ 
                        fontSize: 12,
                        color: '#ccc',
                        margin: 0
                      }}>
                        {item.name}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteStock(item.id, item.symbol)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  </div>
                  
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    fontSize: 12,
                    marginBottom: 12
                  }}>
                    <div>
                      <div style={{ color: '#999', marginBottom: 2 }}>보유수량</div>
                      <div style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                        {item.quantity.toLocaleString()}주
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999', marginBottom: 2 }}>매입가</div>
                      <div style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                        {item.market === 'KR' 
                          ? formatPrice(item.purchase_price, 'KRW')
                          : formatPrice(item.purchase_price, 'USD')
                        }
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999', marginBottom: 2 }}>현재가</div>
                      <div style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                        {item.current_price 
                          ? (item.market === 'KR' 
                            ? formatPrice(item.current_price, 'KRW')
                            : formatPrice(item.current_price, 'USD')
                          )
                          : '로딩중...'
                        }
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#999', marginBottom: 2 }}>평가손익</div>
                      <div style={{ 
                        color: item.profit_loss ? getChangeColor(item.profit_loss) : '#999',
                        fontFamily: 'Pretendard-Medium'
                      }}>
                        {item.profit_loss && item.profit_loss_percent
                          ? formatChange(item.profit_loss, item.profit_loss_percent)
                          : '계산중...'
                        }
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    paddingTop: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12
                  }}>
                    <div>
                      <span style={{ color: '#999' }}>투자금액: </span>
                      <span style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                        {item.market === 'KR' 
                          ? formatPrice(item.purchase_price * item.quantity, 'KRW')
                          : formatPrice(item.purchase_price * item.quantity, 'USD')
                        }
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#999' }}>평가금액: </span>
                      <span style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                        {item.current_value 
                          ? (item.market === 'KR' 
                            ? formatPrice(item.current_value, 'KRW')
                            : formatPrice(item.current_value, 'USD')
                          )
                          : '계산중...'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
