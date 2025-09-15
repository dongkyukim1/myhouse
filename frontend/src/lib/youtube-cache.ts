import { query } from "./db";

// 캐시 유효 시간 설정 (시간 단위)
const CACHE_EXPIRY_HOURS = {
  CHANNEL: 24, // 채널 정보는 24시간
  VIDEOS: 6,   // 비디오 목록은 6시간
  SUMMARY: 168 // 요약은 1주일 (7일 * 24시간)
};

export interface CachedChannel {
  channelId: string;
  channelHandle?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  uploadsPlaylistId: string;
  channelData: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CachedVideo {
  videoId: string;
  channelId: string;
  title: string;
  description: string;
  publishedAt: Date;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnailUrl: string;
  videoData: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CachedVideoSummary {
  videoId: string;
  summaryData: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 채널 정보가 캐시에 있고 유효한지 확인
 */
export async function getCachedChannel(channelIdOrHandle: string): Promise<CachedChannel | null> {
  try {
    const result = await query<CachedChannel>(`
      SELECT * FROM youtube_channels 
      WHERE (channel_id = $1 OR channel_handle = $1)
      -- AND updated_at > NOW() - INTERVAL '${CACHE_EXPIRY_HOURS.CHANNEL} hours'
      ORDER BY updated_at DESC
      LIMIT 1
    `, [channelIdOrHandle]);

    return result.rows[0] || null;
  } catch (error) {
    console.error('채널 캐시 조회 오류:', error);
    return null;
  }
}

/**
 * 채널 정보를 캐시에 저장
 */
export async function cacheChannel(channelData: any): Promise<void> {
  try {
    console.log('채널 캐시 저장 시도:', channelData.id);
    const channel = channelData;
    const snippet = channel.snippet || {};
    const statistics = channel.statistics || {};
    const contentDetails = channel.contentDetails || {};

    const result = await query(`
      INSERT INTO youtube_channels (
        channel_id, channel_handle, title, description, thumbnail_url,
        subscriber_count, video_count, view_count, uploads_playlist_id,
        channel_data, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (channel_id) 
      DO UPDATE SET
        channel_handle = EXCLUDED.channel_handle,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        thumbnail_url = EXCLUDED.thumbnail_url,
        subscriber_count = EXCLUDED.subscriber_count,
        video_count = EXCLUDED.video_count,
        view_count = EXCLUDED.view_count,
        uploads_playlist_id = EXCLUDED.uploads_playlist_id,
        channel_data = EXCLUDED.channel_data,
        updated_at = NOW()
    `, [
      channel.id,
      snippet.customUrl || null,
      snippet.title || '',
      snippet.description || '',
      snippet.thumbnails?.default?.url || '',
      parseInt(statistics.subscriberCount || '0'),
      parseInt(statistics.videoCount || '0'),
      parseInt(statistics.viewCount || '0'),
      contentDetails.relatedPlaylists?.uploads || '',
      JSON.stringify(channelData)
    ]);

    console.log(`채널 캐시 저장 성공: ${channel.id}, 영향받은 행: ${result.rows.length}`);
  } catch (error) {
    console.error('채널 캐시 저장 오류:', error);
    console.error('채널 데이터:', JSON.stringify(channelData, null, 2));
  }
}

/**
 * 채널의 비디오 목록이 캐시에 있고 유효한지 확인
 */
export async function getCachedVideos(channelId: string): Promise<CachedVideo[]> {
  try {
    const result = await query<CachedVideo>(`
      SELECT * FROM youtube_videos 
      WHERE channel_id = $1
      AND updated_at > NOW() - INTERVAL '${CACHE_EXPIRY_HOURS.VIDEOS} hours'
      ORDER BY published_at DESC
    `, [channelId]);

    return result.rows;
  } catch (error) {
    console.error('비디오 캐시 조회 오류:', error);
    return [];
  }
}

/**
 * 비디오 목록을 캐시에 저장
 */
export async function cacheVideos(channelId: string, videos: any[]): Promise<void> {
  try {
    console.log(`비디오 캐시 저장 시도: ${videos.length}개 (채널: ${channelId})`);
    
    // 기존 비디오 캐시 삭제 (채널별) - 외래키 제약조건 때문에 요약부터 삭제
    await query(`
      DELETE FROM youtube_video_summaries 
      WHERE video_id IN (
        SELECT video_id FROM youtube_videos WHERE channel_id = $1
      )
    `, [channelId]);
    
    const deleteResult = await query(`DELETE FROM youtube_videos WHERE channel_id = $1`, [channelId]);
    console.log(`기존 비디오 삭제됨: ${deleteResult.rows.length}개`);

    // 새 비디오들 저장
    for (const video of videos) {
      const snippet = video.snippet || {};
      const statistics = video.statistics || {};
      const contentDetails = video.contentDetails || {};

      const insertResult = await query(`
        INSERT INTO youtube_videos (
          video_id, channel_id, title, description, published_at,
          duration, view_count, like_count, comment_count,
          thumbnail_url, video_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (video_id)
        DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          published_at = EXCLUDED.published_at,
          duration = EXCLUDED.duration,
          view_count = EXCLUDED.view_count,
          like_count = EXCLUDED.like_count,
          comment_count = EXCLUDED.comment_count,
          thumbnail_url = EXCLUDED.thumbnail_url,
          video_data = EXCLUDED.video_data,
          updated_at = NOW()
      `, [
        video.id || video.videoId,
        channelId,
        snippet.title || video.title || '',
        snippet.description || video.description || '',
        snippet.publishedAt || video.publishedAt || new Date().toISOString(),
        contentDetails.duration || '',
        parseInt(statistics.viewCount || '0'),
        parseInt(statistics.likeCount || '0'),
        parseInt(statistics.commentCount || '0'),
        snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        JSON.stringify(video)
      ]);
      
      console.log(`비디오 저장됨: ${video.id || video.videoId}`);
    }

    console.log(`${videos.length}개 비디오 캐시 저장 완료 (채널: ${channelId})`);
  } catch (error) {
    console.error('비디오 캐시 저장 오류:', error);
    console.error('첫 번째 비디오 데이터:', JSON.stringify(videos[0], null, 2));
  }
}

/**
 * 비디오 요약이 캐시에 있고 유효한지 확인
 */
export async function getCachedVideoSummary(videoId: string): Promise<CachedVideoSummary | null> {
  try {
    const result = await query<CachedVideoSummary>(`
      SELECT * FROM youtube_video_summaries 
      WHERE video_id = $1
      AND updated_at > NOW() - INTERVAL '${CACHE_EXPIRY_HOURS.SUMMARY} hours'
      LIMIT 1
    `, [videoId]);

    return result.rows[0] || null;
  } catch (error) {
    console.error('비디오 요약 캐시 조회 오류:', error);
    return null;
  }
}

/**
 * 비디오 요약을 캐시에 저장
 */
export async function cacheVideoSummary(videoId: string, summaryData: any): Promise<void> {
  try {
    await query(`
      INSERT INTO youtube_video_summaries (video_id, summary_data)
      VALUES ($1, $2)
      ON CONFLICT (video_id)
      DO UPDATE SET
        summary_data = EXCLUDED.summary_data,
        updated_at = NOW()
    `, [videoId, JSON.stringify(summaryData)]);

    console.log(`비디오 요약 캐시 저장됨: ${videoId}`);
  } catch (error) {
    console.error('비디오 요약 캐시 저장 오류:', error);
  }
}

/**
 * 캐시 통계 조회
 */
export async function getCacheStats() {
  try {
    const channelCount = await query(`SELECT COUNT(*) as count FROM youtube_channels`);
    const videoCount = await query(`SELECT COUNT(*) as count FROM youtube_videos`);
    const summaryCount = await query(`SELECT COUNT(*) as count FROM youtube_video_summaries`);

    return {
      channels: parseInt(channelCount.rows[0].count),
      videos: parseInt(videoCount.rows[0].count),
      summaries: parseInt(summaryCount.rows[0].count)
    };
  } catch (error) {
    console.error('캐시 통계 조회 오류:', error);
    return { channels: 0, videos: 0, summaries: 0 };
  }
}

/**
 * 만료된 캐시 데이터 정리
 */
export async function cleanExpiredCache(): Promise<void> {
  try {
    // 만료된 채널 캐시 삭제
    const expiredChannels = await query(`
      DELETE FROM youtube_channels 
      WHERE updated_at < NOW() - INTERVAL '${CACHE_EXPIRY_HOURS.CHANNEL} hours'
    `);

    // 만료된 비디오 캐시 삭제
    const expiredVideos = await query(`
      DELETE FROM youtube_videos 
      WHERE updated_at < NOW() - INTERVAL '${CACHE_EXPIRY_HOURS.VIDEOS} hours'
    `);

    // 만료된 요약 캐시 삭제
    const expiredSummaries = await query(`
      DELETE FROM youtube_video_summaries 
      WHERE updated_at < NOW() - INTERVAL '${CACHE_EXPIRY_HOURS.SUMMARY} hours'
    `);

    console.log('만료된 캐시 데이터 정리 완료');
  } catch (error) {
    console.error('캐시 정리 오류:', error);
  }
}
