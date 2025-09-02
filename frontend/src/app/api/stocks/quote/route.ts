import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote, getStockProfile } from '@/lib/finnhub';
import { getKoreanStockInfo, convertKRXToFinnhubFormat } from '@/lib/krx';

export const dynamic = 'force-dynamic';

// 주식 현재가 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: '주식 심볼을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 한국주식인지 확인 (.KS로 끝나는지)
    const isKoreanStock = symbol.endsWith('.KS');

    if (isKoreanStock) {
      // 한국주식은 KRX API 사용 (간단한 방식)
      try {
        const KRX_API_KEY = process.env.KRX_API_KEY;
        const baseDate = '20250102';
        
        // 심볼에서 종목코드 추출
        const stockCode = symbol.replace('.KS', '');
        
        const url = `https://apis.data.go.kr/1160100/service/GetStockSecuritiesInfoService/getStockPriceInfo?serviceKey=${KRX_API_KEY}&resultType=json&numOfRows=5&pageNo=1&basDt=${baseDate}&likeSrtnCd=${stockCode}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data?.response?.body?.items?.item) {
          const items = Array.isArray(data.response.body.items.item) 
            ? data.response.body.items.item 
            : [data.response.body.items.item];
          
          const stock = items[0];
          
          // 안전한 숫자 변환 함수
          const safeParseFloat = (value: string | undefined): number => {
            const parsed = parseFloat(value || '0');
            return isNaN(parsed) ? 0 : parsed;
          };

          const currentPrice = safeParseFloat(stock.clpr);
          const change = safeParseFloat(stock.vs);
          const changePercent = safeParseFloat(stock.fltRt);
          const highPrice = safeParseFloat(stock.hipr);
          const lowPrice = safeParseFloat(stock.lopr);
          const openPrice = safeParseFloat(stock.mkp);
          const previousClose = currentPrice - change;

          const result = {
            symbol,
            quote: {
              c: currentPrice, // Current price
              d: change, // Change
              dp: changePercent, // Percent change
              h: highPrice, // High
              l: lowPrice, // Low
              o: openPrice, // Open
              pc: previousClose, // Previous close
              t: Date.now() / 1000 // Timestamp
            },
            profile: {
              name: stock.itmsNm,
              country: 'KR',
              currency: 'KRW',
              exchange: stock.mrktCtg,
              ticker: stock.srtnCd,
              marketCapitalization: parseInt(stock.mrktTotAmt || '0'),
              shareOutstanding: parseInt(stock.lstgStCnt || '0')
            },
            source: 'KRX'
          };

          return NextResponse.json({
            success: true,
            data: result
          });
        }
        
        return NextResponse.json(
          { error: '한국 주식 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      } catch (error) {
        console.error('KRX API 오류:', error);
        return NextResponse.json(
          { error: '한국 주식 정보 조회 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
    } else {
      // 미국주식은 Finnhub API 사용
      const [quote, profile] = await Promise.allSettled([
        getStockQuote(symbol),
        getStockProfile(symbol)
      ]);

      const result: any = {
        symbol,
        quote: quote.status === 'fulfilled' ? quote.value : null,
        profile: profile.status === 'fulfilled' ? profile.value : null,
        source: 'Finnhub'
      };

      // 에러가 있어도 사용 가능한 데이터는 반환
      if (!result.quote && !result.profile) {
        return NextResponse.json(
          { error: '주식 정보를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result
      });
    }

  } catch (error: any) {
    console.error('주식 정보 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '주식 정보 조회 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
