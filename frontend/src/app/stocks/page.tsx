"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { formatPrice, formatChange, getChangeColor } from "@/lib/finnhub";
import Swal from 'sweetalert2';
import Link from 'next/link';

interface StockData {
  symbol: string;
  name: string;
  quote: {
    c: number; // Current price
    d: number; // Change
    dp: number; // Percent change
    h: number; // High
    l: number; // Low
    o: number; // Open
    pc: number; // Previous close
  } | null;
  error?: string;
}

interface NewsItem {
  id: number;
  headline: string;
  summary: string;
  url: string;
  image: string;
  source: string;
  datetime: number;
}

export default function StocksPage() {
  const [selectedMarket, setSelectedMarket] = useState<'US' | 'KR'>('US');
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState('');
  const [searchResult, setSearchResult] = useState<StockData | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [translatedNews, setTranslatedNews] = useState<{[key: number]: any}>({});
  const [translating, setTranslating] = useState<{[key: number]: boolean}>({});
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드 확인
  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 초기 로드
  useEffect(() => {
    loadPopularStocks();
    loadMarketNews();
  }, [selectedMarket]); // eslint-disable-line react-hooks/exhaustive-deps

  // 외부 클릭 감지하여 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = document.querySelector('[data-dropdown="suggestions"]');
      const searchInput = document.querySelector('input[placeholder*="주식명"]');
      
      // 드롭다운이나 검색 입력창이 아닌 곳을 클릭했을 때만 닫기
      if (dropdown && searchInput && 
          !dropdown.contains(target) && 
          !searchInput.contains(target)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSuggestions]);

  const loadPopularStocks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stocks/popular?market=${selectedMarket}`);
      const data = await response.json();

      if (data.success) {
        setStocks(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('인기 주식 로드 실패:', error);
      await Swal.fire({
        title: '❌ 로드 실패',
        text: '주식 데이터를 불러오는 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMarketNews = async () => {
    try {
      setNewsLoading(true);
      const response = await fetch('/api/stocks/news?category=general&count=10');
      const data = await response.json();

      if (data.success) {
        setNews(data.data);
      }
    } catch (error) {
      console.error('뉴스 로드 실패:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  // 검색 제안 로드
  const loadSearchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}&limit=8`);
      const data = await response.json();

      if (data.success) {
        setSearchSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('검색 제안 로드 실패:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 검색어 변경 핸들러
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchSymbol(value);
    
    // 디바운스 적용
    clearTimeout((window as any).searchTimeout);
    (window as any).searchTimeout = setTimeout(() => {
      loadSearchSuggestions(value);
    }, 300);
  };

  // 제안 항목 선택
  const handleSuggestionSelect = (suggestion: any) => {
    setSearchSymbol(suggestion.display);
    setShowSuggestions(false);
    handleSearchBySymbol(suggestion.symbol);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSymbol.trim()) return;

    setShowSuggestions(false);
    
    // 한국주식인지 확인 (괄호 안에 6자리 숫자가 있으면 종목코드로 판단)
    const koreanMatch = searchSymbol.match(/\((\d{6})\)/);
    // 미국주식인지 확인 (괄호 안에 영문자가 있으면 미국 주식으로 판단)
    const usMatch = searchSymbol.match(/\(([A-Z]+)\)/);
    
    let symbol;
    if (koreanMatch) {
      symbol = `${koreanMatch[1]}.KS`;
    } else if (usMatch) {
      symbol = usMatch[1];
    } else {
      // 직접 입력한 경우
      symbol = searchSymbol.toUpperCase();
    }
    
    await handleSearchBySymbol(symbol);
  };

  const handleSearchBySymbol = async (symbol: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stocks/quote?symbol=${symbol}`);
      const data = await response.json();

      if (data.success) {
        setSearchResult({
          symbol: data.data.symbol,
          name: data.data.profile?.name || symbol,
          quote: data.data.quote
        });
      } else {
        await Swal.fire({
          title: '❌ 검색 실패',
          text: '해당 주식을 찾을 수 없습니다.',
          icon: 'error',
          confirmButtonText: '확인'
        });
      }
    } catch (error) {
      console.error('주식 검색 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadPopularStocks();
    loadMarketNews();
  };

  // 뉴스 번역 함수
  const translateNewsItem = async (newsItem: NewsItem) => {
    try {
      setTranslating(prev => ({ ...prev, [newsItem.id]: true }));

      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: [newsItem.headline, newsItem.summary],
          targetLang: 'ko'
        }),
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const [translatedHeadline, translatedSummary] = data.data;
        
        setTranslatedNews(prev => ({
          ...prev,
          [newsItem.id]: {
            ...newsItem,
            headline: translatedHeadline,
            summary: translatedSummary,
            isTranslated: true
          }
        }));

        await Swal.fire({
          title: '✅ 번역 완료',
          text: '뉴스가 한글로 번역되었습니다.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error('번역 실패');
      }
    } catch (error) {
      console.error('번역 오류:', error);
      await Swal.fire({
        title: '❌ 번역 실패',
        text: '번역 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인'
      });
    } finally {
      setTranslating(prev => ({ ...prev, [newsItem.id]: false }));
    }
  };

  // 원문 보기
  const showOriginalNews = (newsId: number) => {
    setTranslatedNews(prev => {
      const newState = { ...prev };
      delete newState[newsId];
      return newState;
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StockCard = ({ stock }: { stock: StockData }) => {
    if (!stock.quote) return null;

    const isPositive = stock.quote.d >= 0;
    const changeColor = getChangeColor(stock.quote.d);

    return (
      <div className="glass" style={{ 
        padding: isMobile ? 16 : 20,
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
      }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: 12
        }}>
          <div>
            <h3 style={{ 
              fontSize: isMobile ? 14 : 16,
              fontFamily: 'Pretendard-SemiBold',
              color: '#fff',
              margin: '0 0 4px 0'
            }}>
              {stock.symbol}
            </h3>
            <p style={{ 
              fontSize: 12,
              color: '#ccc',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '150px'
            }}>
              {stock.name}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: isMobile ? 16 : 18,
              fontFamily: 'Pretendard-SemiBold',
              color: '#fff'
            }}>
              {selectedMarket === 'KR' 
                ? formatPrice(stock.quote.c, 'KRW')
                : formatPrice(stock.quote.c, 'USD')
              }
            </div>
            <div style={{ 
              fontSize: 12,
              color: changeColor,
              fontFamily: 'Pretendard-Medium'
            }}>
              {formatChange(stock.quote.d, stock.quote.dp)}
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          fontSize: 11,
          color: '#999'
        }}>
          <div>시가: {selectedMarket === 'KR' 
            ? formatPrice(stock.quote.o, 'KRW')
            : formatPrice(stock.quote.o, 'USD')
          }</div>
          <div>고가: {selectedMarket === 'KR' 
            ? formatPrice(stock.quote.h, 'KRW')
            : formatPrice(stock.quote.h, 'USD')
          }</div>
          <div>저가: {selectedMarket === 'KR' 
            ? formatPrice(stock.quote.l, 'KRW')
            : formatPrice(stock.quote.l, 'USD')
          }</div>
          <div>전일: {selectedMarket === 'KR' 
            ? formatPrice(stock.quote.pc, 'KRW')
            : formatPrice(stock.quote.pc, 'USD')
          }</div>
        </div>
      </div>
    );
  };

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
            <div style={{ fontSize: 40 }}>📈</div>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? 24 : 32,
                fontFamily: 'Pretendard-Bold',
                margin: 0,
                color: '#fff'
              }}>
                주식 대시보드
              </h1>
              <p style={{ 
                fontSize: 16, 
                color: 'rgba(255,255,255,0.8)', 
                margin: "8px 0 0 0" 
              }}>
                실시간 주식 정보와 시장 뉴스를 확인하세요
              </p>
            </div>
          </div>

          {/* 컨트롤 영역 */}
          <div style={{ 
            display: 'flex', 
            gap: 16,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            justifyContent: 'space-between'
          }}>
            {/* 시장 선택 */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSelectedMarket('US')}
                className="button-primary"
                style={{
                  background: selectedMarket === 'US' 
                    ? 'rgba(255,255,255,0.3)' 
                    : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              >
                🇺🇸 미국주식
              </button>
              <button
                onClick={() => setSelectedMarket('KR')}
                className="button-primary"
                style={{
                  background: selectedMarket === 'KR' 
                    ? 'rgba(255,255,255,0.3)' 
                    : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              >
                🇰🇷 한국주식
              </button>
            </div>

            {/* 검색 및 새로고침 */}
            <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: '500px' }}>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="주식명 또는 종목코드 검색 (예: 삼성전자, AAPL)"
                    value={searchSymbol}
                    onChange={handleSearchInputChange}
                    onFocus={() => {
                      if (searchSuggestions.length > 0) setShowSuggestions(true);
                    }}
                    className="input"
                    style={{ 
                      width: '100%',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: '#fff'
                    }}
                  />

                </div>
                <button type="submit" className="button-primary" style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff'
                }}>
                  🔍
                </button>
              </form>
              <Link href="/stocks/portfolio" className="button-primary" style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap'
              }}>
                💼 포트폴리오
              </Link>
              <button
                onClick={refreshData}
                className="button-primary"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff'
                }}
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', 
          gap: 24 
        }}>
          {/* 주식 정보 영역 */}
          <div>
            {/* 검색 결과 */}
            {searchResult && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ 
                  fontSize: 20,
                  fontFamily: 'Pretendard-Bold',
                  color: '#fff',
                  marginBottom: 16
                }}>
                  🔍 검색 결과
                </h2>
                <StockCard stock={searchResult} />
              </div>
            )}

            {/* 인기 주식 */}
            <div>
              <h2 style={{ 
                fontSize: 20,
                fontFamily: 'Pretendard-Bold',
                color: '#fff',
                marginBottom: 16
              }}>
                📊 {selectedMarket === 'US' ? '미국' : '한국'} 인기 주식
              </h2>
              
              {loading ? (
                <div className="glass" style={{ 
                  padding: 40, 
                  textAlign: 'center',
                  color: '#fff'
                }}>
                  <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
                  주식 정보를 불러오는 중...
                </div>
              ) : (
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 16
                }}>
                  {stocks.map((stock, index) => (
                    <StockCard key={`${stock.symbol}-${index}`} stock={stock} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 뉴스 영역 */}
          <aside>
            <h2 style={{ 
              fontSize: 20,
              fontFamily: 'Pretendard-Bold',
              color: '#fff',
              marginBottom: 16
            }}>
              📰 시장 뉴스
            </h2>
            
            {newsLoading ? (
              <div className="glass" style={{ 
                padding: 20, 
                textAlign: 'center',
                color: '#fff'
              }}>
                뉴스를 불러오는 중...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {news.slice(0, 8).map((item, index) => {
                  const currentItem = translatedNews[item.id] || item;
                  const isTranslated = !!translatedNews[item.id];
                  const isTranslating = translating[item.id];

                  return (
                    <div
                      key={`${item.id}-${index}`}
                      className="glass"
                      style={{ 
                        padding: 16,
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* 번역 상태 표시 */}
                      {isTranslated && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#22c55e',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontFamily: 'Pretendard-Medium'
                        }}>
                          🇰🇷 번역됨
                        </div>
                      )}

                      {/* 뉴스 제목 */}
                      <h3 style={{ 
                        fontSize: 14,
                        fontFamily: 'Pretendard-SemiBold',
                        color: '#fff',
                        margin: '0 0 8px 0',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        paddingRight: isTranslated ? '60px' : '0'
                      }}>
                        {currentItem.headline}
                      </h3>

                      {/* 뉴스 요약 */}
                      <p style={{ 
                        fontSize: 12,
                        color: '#ccc',
                        margin: '0 0 12px 0',
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {currentItem.summary}
                      </p>

                      {/* 하단 정보 및 버튼 */}
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 10,
                        color: '#999',
                        gap: 8
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                          <span>{item.source}</span>
                          <span>{formatDateTime(item.datetime)}</span>
                        </div>

                        {/* 버튼 그룹 */}
                        <div style={{ display: 'flex', gap: 4 }}>
                          {/* 번역/원문 버튼 */}
                          {!isTranslated ? (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                translateNewsItem(item);
                              }}
                              disabled={isTranslating}
                              style={{
                                background: isTranslating ? 'rgba(156, 163, 175, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: isTranslating ? '#9ca3af' : '#3b82f6',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '10px',
                                cursor: isTranslating ? 'not-allowed' : 'pointer',
                                fontFamily: 'Pretendard-Medium',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!isTranslating) {
                                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isTranslating) {
                                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                }
                              }}
                            >
                              {isTranslating ? '🔄 번역중...' : '🇰🇷 번역'}
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                showOriginalNews(item.id);
                              }}
                              style={{
                                background: 'rgba(156, 163, 175, 0.2)',
                                color: '#9ca3af',
                                border: '1px solid rgba(156, 163, 175, 0.3)',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                fontSize: '10px',
                                cursor: 'pointer',
                                fontFamily: 'Pretendard-Medium',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(156, 163, 175, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(156, 163, 175, 0.2)';
                              }}
                            >
                              🇺🇸 원문
                            </button>
                          )}

                          {/* 링크 버튼 */}
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: 'rgba(34, 197, 94, 0.2)',
                              color: '#22c55e',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              fontSize: '10px',
                              textDecoration: 'none',
                              fontFamily: 'Pretendard-Medium',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                            }}
                          >
                            🔗 링크
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      </div>
      
      {/* 검색 드롭다운 - 클라이언트 사이드에서만 렌더링 */}
      {isClient && showSuggestions && searchSuggestions.length > 0 && (
        <div 
          data-dropdown="suggestions"
          style={{
            position: 'fixed',
            top: '250px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(500px, 90vw)',
            background: 'rgba(0, 0, 0, 0.98)',
            border: '3px solid rgba(255,255,255,0.8)',
            borderRadius: '16px',
            backdropFilter: 'blur(40px)',
            zIndex: 2147483647,
            maxHeight: '350px',
            overflowY: 'auto',
            boxShadow: '0 50px 100px rgba(0,0,0,0.95), 0 0 0 3px rgba(255,255,255,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            isolation: 'isolate',
            willChange: 'transform',
            contain: 'layout style paint',
            pointerEvents: 'auto'
          }}
        >
          {searchSuggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.symbol}-${index}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSuggestionSelect(suggestion);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              style={{
                padding: '14px 18px',
                cursor: 'pointer',
                borderBottom: index < searchSuggestions.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                transition: 'all 0.2s ease',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'scale(1.01)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{
                    color: '#fff',
                    fontSize: '14px',
                    fontFamily: 'Pretendard-Medium'
                  }}>
                    {suggestion.name}
                  </div>
                  <div style={{
                    color: '#ccc',
                    fontSize: '12px',
                    marginTop: '2px'
                  }}>
                    {suggestion.code}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{
                    fontSize: '10px',
                    color: suggestion.market === 'KR' ? '#ef4444' : '#3b82f6',
                    background: suggestion.market === 'KR' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                    padding: '3px 7px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    {suggestion.market === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: suggestion.type === 'match' ? '#4ade80' : 
                           suggestion.type === 'popular' ? '#fbbf24' : '#94a3b8',
                    background: suggestion.type === 'match' ? 'rgba(74, 222, 128, 0.3)' : 
                               suggestion.type === 'popular' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                    padding: '3px 7px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    {suggestion.type === 'match' ? '일치' : 
                     suggestion.type === 'popular' ? '인기' : '관련'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AuthGuard>
  );
}
