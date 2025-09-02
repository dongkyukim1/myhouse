import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// Finnhub 웹훅 시크릿
const FINNHUB_WEBHOOK_SECRET = 'd2r7t2pr01qlk22s34pg'; // 제공받은 시크릿

// 실시간 주식 데이터를 저장할 메모리 캐시 (실제 환경에서는 Redis 사용 권장)
const stockCache = new Map<string, any>();

// 웹훅 이벤트 처리
export async function POST(request: NextRequest) {
  try {
    // 시크릿 검증
    const headersList = headers();
    const finnhubSecret = headersList.get('X-Finnhub-Secret');
    
    if (finnhubSecret !== FINNHUB_WEBHOOK_SECRET) {
      console.log('Invalid webhook secret:', finnhubSecret);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Finnhub webhook received:', body);

    // 웹훅 데이터 처리
    if (body.data && Array.isArray(body.data)) {
      body.data.forEach((trade: any) => {
        const { s: symbol, p: price, t: timestamp, v: volume } = trade;
        
        // 실시간 데이터를 캐시에 저장
        stockCache.set(symbol, {
          symbol,
          price,
          timestamp,
          volume,
          lastUpdate: new Date().toISOString()
        });
        
        console.log(`Updated ${symbol}: $${price} at ${new Date(timestamp).toISOString()}`);
      });
    }

    // 성공 응답 (2xx 상태 코드로 웹훅 수신 확인)
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      processed: body.data?.length || 0
    });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// 실시간 데이터 조회 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (symbol) {
      // 특정 심볼의 실시간 데이터 조회
      const data = stockCache.get(symbol);
      if (!data) {
        return NextResponse.json(
          { error: 'No real-time data available for this symbol' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data
      });
    } else {
      // 모든 실시간 데이터 조회
      const allData = Array.from(stockCache.entries()).map(([symbol, data]) => data);
      
      return NextResponse.json({
        success: true,
        data: allData,
        count: allData.length
      });
    }

  } catch (error: any) {
    console.error('Real-time data retrieval error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve real-time data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// 웹훅 테스트용 엔드포인트
export async function PUT(request: NextRequest) {
  try {
    // 테스트 데이터 생성
    const testData = {
      data: [
        {
          s: 'AAPL',
          p: 150.25,
          t: Date.now(),
          v: 1000
        },
        {
          s: 'MSFT',
          p: 285.50,
          t: Date.now(),
          v: 800
        }
      ]
    };

    // 테스트 데이터 처리
    testData.data.forEach((trade: any) => {
      const { s: symbol, p: price, t: timestamp, v: volume } = trade;
      
      stockCache.set(symbol, {
        symbol,
        price,
        timestamp,
        volume,
        lastUpdate: new Date().toISOString()
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Test data generated successfully',
      data: testData
    });

  } catch (error: any) {
    console.error('Test data generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate test data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
