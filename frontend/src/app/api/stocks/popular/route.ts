import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote, POPULAR_STOCKS } from '@/lib/finnhub';
import { getMultipleKoreanStocks, convertKRXToFinnhubFormat, KOREAN_STOCK_MAPPING } from '@/lib/krx';

export const dynamic = 'force-dynamic';

// 인기 주식 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || 'US'; // US 또는 KR

    if (market === 'KR') {
      // 한국주식은 KRX API 사용 (간단한 방식)
      const koreanStocks = [
        { symbol: '005930.KS', name: '삼성전자' },
        { symbol: '000660.KS', name: 'SK하이닉스' },
        { symbol: '207940.KS', name: '삼성바이오로직스' },
        { symbol: '005380.KS', name: '현대차' },
        { symbol: '006400.KS', name: '삼성SDI' },
        { symbol: '051910.KS', name: 'LG화학' },
        { symbol: '028260.KS', name: '삼성물산' },
        { symbol: '012330.KS', name: '현대모비스' }
      ];

      const validResults = await Promise.all(
        koreanStocks.map(async (stock) => {
          try {
            const KRX_API_KEY = process.env.KRX_API_KEY;
            const baseDate = '20250102';
            const stockCode = stock.symbol.replace('.KS', '');
            
            const url = `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${KRX_API_KEY}&resultType=json&numOfRows=5&pageNo=1&basDt=${baseDate}&likeSrtnCd=${stockCode}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data?.response?.body?.items?.item) {
              const items = Array.isArray(data.response.body.items.item) 
                ? data.response.body.items.item 
                : [data.response.body.items.item];
              
              const stockData = items[0];
              
              // 안전한 숫자 변환 함수
              const safeParseFloat = (value: string | undefined): number => {
                const parsed = parseFloat(value || '0');
                return isNaN(parsed) ? 0 : parsed;
              };

              const currentPrice = safeParseFloat(stockData.clpr);
              const change = safeParseFloat(stockData.vs);
              const changePercent = safeParseFloat(stockData.fltRt);
              const highPrice = safeParseFloat(stockData.hipr);
              const lowPrice = safeParseFloat(stockData.lopr);
              const openPrice = safeParseFloat(stockData.mkp);
              const previousClose = currentPrice - change;
              
              return {
                symbol: stock.symbol,
                name: stockData.itmsNm,
                quote: {
                  c: currentPrice,
                  d: change,
                  dp: changePercent,
                  h: highPrice,
                  l: lowPrice,
                  o: openPrice,
                  pc: previousClose,
                  t: Date.now() / 1000
                },
                error: null
              };
            }
            return null;
          } catch (error) {
            console.error(`KRX API 오류 (${stock.symbol}):`, error);
            return null;
          }
        })
      );

      const filteredResults = validResults.filter(result => result !== null);

      return NextResponse.json({
        success: true,
        market,
        data: filteredResults,
        count: filteredResults.length,
        total: koreanStocks.length,
        source: 'KRX'
      });
    } else {
      // 미국주식은 Finnhub API 사용
      const stocks = POPULAR_STOCKS[market as keyof typeof POPULAR_STOCKS] || POPULAR_STOCKS.US;

      // 모든 주식의 현재가 정보를 병렬로 조회
      const stockPromises = stocks.map(async (stock) => {
        try {
          const quote = await getStockQuote(stock.symbol);
          return {
            ...stock,
            quote,
            error: null
          };
        } catch (error) {
          return {
            ...stock,
            quote: null,
            error: 'Failed to fetch'
          };
        }
      });

      const results = await Promise.all(stockPromises);

      // 성공한 결과만 필터링
      const validResults = results.filter(result => result.quote !== null);

      return NextResponse.json({
        success: true,
        market,
        data: validResults,
        count: validResults.length,
        total: stocks.length,
        source: 'Finnhub'
      });
    }

  } catch (error: any) {
    console.error('인기 주식 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '인기 주식 조회 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
