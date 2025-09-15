import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const KAKAO_REST_API_KEY = 'a277f4a9fdbec1b5358b244468c9bc5c';

// 주소 -> 좌표 변환 (geocoding)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: '주소가 필요합니다.' },
        { status: 400 }
      );
    }

    // 카카오 지도 API 호출
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

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
    console.error('주소 변환 오류:', error);
    return NextResponse.json(
      { error: '주소 변환 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 좌표 -> 주소 변환 (reverse geocoding)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { x, y } = body; // 경도, 위도

    if (!x || !y) {
      return NextResponse.json(
        { error: '좌표(경도, 위도)가 필요합니다.' },
        { status: 400 }
      );
    }

    // 카카오 지도 API 호출
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${x}&y=${y}`,
      {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

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
    console.error('좌표 변환 오류:', error);
    return NextResponse.json(
      { error: '좌표 변환 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
