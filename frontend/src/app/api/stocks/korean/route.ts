import { NextRequest, NextResponse } from 'next/server';
import { getKoreanStockInfo, getMultipleKoreanStocks, getPopularKoreanStocks, convertKRXToFinnhubFormat, KOREAN_STOCK_MAPPING } from '@/lib/krx';

export const dynamic = 'force-dynamic';

// 한국 주식 정보 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type') || 'single'; // single, multiple, popular

    if (type === 'popular') {
      // 인기 종목 조회
      const popularStocks = await getPopularKoreanStocks();
      
      const formattedStocks = popularStocks.map(stock => ({
        symbol: `${stock.srtnCd}.KS`,
        name: stock.itmsNm,
        quote: convertKRXToFinnhubFormat(stock),
        krx_data: stock
      }));

      return NextResponse.json({
        success: true,
        market: 'KR',
        data: formattedStocks,
        count: formattedStocks.length,
        source: 'KRX'
      });
    }

    if (type === 'multiple') {
      // 여러 종목 조회
      const symbols = Object.keys(KOREAN_STOCK_MAPPING);
      const stocksData = await getMultipleKoreanStocks(symbols);
      
      const formattedStocks = Object.entries(stocksData)
        .filter(([_, data]) => data !== null)
        .map(([symbol, data]) => ({
          symbol,
          name: data!.itmsNm,
          quote: convertKRXToFinnhubFormat(data!),
          krx_data: data
        }));

      return NextResponse.json({
        success: true,
        market: 'KR',
        data: formattedStocks,
        count: formattedStocks.length,
        total: symbols.length,
        source: 'KRX'
      });
    }

    // 단일 종목 조회
    if (!symbol) {
      return NextResponse.json(
        { error: '주식 심볼을 입력해주세요.' },
        { status: 400 }
      );
    }

    const stockData = await getKoreanStockInfo(symbol);
    
    if (!stockData) {
      return NextResponse.json(
        { error: '한국 주식 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const result = {
      symbol,
      quote: convertKRXToFinnhubFormat(stockData),
      profile: {
        name: stockData.itmsNm,
        country: 'KR',
        currency: 'KRW',
        exchange: stockData.mrktCtg,
        ticker: stockData.srtnCd,
        marketCapitalization: parseInt(stockData.mrktTotAmt || '0'),
        shareOutstanding: parseInt(stockData.lstgStCnt || '0')
      },
      krx_data: stockData
    };

    return NextResponse.json({
      success: true,
      data: result,
      source: 'KRX'
    });

  } catch (error: any) {
    console.error('한국 주식 정보 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '한국 주식 정보 조회 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
