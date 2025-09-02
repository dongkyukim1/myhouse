import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // 사용자 테이블 생성 (UUID 사용)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE NOT NULL,
        password_hash text NOT NULL,
        name text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // 사용자 세션 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        token text UNIQUE NOT NULL,
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // 유튜브 채널 캐시 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS youtube_channels (
        id SERIAL PRIMARY KEY,
        channel_id VARCHAR(255) UNIQUE NOT NULL,
        channel_handle VARCHAR(255),
        title VARCHAR(500),
        description TEXT,
        thumbnail_url VARCHAR(500),
        subscriber_count BIGINT,
        video_count BIGINT,
        view_count BIGINT,
        uploads_playlist_id VARCHAR(255),
        channel_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 유튜브 비디오 캐시 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS youtube_videos (
        id SERIAL PRIMARY KEY,
        video_id VARCHAR(255) UNIQUE NOT NULL,
        channel_id VARCHAR(255) REFERENCES youtube_channels(channel_id),
        title VARCHAR(500),
        description TEXT,
        published_at TIMESTAMP,
        duration VARCHAR(50),
        view_count BIGINT,
        like_count BIGINT,
        comment_count BIGINT,
        thumbnail_url VARCHAR(500),
        video_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 유튜브 비디오 요약 캐시 테이블
    await query(`
      CREATE TABLE IF NOT EXISTS youtube_video_summaries (
        id SERIAL PRIMARY KEY,
        video_id VARCHAR(255) UNIQUE NOT NULL REFERENCES youtube_videos(video_id),
        summary_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 인덱스 생성
    await query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await query('CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token)');
    await query('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_youtube_channels_channel_id ON youtube_channels(channel_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_youtube_channels_handle ON youtube_channels(channel_handle)');
    await query('CREATE INDEX IF NOT EXISTS idx_youtube_videos_video_id ON youtube_videos(video_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_youtube_videos_channel_id ON youtube_videos(channel_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_youtube_videos_published_at ON youtube_videos(published_at)');
    await query('CREATE INDEX IF NOT EXISTS idx_youtube_video_summaries_video_id ON youtube_video_summaries(video_id)');

    return NextResponse.json({
      message: '데이터베이스 테이블이 성공적으로 생성되었습니다.',
      tables: ['users', 'user_sessions', 'youtube_channels', 'youtube_videos', 'youtube_video_summaries']
    });

  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
    return NextResponse.json(
      { error: '데이터베이스 초기화에 실패했습니다.' },
      { status: 500 }
    );
  }
}
