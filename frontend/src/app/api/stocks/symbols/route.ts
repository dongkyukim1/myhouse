import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store'; // 캐시 비활성화

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const KRX_API_KEY = process.env.KRX_API_KEY;

// 캐시된 주식 목록 (실제 환경에서는 Redis 사용 권장)
let cachedUSStocks: any[] = [];
let cachedKRStocks: any[] = [];
let lastUpdateTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

// 미국 주식 심볼 목록 가져오기
async function getUSStockSymbols(): Promise<any[]> {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${FINNHUB_API_KEY}`);
    const data = await response.json();
    
    // 주요 거래소만 필터링하고 상위 500개만 선택
    const filteredStocks = data
      .filter((stock: any) => 
        stock.type === 'Common Stock' && 
        stock.symbol && 
        stock.description &&
        !stock.symbol.includes('.') && // 특수 심볼 제외
        stock.symbol.length <= 5 // 너무 긴 심볼 제외
      )
      .slice(0, 100) // 캐시 크기 제한
      .map((stock: any) => ({
        symbol: stock.symbol,
        name: stock.description,
        code: stock.symbol,
        market: 'US',
        exchange: 'US',
        keywords: generateKeywords(stock.description, stock.symbol)
      }));

    return filteredStocks;
  } catch (error) {
    console.error('미국 주식 목록 조회 오류:', error);
    return [];
  }
}

// 한국 주식 목록 가져오기 (KRX API 활용)
async function getKRStockSymbols(): Promise<any[]> {
  try {
    const today = new Date();
    const kstTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
    
    // 영업일 계산
    let businessDay = new Date(kstTime);
    if (businessDay.getFullYear() === 2025 && businessDay.getMonth() === 0 && businessDay.getDate() === 1) {
      businessDay = new Date(2025, 0, 2);
    } else {
      while (businessDay.getDay() === 0 || businessDay.getDay() === 6) {
        businessDay.setDate(businessDay.getDate() - 1);
      }
    }
    
    const baseDate = `${businessDay.getFullYear()}${String(businessDay.getMonth() + 1).padStart(2, '0')}${String(businessDay.getDate()).padStart(2, '0')}`;

    const response = await fetch(
              `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${KRX_API_KEY}&resultType=json&numOfRows=200&pageNo=1&basDt=${baseDate}&mrktCtg=KOSPI`
    );
    
    const data = await response.json();
    
    if (data?.response?.body?.items?.item) {
      const items = Array.isArray(data.response.body.items.item) 
        ? data.response.body.items.item 
        : [data.response.body.items.item];
      
      const stocks = items
        .filter((item: any) => item.itmsNm && item.srtnCd)
        .map((item: any) => ({
          symbol: `${item.srtnCd}.KS`,
          name: item.itmsNm,
          code: item.srtnCd,
          market: 'KR',
          exchange: item.mrktCtg || 'KOSPI',
          keywords: generateKoreanKeywords(item.itmsNm, item.srtnCd)
        }));

      // KOSDAQ도 추가로 가져오기
      try {
        const kosdaqResponse = await fetch(
          `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${KRX_API_KEY}&resultType=json&numOfRows=100&pageNo=1&basDt=${baseDate}&mrktCtg=KOSDAQ`
        );
        
        const kosdaqData = await kosdaqResponse.json();
        
        if (kosdaqData?.response?.body?.items?.item) {
          const kosdaqItems = Array.isArray(kosdaqData.response.body.items.item) 
            ? kosdaqData.response.body.items.item 
            : [kosdaqData.response.body.items.item];
          
          const kosdaqStocks = kosdaqItems
            .filter((item: any) => item.itmsNm && item.srtnCd)
            .map((item: any) => ({
              symbol: `${item.srtnCd}.KS`,
              name: item.itmsNm,
              code: item.srtnCd,
              market: 'KR',
              exchange: item.mrktCtg || 'KOSDAQ',
              keywords: generateKoreanKeywords(item.itmsNm, item.srtnCd)
            }));
          
          stocks.push(...kosdaqStocks);
        }
      } catch (kosdaqError) {
        console.error('KOSDAQ 데이터 조회 오류:', kosdaqError);
      }

      return stocks;
    }
    
    return [];
  } catch (error) {
    console.error('한국 주식 목록 조회 오류:', error);
    return [];
  }
}

// 영어 키워드 생성
function generateKeywords(name: string, symbol: string): string[] {
  const keywords = [symbol.toLowerCase()];
  
  // 회사명에서 키워드 추출
  const nameWords = name.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  keywords.push(...nameWords);
  
  // 업종별 키워드 추가
  const industryKeywords: { [key: string]: string[] } = {
    'technology': ['tech', 'software', 'digital'],
    'microsoft': ['windows', 'office', 'cloud', 'azure'],
    'apple': ['iphone', 'mac', 'ios'],
    'google': ['search', 'android', 'youtube'],
    'amazon': ['aws', 'ecommerce', 'retail'],
    'tesla': ['electric', 'ev', 'auto'],
    'netflix': ['streaming', 'entertainment'],
    'facebook': ['social', 'meta'],
    'nvidia': ['gpu', 'ai', 'graphics'],
    'pharmaceutical': ['pharma', 'drug', 'medicine'],
    'bank': ['banking', 'financial', 'finance'],
    'energy': ['oil', 'gas', 'renewable'],
    'automotive': ['car', 'auto', 'vehicle']
  };
  
  Object.entries(industryKeywords).forEach(([key, words]) => {
    if (name.toLowerCase().includes(key)) {
      keywords.push(...words);
    }
  });
  
  return [...new Set(keywords)];
}

// 한국어 키워드 생성
function generateKoreanKeywords(name: string, code: string): string[] {
  const keywords = [code];
  
  // 회사명에서 키워드 추출
  const nameWords = name.split(/[\s\(\)]/g).filter(word => word.length > 0);
  keywords.push(...nameWords);
  
  // 업종별 키워드 추가
  const industryKeywords: { [key: string]: string[] } = {
    '삼성': ['samsung', '전자', '반도체', 'galaxy'],
    'SK': ['에스케이', '통신', '화학', '반도체'],
    'LG': ['엘지', '전자', '화학', '디스플레이'],
    '현대': ['hyundai', '자동차', '차', '모터'],
    '포스코': ['posco', '철강', '제철'],
    '네이버': ['naver', '포털', '검색', 'it'],
    '카카오': ['kakao', '톡', '게임', 'it'],
    '셀트리온': ['celltrion', '바이오', '제약'],
    '전자': ['electronics', 'tech', '기술'],
    '화학': ['chemical', '케미칼'],
    '자동차': ['auto', 'car', 'motor'],
    '은행': ['bank', '금융', 'financial'],
    '건설': ['construction', '시공'],
    '생명': ['life', '보험', 'insurance'],
    '바이오': ['bio', '제약', 'pharma'],
    '게임': ['game', '엔터'],
    '통신': ['telecom', '5g', 'mobile']
  };
  
  Object.entries(industryKeywords).forEach(([key, words]) => {
    if (name.includes(key)) {
      keywords.push(...words);
    }
  });
  
  return [...new Set(keywords)];
}

// 주식 목록 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || 'ALL'; // US, KR, ALL
    const refresh = searchParams.get('refresh') === 'true';

    // 캐시 체크
    const now = Date.now();
    const shouldRefresh = refresh || (now - lastUpdateTime > CACHE_DURATION);

    if (shouldRefresh) {
      console.log('주식 목록 새로고침 중...');
      
      if (market === 'US' || market === 'ALL') {
        cachedUSStocks = await getUSStockSymbols();
      }
      
      if (market === 'KR' || market === 'ALL') {
        cachedKRStocks = await getKRStockSymbols();
      }
      
      lastUpdateTime = now;
    }

    let result: any[] = [];
    
    if (market === 'US') {
      result = cachedUSStocks;
    } else if (market === 'KR') {
      result = cachedKRStocks;
    } else {
      result = [...cachedUSStocks, ...cachedKRStocks];
    }

    return NextResponse.json({
      success: true,
      market,
      symbols: result,
      count: result.length,
      lastUpdate: new Date(lastUpdateTime).toISOString(),
      fromCache: !shouldRefresh
    });

  } catch (error: any) {
    console.error('주식 목록 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '주식 목록 조회 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
