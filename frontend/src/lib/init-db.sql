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

-- 게시판 카테고리 테이블
CREATE TABLE IF NOT EXISTS board_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 게시글 테이블
CREATE TABLE IF NOT EXISTS board_posts (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES board_categories(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  slug VARCHAR(500) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'published', -- published, draft, deleted
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_notice BOOLEAN DEFAULT FALSE,
  tags TEXT[], -- 태그 배열
  meta_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 게시글 댓글 테이블
CREATE TABLE IF NOT EXISTS board_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES board_posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES board_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 게시글 좋아요 테이블
CREATE TABLE IF NOT EXISTS board_post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES board_posts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- 매물 테이블 (원룸/투룸 장터)
CREATE TABLE IF NOT EXISTS marketplace_rooms (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  room_type VARCHAR(20) NOT NULL, -- 'one-room', 'two-room'
  address TEXT NOT NULL,
  district VARCHAR(100), -- 구/군
  neighborhood VARCHAR(100), -- 동/면
  latitude DECIMAL(10, 8), -- 위도
  longitude DECIMAL(11, 8), -- 경도
  monthly_rent INTEGER NOT NULL, -- 월세
  deposit INTEGER NOT NULL, -- 보증금
  maintenance_fee INTEGER DEFAULT 0, -- 관리비
  area DECIMAL(10, 2), -- 면적 (평수)
  floor INTEGER, -- 층수
  total_floors INTEGER, -- 총 층수
  building_type VARCHAR(50), -- 건물 유형 (아파트, 빌라, 원룸텔 등)
  room_count INTEGER DEFAULT 1, -- 방 개수
  bathroom_count INTEGER DEFAULT 1, -- 화장실 개수
  options JSONB, -- 옵션 (에어컨, 냉장고, 세탁기 등)
  images JSONB, -- 이미지 URL 배열
  view_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'available', -- available, reserved, sold, deleted
  available_date DATE, -- 입주 가능일
  phone_number VARCHAR(20),
  negotiable BOOLEAN DEFAULT FALSE, -- 가격 협의 가능 여부
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 매물 문의 테이블
CREATE TABLE IF NOT EXISTS marketplace_inquiries (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES marketplace_rooms(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  phone_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending', -- pending, replied, closed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 매물 즐겨찾기 테이블
CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES marketplace_rooms(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, user_id)
);

-- 파일 업로드 테이블
CREATE TABLE IF NOT EXISTS file_uploads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  original_name VARCHAR(500) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_path VARCHAR(1000) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_type VARCHAR(50), -- 'image', 'document', 'video' 등
  reference_type VARCHAR(50), -- 'board_post', 'marketplace_room' 등
  reference_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'board_comment', 'marketplace_inquiry' 등
  reference_type VARCHAR(50),
  reference_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 게시판 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_board_categories_slug ON board_categories(slug);
CREATE INDEX IF NOT EXISTS idx_board_categories_order ON board_categories(order_index);
CREATE INDEX IF NOT EXISTS idx_board_posts_category_id ON board_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_board_posts_user_id ON board_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_board_posts_slug ON board_posts(slug);
CREATE INDEX IF NOT EXISTS idx_board_posts_status ON board_posts(status);
CREATE INDEX IF NOT EXISTS idx_board_posts_created_at ON board_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_board_posts_is_pinned ON board_posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_board_posts_is_featured ON board_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_board_posts_tags ON board_posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_board_comments_post_id ON board_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_board_comments_user_id ON board_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_board_comments_parent_id ON board_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_board_post_likes_post_id ON board_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_board_post_likes_user_id ON board_post_likes(user_id);

-- 매물 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_marketplace_rooms_user_id ON marketplace_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_rooms_room_type ON marketplace_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_rooms_district ON marketplace_rooms(district);
CREATE INDEX IF NOT EXISTS idx_marketplace_rooms_neighborhood ON marketplace_rooms(neighborhood);
CREATE INDEX IF NOT EXISTS idx_marketplace_rooms_monthly_rent ON marketplace_rooms(monthly_rent);
CREATE INDEX IF NOT EXISTS idx_marketplace_rooms_status ON marketplace_rooms(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_rooms_created_at ON marketplace_rooms(created_at);
CREATE INDEX IF NOT EXISTS idx_marketplace_rooms_location ON marketplace_rooms(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_marketplace_inquiries_room_id ON marketplace_inquiries(room_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_inquiries_user_id ON marketplace_inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_room_id ON marketplace_favorites(room_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_user_id ON marketplace_favorites(user_id);

-- 기타 인덱스
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_reference ON file_uploads(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 기본 카테고리 데이터 삽입
INSERT INTO board_categories (name, slug, description, icon, order_index) VALUES
('일반', 'general', '일반적인 청약 관련 정보와 토론', '💬', 1),
('정보공유', 'info-sharing', '유용한 청약 정보와 팁을 공유하는 공간', '💡', 2),
('질문답변', 'qna', '청약 관련 질문과 답변', '❓', 3),
('분양정보', 'presale-info', '최신 분양 정보와 일정', '🏢', 4),
('원룸장터', 'one-room-market', '원룸 매매/임대 정보 공유', '🏠', 5),
('투룸장터', 'two-room-market', '투룸 매매/임대 정보 공유', '🏘️', 6),
('경험담', 'experience', '청약 및 당첨 경험담 공유', '📝', 7),
('지역정보', 'local-info', '지역별 부동산 정보', '📍', 8)
ON CONFLICT (slug) DO NOTHING;