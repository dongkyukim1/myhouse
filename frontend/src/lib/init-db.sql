-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 세션 테이블 생성
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 유튜브 채널 캐시 테이블
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
  channel_data JSONB, -- 전체 채널 정보 JSON 저장
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 유튜브 비디오 캐시 테이블
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
  video_data JSONB, -- 전체 비디오 정보 JSON 저장
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 유튜브 비디오 요약 캐시 테이블
CREATE TABLE IF NOT EXISTS youtube_video_summaries (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(255) UNIQUE NOT NULL REFERENCES youtube_videos(video_id),
  summary_data JSONB, -- 요약 정보 JSON 저장
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_channels_channel_id ON youtube_channels(channel_id);
CREATE INDEX IF NOT EXISTS idx_youtube_channels_handle ON youtube_channels(channel_handle);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_video_id ON youtube_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_channel_id ON youtube_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_youtube_videos_published_at ON youtube_videos(published_at);
CREATE INDEX IF NOT EXISTS idx_youtube_video_summaries_video_id ON youtube_video_summaries(video_id);
