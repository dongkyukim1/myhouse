import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const KAKAO_REST_API_KEY = 'a277f4a9fdbec1b5358b244468c9bc5c';

// 키워드 검색
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const x = searchParams.get('x'); // 경도
    const y = searchParams.get('y'); // 위도
    const radius = searchParams.get('radius') || '2000'; // 반경 (기본 2km)
    const page = searchParams.get('page') || '1';
    const size = searchParams.get('size') || '15';
    const category = searchParams.get('category'); // AT4, BK9, HP8 등

    if (!query) {
      return NextResponse.json(
        { error: '검색 키워드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 카카오 Places API 호출
    const baseUrl = 'https://dapi.kakao.com/v2/local/search/keyword.json';
    const params = new URLSearchParams({
      query,
      page,
      size,
    });

    // 위치 기반 검색인 경우 좌표와 반경 추가
    if (x && y) {
      params.append('x', x);
      params.append('y', y);
      params.append('radius', radius);
    }

    // 카테고리 코드가 있는 경우 추가
    if (category) {
      params.append('category_group_code', category);
    }

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`카카오 API 호출 실패: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.documents,
      meta: data.meta
    });

  } catch (error) {
    console.error('카카오 지도 API 오류:', error);
    return NextResponse.json(
      { error: '장소 검색 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
