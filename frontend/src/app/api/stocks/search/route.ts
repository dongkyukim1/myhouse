import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store'; // 캐시 비활성화

// 주식 목록 캐시
let stocksCache: any[] = [];
let lastCacheUpdate = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1시간

// 주식 목록 가져오기
async function getStocksList(): Promise<any[]> {
  const now = Date.now();
  
  // 캐시가 유효한지 확인
  if (stocksCache.length > 0 && (now - lastCacheUpdate) < CACHE_DURATION) {
    return stocksCache;
  }

  try {
    // symbols API에서 직접 KRX와 Finnhub API 호출
    const [krStocks, usStocks] = await Promise.allSettled([
      getKoreanStocksFromAPI(),
      getUSStocksFromAPI()
    ]);

    const allStocks = [];
    
    if (krStocks.status === 'fulfilled') {
      allStocks.push(...krStocks.value);
    }
    
    if (usStocks.status === 'fulfilled') {
      allStocks.push(...usStocks.value);
    }

    if (allStocks.length > 0) {
      stocksCache = allStocks;
      lastCacheUpdate = now;
      return stocksCache;
    }
  } catch (error) {
    console.error('주식 목록 가져오기 실패:', error);
  }

  // API 실패 시 기본 목록 반환
  return getDefaultStocks();
}

// 한국 주식 직접 조회
async function getKoreanStocksFromAPI(): Promise<any[]> {
  try {
    const KRX_API_KEY = process.env.KRX_API_KEY;
    const today = new Date();
    const kstTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
    
    let businessDay = new Date(kstTime);
    if (businessDay.getFullYear() === 2025 && businessDay.getMonth() === 0 && businessDay.getDate() === 1) {
      businessDay = new Date(2025, 0, 2);
    } else {
      while (businessDay.getDay() === 0 || businessDay.getDay() === 6) {
        businessDay.setDate(businessDay.getDate() - 1);
      }
    }
    
    const baseDate = `${businessDay.getFullYear()}${String(businessDay.getMonth() + 1).padStart(2, '0')}${String(businessDay.getDate()).padStart(2, '0')}`;

    // KOSPI 주식 가져오기
    const kospiResponse = await fetch(
      `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${KRX_API_KEY}&resultType=json&numOfRows=200&pageNo=1&basDt=${baseDate}&mrktCtg=KOSPI`
    );
    
    const kospiData = await kospiResponse.json();
    const stocks = [];
    
    if (kospiData?.response?.body?.items?.item) {
      const items = Array.isArray(kospiData.response.body.items.item) 
        ? kospiData.response.body.items.item 
        : [kospiData.response.body.items.item];
      
      stocks.push(...items
        .filter((item: any) => item.itmsNm && item.srtnCd)
        .map((item: any) => ({
          symbol: `${item.srtnCd}.KS`,
          name: item.itmsNm,
          code: item.srtnCd,
          market: 'KR',
          exchange: 'KOSPI',
          keywords: generateKoreanKeywords(item.itmsNm, item.srtnCd)
        }))
      );
    }

    // KOSDAQ도 추가 (200개만)
    try {
      const kosdaqResponse = await fetch(
        `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${KRX_API_KEY}&resultType=json&numOfRows=100&pageNo=1&basDt=${baseDate}&mrktCtg=KOSDAQ`
      );
      
      const kosdaqData = await kosdaqResponse.json();
      
      if (kosdaqData?.response?.body?.items?.item) {
        const kosdaqItems = Array.isArray(kosdaqData.response.body.items.item) 
          ? kosdaqData.response.body.items.item 
          : [kosdaqData.response.body.items.item];
        
        stocks.push(...kosdaqItems
          .filter((item: any) => item.itmsNm && item.srtnCd)
          .map((item: any) => ({
            symbol: `${item.srtnCd}.KS`,
            name: item.itmsNm,
            code: item.srtnCd,
            market: 'KR',
            exchange: 'KOSDAQ',
            keywords: generateKoreanKeywords(item.itmsNm, item.srtnCd)
          }))
        );
      }
    } catch (kosdaqError) {
      console.log('KOSDAQ 조회 건너뜀:', kosdaqError);
    }

    return stocks;
  } catch (error) {
    console.error('한국 주식 조회 오류:', error);
    return [];
  }
}

// 미국 주식 직접 조회
async function getUSStocksFromAPI(): Promise<any[]> {
  try {
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    const response = await fetch(`https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${FINNHUB_API_KEY}`);
    const data = await response.json();
    
    return data
      .filter((stock: any) => 
        stock.type === 'Common Stock' && 
        stock.symbol && 
        stock.description &&
        !stock.symbol.includes('.') &&
        stock.symbol.length <= 5
      )
      .slice(0, 100) // 상위 100개만 (캐시 크기 제한)
      .map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.description,
        code: stock.symbol,
        market: 'US',
        exchange: 'US',
        keywords: generateUSKeywords(stock.description, stock.symbol)
      }));
  } catch (error) {
    console.error('미국 주식 조회 오류:', error);
    return [];
  }
}

// 한국어 키워드 생성
function generateKoreanKeywords(name: string, code: string): string[] {
  const keywords = [code.toLowerCase()];
  const nameWords = name.split(/[\s\(\)]/g).filter(word => word.length > 0);
  keywords.push(...nameWords.map(word => word.toLowerCase()));
  
  // 업종별 키워드 추가
  const industryMap: { [key: string]: string[] } = {
    '삼성': ['samsung', '전자', '반도체'],
    'SK': ['에스케이', '통신', '화학'],
    'LG': ['엘지', '전자', '화학'],
    '현대': ['hyundai', '자동차', '차'],
    '네이버': ['naver', '포털', 'it'],
    '카카오': ['kakao', '톡', 'it'],
    '전자': ['electronics', 'tech'],
    '화학': ['chemical'],
    '자동차': ['auto', 'car'],
    '은행': ['bank', '금융'],
    '바이오': ['bio', '제약']
  };
  
  Object.entries(industryMap).forEach(([key, words]) => {
    if (name.includes(key)) {
      keywords.push(...words);
    }
  });
  
  return [...new Set(keywords)];
}

// 영어 키워드 생성
function generateUSKeywords(name: string, symbol: string): string[] {
  const keywords = [symbol.toLowerCase()];
  const nameWords = name.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  keywords.push(...nameWords);
  return [...new Set(keywords)];
}

// 기본 주식 목록 (API 실패 시 사용)
function getDefaultStocks(): any[] {
  return [
    // 미국 주식
    { code: 'AAPL', name: 'Apple Inc.', symbol: 'AAPL', market: 'US', keywords: ['apple', 'iphone', 'mac', 'tech'] },
    { code: 'MSFT', name: 'Microsoft Corporation', symbol: 'MSFT', market: 'US', keywords: ['microsoft', 'windows', 'office'] },
    { code: 'GOOGL', name: 'Alphabet Inc.', symbol: 'GOOGL', market: 'US', keywords: ['google', 'alphabet', 'search'] },
    { code: 'TSLA', name: 'Tesla, Inc.', symbol: 'TSLA', market: 'US', keywords: ['tesla', 'electric', 'car', 'ev'] },
    { code: 'AMZN', name: 'Amazon.com, Inc.', symbol: 'AMZN', market: 'US', keywords: ['amazon', 'aws', 'cloud'] },
    
    // 한국 주식
    { code: '005930', name: '삼성전자', symbol: '005930.KS', market: 'KR', keywords: ['삼성', '전자', 'samsung'] },
    { code: '000660', name: 'SK하이닉스', symbol: '000660.KS', market: 'KR', keywords: ['sk', '하이닉스', 'hynix'] },
    { code: '207940', name: '삼성바이오로직스', symbol: '207940.KS', market: 'KR', keywords: ['삼성', '바이오'] },
    { code: '005380', name: '현대차', symbol: '005380.KS', market: 'KR', keywords: ['현대', '자동차', 'hyundai'] },
    { code: '035420', name: 'NAVER', symbol: '035420.KS', market: 'KR', keywords: ['네이버', 'naver', '포털'] }
  ];
}

// 주식 검색 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    // 최신 주식 목록 가져오기
    const allStocks = await getStocksList();
    
    if (!query.trim()) {
      // 빈 검색어일 때 인기 주식들 (한국+미국 섞어서)
      const koreanStocks = allStocks.filter(stock => stock.market === 'KR').slice(0, Math.ceil(limit/2));
      const usStocks = allStocks.filter(stock => stock.market === 'US').slice(0, Math.floor(limit/2));
      
      const popularSuggestions = [...koreanStocks, ...usStocks].map(stock => ({
        symbol: stock.symbol,
        code: stock.code,
        name: stock.name,
        display: `${stock.name} (${stock.code})`,
        type: 'popular',
        market: stock.market
      }));
      
      return NextResponse.json({
        success: true,
        suggestions: popularSuggestions,
        total: allStocks.length
      });
    }

    const searchQuery = query.toLowerCase().trim();
    
    // 모든 주식에서 검색
    const matchedStocks = allStocks.filter(stock => {
      const nameMatch = stock.name.toLowerCase().includes(searchQuery);
      const codeMatch = stock.code.toLowerCase().includes(searchQuery);
      const keywordMatch = stock.keywords && stock.keywords.some((keyword: string) => 
        keyword.toLowerCase().includes(searchQuery)
      );
      return nameMatch || codeMatch || keywordMatch;
    }).map(stock => ({
      ...stock,
      display: `${stock.name} (${stock.code})`
    }));

    // 정확도에 따른 정렬
    const sortedMatches = matchedStocks.sort((a, b) => {
      // 종목명이 정확히 일치하는 경우 우선순위
      if (a.name.toLowerCase() === searchQuery) return -1;
      if (b.name.toLowerCase() === searchQuery) return 1;
      
      // 종목코드가 정확히 일치하는 경우 우선순위
      if (a.code.toLowerCase() === searchQuery) return -1;
      if (b.code.toLowerCase() === searchQuery) return 1;
      
      // 종목명이 검색어로 시작하는 경우 우선순위
      if (a.name.toLowerCase().startsWith(searchQuery)) return -1;
      if (b.name.toLowerCase().startsWith(searchQuery)) return 1;
      
      // 종목코드가 검색어로 시작하는 경우 우선순위
      if (a.code.toLowerCase().startsWith(searchQuery)) return -1;
      if (b.code.toLowerCase().startsWith(searchQuery)) return 1;
      
      return 0;
    }).slice(0, limit);

    const suggestions = sortedMatches.map(stock => ({
      symbol: stock.symbol,
      code: stock.code,
      name: stock.name,
      display: stock.display,
      type: 'match',
      market: stock.market,
      exchange: stock.exchange || stock.market
    }));

    return NextResponse.json({
      success: true,
      query: searchQuery,
      suggestions: suggestions.slice(0, limit),
      count: suggestions.length
    });

  } catch (error: any) {
    console.error('주식 검색 오류:', error);
    return NextResponse.json(
      { 
        error: '주식 검색 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
