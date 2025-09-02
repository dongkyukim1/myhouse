// Finnhub API 유틸리티
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// 주식 기본 정보 인터페이스
export interface StockQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface StockProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

export interface NewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface CandleData {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string; // Status
  t: number[]; // Timestamps
  v: number[]; // Volumes
}

// API 호출 공통 함수
async function finnhubAPI(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
  url.searchParams.set('token', FINNHUB_API_KEY || '');
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// 주식 현재가 조회
export async function getStockQuote(symbol: string): Promise<StockQuote> {
  return finnhubAPI('/quote', { symbol });
}

// 주식 프로필 조회
export async function getStockProfile(symbol: string): Promise<StockProfile> {
  return finnhubAPI('/stock/profile2', { symbol });
}

// 주식 뉴스 조회
export async function getStockNews(symbol: string, count: number = 10): Promise<NewsItem[]> {
  const from = new Date();
  const to = new Date();
  from.setDate(from.getDate() - 7); // 1주일 전부터
  
  return finnhubAPI('/company-news', {
    symbol,
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  });
}

// 일반 시장 뉴스 조회
export async function getMarketNews(category: string = 'general', count: number = 20): Promise<NewsItem[]> {
  return finnhubAPI('/news', { category });
}

// 주식 캔들 데이터 조회 (차트용)
export async function getCandleData(
  symbol: string, 
  resolution: string = 'D', 
  days: number = 30
): Promise<CandleData> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - (days * 24 * 60 * 60);
  
  return finnhubAPI('/stock/candle', {
    symbol,
    resolution,
    from: from.toString(),
    to: to.toString()
  });
}

// 인기 주식 심볼 목록
export const POPULAR_STOCKS = {
  US: [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'TSLA', name: 'Tesla, Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', name: 'Meta Platforms, Inc.' },
    { symbol: 'NFLX', name: 'Netflix, Inc.' }
  ],
  KR: [
    { symbol: '005930.KS', name: '삼성전자' },
    { symbol: '000660.KS', name: 'SK하이닉스' },
    { symbol: '207940.KS', name: '삼성바이오로직스' },
    { symbol: '005380.KS', name: '현대차' },
    { symbol: '006400.KS', name: '삼성SDI' },
    { symbol: '051910.KS', name: 'LG화학' },
    { symbol: '028260.KS', name: '삼성물산' },
    { symbol: '012330.KS', name: '현대모비스' }
  ]
};

// 환율 조회
export async function getForexQuote(symbol: string = 'OANDA:USD_KRW'): Promise<StockQuote> {
  return finnhubAPI('/forex/rates', { base: 'USD', target: 'KRW' });
}

// 주식 검색
export async function searchStocks(query: string): Promise<any> {
  return finnhubAPI('/search', { q: query });
}

// 기술적 지표 조회
export async function getTechnicalIndicator(
  symbol: string,
  indicator: string = 'rsi',
  resolution: string = 'D'
): Promise<any> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - (30 * 24 * 60 * 60); // 30일
  
  return finnhubAPI('/indicator', {
    symbol,
    resolution,
    from: from.toString(),
    to: to.toString(),
    indicator
  });
}

// 가격 포맷팅 유틸리티
export function formatPrice(price: number, currency: string = 'USD'): string {
  // null, undefined, NaN 체크
  const safePrice = typeof price === 'number' && !isNaN(price) ? price : 0;
  
  if (currency === 'KRW') {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(safePrice);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(safePrice);
}

// 변화율 포맷팅
export function formatChange(change: number, percent: number): string {
  // null, undefined, NaN 체크
  const safeChange = typeof change === 'number' && !isNaN(change) ? change : 0;
  const safePercent = typeof percent === 'number' && !isNaN(percent) ? percent : 0;
  
  const sign = safeChange >= 0 ? '+' : '';
  return `${sign}${safeChange.toFixed(2)} (${sign}${safePercent.toFixed(2)}%)`;
}

// 색상 결정 (상승/하락)
export function getChangeColor(change: number): string {
  // null, undefined, NaN 체크
  const safeChange = typeof change === 'number' && !isNaN(change) ? change : 0;
  
  if (safeChange > 0) return '#ef4444'; // 상승 (빨간색)
  if (safeChange < 0) return '#3b82f6'; // 하락 (파란색)
  return '#6b7280'; // 보합 (회색)
}
