import { NextRequest, NextResponse } from 'next/server';
import { getStockNews, getMarketNews } from '@/lib/finnhub';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store'; // 캐시 비활성화

// 주식 뉴스 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const category = searchParams.get('category') || 'general';
    const count = parseInt(searchParams.get('count') || '20');

    let news;

    if (symbol) {
      // 특정 주식 뉴스
      news = await getStockNews(symbol, count);
    } else {
      // 일반 시장 뉴스
      news = await getMarketNews(category, count);
    }

    // 뉴스 필터링 및 포맷팅
    const filteredNews = news
      .filter((item: any) => item.headline && item.summary)
      .slice(0, count)
      .map((item: any) => ({
        id: item.id,
        headline: item.headline,
        summary: item.summary,
        url: item.url,
        image: item.image,
        source: item.source,
        datetime: item.datetime,
        category: item.category,
        related: item.related
      }));

    return NextResponse.json({
      success: true,
      data: filteredNews,
      count: filteredNews.length
    });

  } catch (error: any) {
    console.error('주식 뉴스 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '뉴스 조회 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
