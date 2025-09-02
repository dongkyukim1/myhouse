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

-- 오픈뱅킹 사용자 토큰 테이블
CREATE TABLE IF NOT EXISTS openbanking_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  access_token VARCHAR(1000) NOT NULL,
  refresh_token VARCHAR(1000),
  user_seq_no VARCHAR(255) NOT NULL,
  scope VARCHAR(500),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 오픈뱅킹 연결 계좌 테이블
CREATE TABLE IF NOT EXISTS openbanking_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  fintech_use_num VARCHAR(255) NOT NULL,
  account_alias VARCHAR(255),
  bank_code_std VARCHAR(10),
  bank_name VARCHAR(100),
  account_num_masked VARCHAR(50),
  account_holder_name VARCHAR(100),
  account_type VARCHAR(10),
  product_name VARCHAR(255),
  is_subscription_account BOOLEAN DEFAULT FALSE, -- 청약통장 여부
  inquiry_agree_yn CHAR(1) DEFAULT 'N',
  transfer_agree_yn CHAR(1) DEFAULT 'N',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 자동납입 설정 테이블
CREATE TABLE IF NOT EXISTS auto_payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES openbanking_accounts(id) ON DELETE CASCADE,
  payment_amount INTEGER NOT NULL, -- 납입금액
  payment_day INTEGER NOT NULL CHECK (payment_day >= 1 AND payment_day <= 31), -- 매월 납입일
  is_active BOOLEAN DEFAULT TRUE,
  last_payment_date DATE,
  next_payment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 청약 자격 정보 테이블 (기존 테이블 확장)
CREATE TABLE IF NOT EXISTS subscription_eligibility (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0, -- 가점
  deposits INTEGER DEFAULT 0, -- 납입횟수
  household VARCHAR(100), -- 세대구성
  total_deposit_amount BIGINT DEFAULT 0, -- 총 납입금액
  average_balance BIGINT DEFAULT 0, -- 평균 잔액
  credit_score INTEGER, -- 신용점수
  credit_grade VARCHAR(10), -- 신용등급
  loan_limit_amount BIGINT DEFAULT 0, -- 대출한도
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 잔액 조회 히스토리 테이블
CREATE TABLE IF NOT EXISTS balance_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES openbanking_accounts(id) ON DELETE CASCADE,
  balance_amt BIGINT NOT NULL,
  available_amt BIGINT NOT NULL,
  inquiry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- 오픈뱅킹 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_openbanking_tokens_user_id ON openbanking_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_openbanking_tokens_user_seq_no ON openbanking_tokens(user_seq_no);
CREATE INDEX IF NOT EXISTS idx_openbanking_accounts_user_id ON openbanking_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_openbanking_accounts_fintech_use_num ON openbanking_accounts(fintech_use_num);
CREATE INDEX IF NOT EXISTS idx_openbanking_accounts_subscription ON openbanking_accounts(is_subscription_account);
CREATE INDEX IF NOT EXISTS idx_auto_payments_user_id ON auto_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_payments_next_payment ON auto_payments(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_subscription_eligibility_user_id ON subscription_eligibility(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_user_id ON balance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_account_id ON balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_balance_history_date ON balance_history(inquiry_date);
