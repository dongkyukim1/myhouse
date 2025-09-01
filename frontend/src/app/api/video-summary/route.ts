import { NextRequest, NextResponse } from "next/server";
import { apiCache } from "@/lib/cache";
import { 
  getCachedVideoSummary, 
  cacheVideoSummary 
} from "@/lib/youtube-cache";

// YouTube 영상 요약 API
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId");
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!videoId) {
      return NextResponse.json(
        { code: "NO_VIDEO_ID", message: "videoId 필요" },
        { status: 400 }
      );
    }

    // 1. DB 캐시에서 요약 확인
    const cachedSummary = await getCachedVideoSummary(videoId);
    
    if (cachedSummary) {
      console.log('DB 캐시에서 요약 데이터 반환:', videoId);
      return NextResponse.json({
        ...cachedSummary.summaryData,
        source: 'database_cache'
      });
    }

    // 2. 메모리 캐시 확인 (기존 로직 유지)
    const cacheKey = `summary_${videoId}`;
    const cached = apiCache.get(cacheKey);
    
    if (cached) {
      console.log('메모리 캐시에서 요약 데이터 반환:', videoId);
      return NextResponse.json(cached);
    }

    if (!apiKey) {
      return NextResponse.json(
        { code: "NO_API_KEY", message: "YOUTUBE_API_KEY 필요" },
        { status: 400 }
      );
    }

    // YouTube API로 영상 정보 가져오기
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
    );
    const videoData = await videoResponse.json();
    const video = videoData?.items?.[0];

    if (!video) {
      return NextResponse.json(
        { code: "VIDEO_NOT_FOUND", message: "영상을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 영상 기본 정보
    const videoInfo = {
      videoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      publishedAt: video.snippet.publishedAt,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      thumbnails: video.snippet.thumbnails,
    };

    // 자막 정보 가져오기 (자막이 있는 경우)
    let captions = null;
    try {
      const captionResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`
      );
      const captionData = await captionResponse.json();
      captions = captionData?.items || [];
    } catch (error) {
      console.log("자막 정보 가져오기 실패:", error);
    }

    // 영상 설명과 제목을 기반으로 간단한 요약 생성
    const summary = generateSummary(videoInfo.title, videoInfo.description);

    // 주요 키워드 추출
    const keywords = extractKeywords(videoInfo.title, videoInfo.description);

    // 카테고리 분류
    const category = categorizeVideo(videoInfo.title, videoInfo.description);

    const result = {
      video: videoInfo,
      summary,
      keywords,
      category,
      captions: captions?.length > 0 ? captions.length : 0,
      hasSubtitles: captions?.length > 0,
    };

    // 3. 메모리 캐시에 저장 (기존 로직 유지)
    apiCache.set(cacheKey, result, 30 * 60 * 1000);
    console.log('메모리 캐시에 요약 데이터 저장:', videoId);

    // 4. DB 캐시에 저장 (비동기로 처리)
    cacheVideoSummary(videoId, result).catch(err => 
      console.error('요약 DB 캐시 저장 실패:', err)
    );

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Video summary error:", error);
    return NextResponse.json(
      { code: "SERVER_ERROR", message: error?.message || "서버 에러" },
      { status: 500 }
    );
  }
}

// 영상 제목과 설명을 기반으로 요약 생성
function generateSummary(title: string, description: string): string {
  const content = `${title} ${description}`.toLowerCase();
  
  // 주요 내용 추출
  let summary = "";
  
  if (content.includes("청년") || content.includes("청년주택")) {
    summary += "청년 주택 관련 정보를 다루고 있습니다. ";
  }
  
  if (content.includes("신혼") || content.includes("신혼부부")) {
    summary += "신혼부부 주택 지원에 대한 내용입니다. ";
  }
  
  if (content.includes("lh") || content.includes("sh") || content.includes("공사")) {
    summary += "LH/SH 공사 관련 주택 정보를 제공합니다. ";
  }
  
  if (content.includes("공고") || content.includes("모집") || content.includes("청약")) {
    summary += "주택 공고 및 모집 정보에 대한 안내입니다. ";
  }
  
  if (content.includes("분양") || content.includes("임대")) {
    summary += "주택 분양 또는 임대 관련 정보를 담고 있습니다. ";
  }
  
  if (content.includes("대출") || content.includes("금리")) {
    summary += "주택 대출 및 금리 정보를 다룹니다. ";
  }
  
  if (content.includes("전세") || content.includes("월세")) {
    summary += "전세 또는 월세 관련 정보를 제공합니다. ";
  }
  
  // 기본 요약이 없는 경우
  if (!summary) {
    summary = "주택 관련 유용한 정보를 제공하는 영상입니다. ";
  }
  
  // 제목에서 중요한 부분 추출
  const titleParts = title.split(/[,\.\!\?]/).filter(part => part.trim().length > 0);
  if (titleParts.length > 0) {
    summary += `주요 내용: ${titleParts[0].trim()}`;
  }
  
  return summary.trim();
}

// 키워드 추출
function extractKeywords(title: string, description: string): string[] {
  const content = `${title} ${description}`.toLowerCase();
  const keywords: string[] = [];
  
  const keywordMap = {
    "청년": ["청년", "청년주택", "행복주택"],
    "신혼": ["신혼", "신혼부부", "특공"],
    "공사": ["lh", "sh", "공사"],
    "공고": ["공고", "모집", "청약"],
    "대출": ["대출", "금리", "이자"],
    "임대": ["임대", "전세", "월세"],
    "분양": ["분양", "아파트", "오피스텔"]
  };
  
  Object.entries(keywordMap).forEach(([category, terms]) => {
    if (terms.some(term => content.includes(term))) {
      keywords.push(category);
    }
  });
  
  return keywords;
}

// 영상 카테고리 분류
function categorizeVideo(title: string, description: string): string {
  const content = `${title} ${description}`.toLowerCase();
  
  if (content.includes("청년") || content.includes("청년주택")) return "청년";
  if (content.includes("신혼") || content.includes("신혼부부")) return "신혼";
  if (content.includes("lh") || content.includes("sh")) return "LH/SH";
  if (content.includes("공고") || content.includes("모집")) return "공고/모집";
  
  return "일반";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoIds } = body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json(
        { code: "INVALID_INPUT", message: "videoIds 배열이 필요합니다" },
        { status: 400 }
      );
    }

    // 여러 영상 일괄 요약
    const summaries = await Promise.all(
      videoIds.map(async (videoId: string) => {
        try {
          const response = await fetch(
            `${req.nextUrl.origin}/api/video-summary?videoId=${videoId}`
          );
          return await response.json();
        } catch (error) {
          return {
            videoId,
            error: "요약 생성 실패",
            video: null,
            summary: null,
          };
        }
      })
    );

    return NextResponse.json({
      summaries,
      total: videoIds.length,
      success: summaries.filter(s => !s.error).length,
    });

  } catch (error: any) {
    return NextResponse.json(
      { code: "SERVER_ERROR", message: error?.message || "서버 에러" },
      { status: 500 }
    );
  }
}
