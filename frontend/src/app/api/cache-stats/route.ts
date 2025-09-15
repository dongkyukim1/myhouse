import { NextRequest, NextResponse } from "next/server";
import { getCacheStats, cleanExpiredCache } from "@/lib/youtube-cache";
import { getAllCacheStats } from "@/lib/cache";
import { healthCheck } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const dbStats = await getCacheStats();
    const enhancedCacheStats = getAllCacheStats();

    // Add system health information
    const systemStats = {
      database_healthy: await healthCheck(),
      node_memory: process.memoryUsage(),
      uptime: process.uptime(),
      node_version: process.version,
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json({
      database: dbStats,
      enhanced_cache: enhancedCacheStats,
      system_stats: systemStats,
      performance: {
        total_cache_hit_rate: calculateOverallHitRate(enhancedCacheStats),
        memory_efficiency: calculateMemoryEfficiency(enhancedCacheStats, systemStats),
        recommendations: generateRecommendations(enhancedCacheStats, systemStats)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ 캐시 통계 조회 오류:', error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: error?.message || "서버 에러" },
      { status: 500 }
    );
  }
}

function calculateOverallHitRate(cacheStats: any): number {
  const totalHits = cacheStats.apiCache.hits + cacheStats.dbCache.hits + cacheStats.userCache.hits;
  const totalMisses = cacheStats.apiCache.misses + cacheStats.dbCache.misses + cacheStats.userCache.misses;
  const totalRequests = totalHits + totalMisses;

  return totalRequests > 0 ? Math.round((totalHits / totalRequests) * 10000) / 100 : 0;
}

function calculateMemoryEfficiency(cacheStats: any, systemStats: any): string {
  const totalCacheMemory = cacheStats.apiCache.memoryUsage + cacheStats.dbCache.memoryUsage + cacheStats.userCache.memoryUsage;
  const totalSystemMemory = systemStats.node_memory.heapUsed;
  const efficiency = totalCacheMemory > 0 && totalSystemMemory > 0 ? (totalCacheMemory / totalSystemMemory) * 100 : 0;

  return `${Math.round(efficiency * 100) / 100}%`;
}

function generateRecommendations(cacheStats: any, systemStats: any): string[] {
  const recommendations: string[] = [];

  // Cache hit rate recommendations
  const overallHitRate = calculateOverallHitRate(cacheStats);
  if (overallHitRate < 60) {
    recommendations.push('Consider increasing cache TTL or reviewing cache key strategies');
  }

  // Memory usage recommendations
  const totalCacheMemory = cacheStats.apiCache.memoryUsage + cacheStats.dbCache.memoryUsage + cacheStats.userCache.memoryUsage;
  if (totalCacheMemory > 50 * 1024 * 1024) { // 50MB
    recommendations.push('Cache memory usage is high, consider reducing cache sizes');
  }

  // Performance recommendations
  if (systemStats.node_memory.heapUsed / systemStats.node_memory.heapTotal > 0.8) {
    recommendations.push('High memory usage detected, consider optimizing application memory');
  }

  if (recommendations.length === 0) {
    recommendations.push('Cache performance is optimal');
  }

  return recommendations;
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
