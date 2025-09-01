import { NextRequest, NextResponse } from "next/server";
import { getCacheStats, cleanExpiredCache } from "@/lib/youtube-cache";
import { apiCache } from "@/lib/cache";

export async function GET(req: NextRequest) {
  try {
    const dbStats = await getCacheStats();
    const memoryStats = {
      size: apiCache.size()
    };

    return NextResponse.json({
      database: dbStats,
      memory: memoryStats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('캐시 통계 조회 오류:', error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: error?.message || "서버 에러" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'expired') {
      // 만료된 캐시만 정리
      await cleanExpiredCache();
      return NextResponse.json({ 
        message: "만료된 캐시 데이터가 정리되었습니다.",
        timestamp: new Date().toISOString()
      });
    } else if (action === 'memory') {
      // 메모리 캐시만 정리
      apiCache.clear();
      return NextResponse.json({ 
        message: "메모리 캐시가 정리되었습니다.",
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { code: "INVALID_ACTION", message: "유효하지 않은 액션입니다. 'expired' 또는 'memory'를 사용하세요." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('캐시 정리 오류:', error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: error?.message || "서버 에러" },
      { status: 500 }
    );
  }
}
