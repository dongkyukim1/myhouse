// 금융위원회 주식시세정보 API 유틸리티
const KRX_API_KEY = process.env.KRX_API_KEY;
const KRX_BASE_URL = 'https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService';

// KRX 주식 정보 인터페이스
export interface KRXStockInfo {
  basDt: string; // 기준일자
  srtnCd: string; // 단축코드
  isinCd: string; // ISIN코드
  itmsNm: string; // 종목명
  mrktCtg: string; // 시장구분
  clpr: string; // 종가
  vs: string; // 대비
  fltRt: string; // 등락률
  mkp: string; // 시가
  hipr: string; // 고가
  lopr: string; // 저가
  trqu: string; // 거래량
  trPrc: string; // 거래대금
  lstgStCnt: string; // 상장주식수
  mrktTotAmt: string; // 시가총액
}

// API 응답 인터페이스
export interface KRXResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: KRXStockInfo[] | KRXStockInfo;
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// 한국 주식 종목 코드 매핑
export const KOREAN_STOCK_MAPPING: Record<string, { code: string; name: string }> = {
  '005930.KS': { code: '005930', name: '삼성전자' },
  '000660.KS': { code: '000660', name: 'SK하이닉스' },
  '207940.KS': { code: '207940', name: '삼성바이오로직스' },
  '005380.KS': { code: '005380', name: '현대차' },
  '006400.KS': { code: '006400', name: '삼성SDI' },
  '051910.KS': { code: '051910', name: 'LG화학' },
  '028260.KS': { code: '028260', name: '삼성물산' },
  '012330.KS': { code: '012330', name: '현대모비스' },
  '035420.KS': { code: '035420', name: 'NAVER' },
  '003670.KS': { code: '003670', name: '포스코홀딩스' },
  '068270.KS': { code: '068270', name: '셀트리온' },
  '323410.KS': { code: '323410', name: '카카오뱅크' },
  '035720.KS': { code: '035720', name: '카카오' },
  '105560.KS': { code: '105560', name: 'KB금융' },
  '055550.KS': { code: '055550', name: '신한지주' }
};

// 오늘 날짜를 YYYYMMDD 형식으로 반환
function getTodayDate(): string {
  const today = new Date();
  // 한국 시간으로 조정 (UTC+9)
  const kstOffset = 9 * 60; // 9시간을 분으로 변환
  const kstTime = new Date(today.getTime() + (kstOffset * 60 * 1000));
  
  const year = kstTime.getFullYear();
  const month = String(kstTime.getMonth() + 1).padStart(2, '0');
  const date = String(kstTime.getDate()).padStart(2, '0');
  
  return `${year}${month}${date}`;
}

// 영업일 계산 (주말 및 공휴일 제외)
function getLastBusinessDay(): string {
  const today = new Date();
  const kstOffset = 9 * 60;
  const kstTime = new Date(today.getTime() + (kstOffset * 60 * 1000));
  
  let businessDay = new Date(kstTime);
  
  // 2025년 1월 1일은 신정이므로 1월 2일을 사용
  // 현재 날짜가 2025년 1월 1일이면 1월 2일 사용
  if (businessDay.getFullYear() === 2025 && businessDay.getMonth() === 0 && businessDay.getDate() === 1) {
    businessDay = new Date(2025, 0, 2); // 2025년 1월 2일
  } else {
    // 주말이면 이전 금요일로 이동
    while (businessDay.getDay() === 0 || businessDay.getDay() === 6) {
      businessDay.setDate(businessDay.getDate() - 1);
    }
  }
  
  const year = businessDay.getFullYear();
  const month = String(businessDay.getMonth() + 1).padStart(2, '0');
  const date = String(businessDay.getDate()).padStart(2, '0');
  
  return `${year}${month}${date}`;
}

// KRX API 호출 공통 함수
async function krxAPI(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${KRX_BASE_URL}/${endpoint}`);
  
  // 기본 파라미터 설정
  url.searchParams.set('serviceKey', KRX_API_KEY || '');
  url.searchParams.set('resultType', 'json');
  url.searchParams.set('numOfRows', '100');
  url.searchParams.set('pageNo', '1');
  
  // 추가 파라미터 설정
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  console.log('KRX API 요청 URL:', url.toString());

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`KRX API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('KRX API 응답:', data);
  
  return data;
}

// 특정 종목 정보 조회
export async function getKoreanStockInfo(symbol: string): Promise<KRXStockInfo | null> {
  try {
    // 심볼에서 종목코드 추출
    const stockInfo = KOREAN_STOCK_MAPPING[symbol];
    if (!stockInfo) {
      console.log(`지원하지 않는 종목: ${symbol}`);
      return null;
    }

    const baseDate = getLastBusinessDay();
    
    const response = await krxAPI('getStockPriceInfo', {
      basDt: baseDate,
      likeSrtnCd: stockInfo.code
    });

    if (response?.response?.body?.items?.item) {
      const items = Array.isArray(response.response.body.items.item) 
        ? response.response.body.items.item 
        : [response.response.body.items.item];
      
      // 정확한 종목코드 매칭
      const exactMatch = items.find((item: KRXStockInfo) => item.srtnCd === stockInfo.code);
      return exactMatch || items[0] || null;
    }

    return null;
  } catch (error) {
    console.error(`KRX API 오류 (${symbol}):`, error);
    return null;
  }
}

// 여러 종목 정보 조회
export async function getMultipleKoreanStocks(symbols: string[]): Promise<Record<string, KRXStockInfo | null>> {
  const results: Record<string, KRXStockInfo | null> = {};
  
  // 병렬 처리로 성능 향상
  const promises = symbols.map(async (symbol) => {
    const data = await getKoreanStockInfo(symbol);
    return { symbol, data };
  });

  const resolvedPromises = await Promise.allSettled(promises);
  
  resolvedPromises.forEach((result) => {
    if (result.status === 'fulfilled') {
      results[result.value.symbol] = result.value.data;
    } else {
      console.error('종목 조회 실패:', result.reason);
    }
  });

  return results;
}

// 인기 종목 조회 (KOSPI 시가총액 상위)
export async function getPopularKoreanStocks(): Promise<KRXStockInfo[]> {
  try {
    const baseDate = getLastBusinessDay();
    
    const response = await krxAPI('getStockPriceInfo', {
      basDt: baseDate,
      mrktCtg: 'KOSPI',
      numOfRows: '20'
    });

    if (response?.response?.body?.items?.item) {
      const items = Array.isArray(response.response.body.items.item) 
        ? response.response.body.items.item 
        : [response.response.body.items.item];
      
      // 시가총액 기준 정렬
      return items
        .filter((item: KRXStockInfo) => item.mrktTotAmt && parseInt(item.mrktTotAmt) > 0)
        .sort((a: KRXStockInfo, b: KRXStockInfo) => parseInt(b.mrktTotAmt) - parseInt(a.mrktTotAmt))
        .slice(0, 10);
    }

    return [];
  } catch (error) {
    console.error('KRX 인기 종목 조회 오류:', error);
    return [];
  }
}

// KRX 데이터를 Finnhub 형식으로 변환
export function convertKRXToFinnhubFormat(krxData: KRXStockInfo): any {
  const currentPrice = parseFloat(krxData.clpr || '0');
  const change = parseFloat(krxData.vs || '0');
  const changePercent = parseFloat(krxData.fltRt || '0');
  const openPrice = parseFloat(krxData.mkp || '0');
  const highPrice = parseFloat(krxData.hipr || '0');
  const lowPrice = parseFloat(krxData.lopr || '0');
  const previousClose = currentPrice - change;

  return {
    c: currentPrice, // Current price
    d: change, // Change
    dp: changePercent, // Percent change
    h: highPrice, // High price of the day
    l: lowPrice, // Low price of the day
    o: openPrice, // Open price of the day
    pc: previousClose, // Previous close price
    t: Date.now() / 1000 // Timestamp
  };
}

// 종목명으로 검색
export async function searchKoreanStocks(query: string): Promise<KRXStockInfo[]> {
  try {
    const baseDate = getLastBusinessDay();
    
    const response = await krxAPI('getStockPriceInfo', {
      basDt: baseDate,
      likeItmsNm: query,
      numOfRows: '10'
    });

    if (response?.response?.body?.items?.item) {
      const items = Array.isArray(response.response.body.items.item) 
        ? response.response.body.items.item 
        : [response.response.body.items.item];
      
      return items;
    }

    return [];
  } catch (error) {
    console.error('KRX 종목 검색 오류:', error);
    return [];
  }
}

// 가격 포맷팅 (한국 원화)
export function formatKoreanPrice(price: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

// 대용량 데이터 포맷팅
export function formatLargeNumber(num: number): string {
  if (num >= 1000000000000) {
    return `${(num / 1000000000000).toFixed(1)}조`;
  } else if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}억`;
  } else if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`;
  }
  return num.toLocaleString();
}
