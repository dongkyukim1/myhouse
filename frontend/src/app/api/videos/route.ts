import { NextRequest, NextResponse } from "next/server";
import { apiCache } from "@/lib/cache";
import { 
  getCachedChannel, 
  cacheChannel, 
  getCachedVideos, 
  cacheVideos 
} from "@/lib/youtube-cache";

// channelId 또는 handle(@...) 중 하나를 허용하고, 채널 정보(snippet/statistics/brandingSettings)도 반환
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = process.env.YOUTUBE_API_KEY;
    let channelId = searchParams.get("channelId");
    const handle = searchParams.get("handle");

    // 1. 먼저 DB 캐시에서 채널 정보 확인
    console.log('🔍 캐시 조회 시도:', { channelId, handle });
    const cachedChannel = await getCachedChannel(channelId || handle || '');
    
    if (cachedChannel) {
      console.log('✅ DB 캐시에서 채널 정보 발견:', cachedChannel.channelId);
      
      // 해당 채널의 비디오 목록도 캐시에서 확인
      const cachedVideos = await getCachedVideos(cachedChannel.channelId);
      
      if (cachedVideos.length > 0) {
        console.log(`DB 캐시에서 ${cachedVideos.length}개 비디오 반환`);
        
        // 캐시된 데이터를 API 응답 형식으로 변환
        const videoItems = cachedVideos.map(video => ({
          videoId: video.videoId,
          title: video.title,
          description: video.description,
          publishedAt: video.publishedAt,
          thumbnails: video.videoData?.snippet?.thumbnails || {},
          channelTitle: cachedChannel.title,
          duration: video.duration,
          viewCount: video.viewCount.toString(),
          likeCount: video.likeCount.toString(),
          commentCount: video.commentCount.toString()
        }));

        return NextResponse.json({
          channel: {
            id: cachedChannel.channelId,
            title: cachedChannel.title,
            description: cachedChannel.description,
            thumbnails: cachedChannel.channelData?.snippet?.thumbnails || {},
            subscriberCount: cachedChannel.subscriberCount.toString(),
            videoCount: cachedChannel.videoCount.toString(),
            viewCount: cachedChannel.viewCount.toString()
          },
          items: videoItems,
          source: 'database_cache'
        });
      }
      
      // 채널은 있지만 비디오가 없거나 만료된 경우, channelId 설정하고 API 호출 진행
      console.log('⚠️ 채널은 있지만 비디오 캐시 없음');
      channelId = cachedChannel.channelId;
    } else {
      console.log('❌ DB 캐시에서 채널 정보 없음');
    }

    // 2. 메모리 캐시 확인 (기존 로직 유지)
    const cacheKey = `videos_${channelId || handle}`;
    const cached = apiCache.get(cacheKey);
    
    if (cached) {
      console.log('메모리 캐시에서 데이터 반환:', cacheKey);
      return NextResponse.json(cached);
    }

    // 3. 실제 YouTube API 호출
    console.log('YouTube API 호출 시작');
    console.log('API Key exists:', !!apiKey);
    console.log('Handle:', handle);
    console.log('Channel ID:', channelId);

    if (!apiKey) {
      console.error('YouTube API Key not found');
      return NextResponse.json({ code: "NO_API_KEY", message: "YOUTUBE_API_KEY 필요" }, { status: 400 });
    }

    // handle로 채널ID 조회 (예: @아영이네행복주택)
    if (!channelId && handle) {
      console.log('핸들로 채널 ID 조회:', handle);
      try {
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,statistics,brandingSettings&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
        console.log('Channel API URL:', channelUrl);
        
        const channelRes = await fetch(channelUrl);
        const channelData = await channelRes.json();
        
        console.log('Channel API Response:', channelData);
        
        if (!channelRes.ok) {
          if (channelData.error?.code === 403 && channelData.error?.errors?.[0]?.reason === 'quotaExceeded') {
            return NextResponse.json({ code: "QUOTA_EXCEEDED", message: "YouTube API 할당량 초과" }, { status: 429 });
          }
          throw new Error(`채널 조회 실패: ${channelData.error?.message || 'Unknown error'}`);
        }
        
        if (!channelData.items || channelData.items.length === 0) {
          return NextResponse.json({ code: "CHANNEL_NOT_FOUND", message: "채널을 찾을 수 없습니다" }, { status: 404 });
        }
        
        const channel = channelData.items[0];
        channelId = channel.id;
        
        // 채널 정보를 DB에 캐시
        await cacheChannel(channel);
        console.log('채널 정보 캐시 완료:', channelId);
        
      } catch (error: any) {
        console.error('채널 조회 오류:', error);
        return NextResponse.json({ code: "CHANNEL_ERROR", message: error.message }, { status: 500 });
      }
    }

    if (!channelId) {
      return NextResponse.json({ code: "NO_CHANNEL_ID", message: "채널 ID 또는 핸들이 필요합니다" }, { status: 400 });
    }

    // 채널의 업로드 플레이리스트 ID 가져오기
    let uploadsPlaylistId = `UU${channelId.slice(2)}`;

    try {
      // 채널 정보 다시 조회 (ID로)
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,statistics,brandingSettings,contentDetails&id=${channelId}&key=${apiKey}`;
      const channelRes = await fetch(channelUrl);
      const channelData = await channelRes.json();
      
      if (!channelRes.ok) {
        if (channelData.error?.code === 403 && channelData.error?.errors?.[0]?.reason === 'quotaExceeded') {
          return NextResponse.json({ code: "QUOTA_EXCEEDED", message: "YouTube API 할당량 초과" }, { status: 429 });
        }
        throw new Error(`채널 정보 조회 실패: ${channelData.error?.message || 'Unknown error'}`);
      }
      
      if (channelData.items && channelData.items.length > 0) {
        const channel = channelData.items[0];
        await cacheChannel(channel);
        uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads || uploadsPlaylistId;
      }
      
      // 업로드된 비디오 목록 가져오기
      console.log('비디오 목록 조회 시작:', uploadsPlaylistId);
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=50&key=${apiKey}`;
      console.log('Playlist API URL:', playlistUrl);
      
      const playlistRes = await fetch(playlistUrl);
      const playlistData = await playlistRes.json();
      
      console.log('Playlist API Response:', playlistData);
      
      if (!playlistRes.ok) {
        if (playlistData.error?.code === 403 && playlistData.error?.errors?.[0]?.reason === 'quotaExceeded') {
          return NextResponse.json({ code: "QUOTA_EXCEEDED", message: "YouTube API 할당량 초과" }, { status: 429 });
        }
        throw new Error(`플레이리스트 조회 실패: ${playlistData.error?.message || 'Unknown error'}`);
      }
      
      const videoIds = playlistData.items?.map((item: any) => item.contentDetails.videoId).filter(Boolean) || [];
      
      if (videoIds.length === 0) {
        return NextResponse.json({
          channel: channelData.items?.[0] ? {
            id: channelData.items[0].id,
            title: channelData.items[0].snippet?.title,
            description: channelData.items[0].snippet?.description,
            thumbnails: channelData.items[0].snippet?.thumbnails,
            subscriberCount: channelData.items[0].statistics?.subscriberCount,
            videoCount: channelData.items[0].statistics?.videoCount,
            viewCount: channelData.items[0].statistics?.viewCount
          } : null,
          items: [],
          source: 'youtube_api'
        });
      }
      
      // 비디오 상세 정보 가져오기
      console.log('비디오 상세 정보 조회:', videoIds.length, '개');
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;
      const videosRes = await fetch(videosUrl);
      const videosData = await videosRes.json();
      
      if (!videosRes.ok) {
        if (videosData.error?.code === 403 && videosData.error?.errors?.[0]?.reason === 'quotaExceeded') {
          return NextResponse.json({ code: "QUOTA_EXCEEDED", message: "YouTube API 할당량 초과" }, { status: 429 });
        }
        throw new Error(`비디오 정보 조회 실패: ${videosData.error?.message || 'Unknown error'}`);
      }
      
      // 비디오 데이터를 DB에 캐시
      if (videosData.items && videosData.items.length > 0) {
        await cacheVideos(channelId, videosData.items);
        console.log('비디오 정보 캐시 완료:', videosData.items.length, '개');
      }
      
      const result = {
        channel: channelData.items?.[0] ? {
          id: channelData.items[0].id,
          title: channelData.items[0].snippet?.title,
          description: channelData.items[0].snippet?.description,
          thumbnails: channelData.items[0].snippet?.thumbnails,
          subscriberCount: channelData.items[0].statistics?.subscriberCount,
          videoCount: channelData.items[0].statistics?.videoCount,
          viewCount: channelData.items[0].statistics?.viewCount
        } : null,
        items: videosData.items?.map((video: any) => ({
          videoId: video.id,
          title: video.snippet?.title,
          description: video.snippet?.description,
          publishedAt: video.snippet?.publishedAt,
          thumbnails: video.snippet?.thumbnails,
          channelTitle: video.snippet?.channelTitle,
          duration: video.contentDetails?.duration,
          viewCount: video.statistics?.viewCount,
          likeCount: video.statistics?.likeCount,
          commentCount: video.statistics?.commentCount
        })) || [],
        source: 'youtube_api'
      };
      
      // 메모리 캐시에 저장 (5분)
      apiCache.set(cacheKey, result, 300000);
      
      return NextResponse.json(result);
      
    } catch (error: any) {
      console.error('YouTube API 호출 오류:', error);
      return NextResponse.json({ code: "API_ERROR", message: error.message }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ code: "SERVER_ERROR", message: err?.message || "서버 에러" }, { status: 500 });
  }
}
