import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 데이터베이스 동기화 API
export async function POST() {
  try {
    console.log('🚀 데이터베이스 동기화 시작...');

    // 1. 기본 테이블 생성
    await createTables();
    
    // 2. 초기 데이터 삽입
    await insertInitialData();
    
    // 3. 관리자 공지사항 생성
    await createAdminNotices();

    return NextResponse.json({
      success: true,
      message: '데이터베이스 동기화가 완료되었습니다.',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ 데이터베이스 동기화 실패:', error);
    return NextResponse.json(
      { 
        error: '데이터베이스 동기화 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// 테이블 생성
async function createTables() {
  console.log('📋 테이블 생성 중...');

  // 기존 테이블들을 모두 삭제 (외래키 제약조건 문제 해결)
  await query(`DROP TABLE IF EXISTS board_attachments CASCADE;`);
  await query(`DROP TABLE IF EXISTS board_post_likes CASCADE;`);
  await query(`DROP TABLE IF EXISTS board_comments CASCADE;`);
  await query(`DROP TABLE IF EXISTS board_posts CASCADE;`);
  await query(`DROP TABLE IF EXISTS board_categories CASCADE;`);
  await query(`DROP TABLE IF EXISTS user_sessions CASCADE;`);
  await query(`DROP TABLE IF EXISTS openbanking_tokens CASCADE;`);
  await query(`DROP TABLE IF EXISTS openbanking_accounts CASCADE;`);
  await query(`DROP TABLE IF EXISTS auto_payments CASCADE;`);
  await query(`DROP TABLE IF EXISTS subscription_eligibility CASCADE;`);
  await query(`DROP TABLE IF EXISTS balance_history CASCADE;`);
  await query(`DROP TABLE IF EXISTS users CASCADE;`);

  // 사용자 테이블 (INTEGER 타입으로 통일)
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 사용자 세션 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 게시판 카테고리 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS board_categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      slug VARCHAR(100) UNIQUE NOT NULL,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 게시글 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS board_posts (
      id SERIAL PRIMARY KEY,
      category_id INTEGER REFERENCES board_categories(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      tags TEXT[],
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      is_pinned BOOLEAN DEFAULT false,
      is_notice BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 댓글 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS board_comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES board_posts(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 좋아요 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS board_post_likes (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES board_posts(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(post_id, user_id)
    );
  `);

  // 첨부파일 테이블
  await query(`
    CREATE TABLE IF NOT EXISTS board_attachments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES board_posts(id) ON DELETE CASCADE,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // 인덱스 생성
  await query(`
    CREATE INDEX IF NOT EXISTS idx_board_posts_category_id ON board_posts(category_id);
    CREATE INDEX IF NOT EXISTS idx_board_posts_user_id ON board_posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_board_posts_created_at ON board_posts(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_board_comments_post_id ON board_comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_board_post_likes_post_id ON board_post_likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_board_post_likes_user_id ON board_post_likes(user_id);
  `);

  console.log('✅ 테이블 생성 완료');
}

// 초기 데이터 삽입
async function insertInitialData() {
  console.log('📝 초기 데이터 삽입 중...');

  // 카테고리 생성
  const categories = [
    { name: '공지', description: '운영진 공지사항', slug: 'notice' },
    { name: 'LH 청약', description: 'LH 청약 관련 정보', slug: 'lh' },
    { name: 'SH 청약', description: 'SH 청약 관련 정보', slug: 'sh' },
    { name: '적금/예금', description: '적금 및 예금 정보', slug: 'savings' },
    { name: '정보글', description: '일반 정보 및 팁', slug: 'info' }
  ];

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    await query(`
      INSERT INTO board_categories (name, description, slug, order_index)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        order_index = EXCLUDED.order_index
    `, [cat.name, cat.description, cat.slug, i]);
  }

  console.log('✅ 카테고리 생성 완료');
}

// 관리자 공지사항 생성
async function createAdminNotices() {
  console.log('📢 관리자 공지사항 생성 중...');

  // 관리자 사용자 생성 (존재하지 않으면)
  const adminResult = await query(`
    INSERT INTO users (email, password_hash, name)
    VALUES ('admin@myhouse.com', '$2b$10$YourHashedPasswordHere', '운영진')
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `);

  const adminId = adminResult.rows[0]?.id || 1;

  // 공지 카테고리 ID 가져오기
  const categoryResult = await query(`
    SELECT id FROM board_categories WHERE slug = 'notice' LIMIT 1
  `);

  const categoryId = categoryResult.rows[0]?.id;

  if (!categoryId) {
    throw new Error('공지 카테고리를 찾을 수 없습니다.');
  }

  // 공지사항 목록
  const notices = [
    {
      title: '🏠 MyHouse 서비스 이용 안내',
      content: `
# MyHouse 서비스 이용 안내

안녕하세요! MyHouse에 오신 것을 환영합니다.

## 🎯 주요 기능

### 🏠 주택 정보 서비스  
- **청약 정보**: LH/SH 청약 관련 최신 정보
- **대출 계산**: 주택 대출 한도 및 이자 계산
- **지원 공고**: 맞춤형 주택 지원 공고 안내

### 🏦 오픈뱅킹 연동
- **계좌 조회**: 연결된 계좌 잔고 확인
- **자동 납입**: 청약통장 자동 납입 관리
- **대출 한도**: 개인 대출 가능 한도 조회

### 📝 정보 게시판
- **카테고리별 정보**: LH, SH, 적금 등
- **커뮤니티**: 사용자 간 정보 공유
- **실시간 댓글**: 활발한 소통 지원

## 📋 이용 규칙

1. **정확한 정보 공유**: 검증된 정보만 게시해주세요
2. **상호 존중**: 건전한 토론 문화 조성
3. **개인정보 보호**: 민감한 개인정보 공유 금지
4. **불법 행위 금지**: 허위 정보, 사기 행위 엄금

문의사항이 있으시면 언제든 연락주세요! 🙋‍♀️
      `,
      tags: ['공지', '이용안내', '규칙']
    },
    {
      title: '🔐 개인정보 보호 및 보안 정책',
      content: `
# 개인정보 보호 및 보안 정책

MyHouse는 사용자의 개인정보 보호를 최우선으로 합니다.

## 🛡️ 보안 조치

### 데이터 암호화
- **전송 암호화**: HTTPS/TLS 1.3 사용
- **저장 암호화**: 민감한 데이터 AES-256 암호화
- **비밀번호**: bcrypt 해싱 알고리즘 적용

### 접근 제어
- **JWT 토큰**: 안전한 인증 시스템
- **세션 관리**: 자동 만료 및 갱신
- **권한 관리**: 역할 기반 접근 제어

## 📊 수집 정보

### 필수 정보
- 이메일 주소 (로그인용)
- 이름 (서비스 이용용)
- 비밀번호 (암호화 저장)

### 선택 정보
- 청약 관심 지역 (맞춤 정보 제공)
- 관심 사업 (알림 서비스)

## 🚫 정보 이용 제한

- **제3자 제공 금지**: 법적 요구 외 절대 금지
- **마케팅 이용 금지**: 동의 없는 광고 발송 금지
- **데이터 최소화**: 필요한 최소한의 정보만 수집

## 📞 문의 및 신고

개인정보 관련 문의: privacy@myhouse.com
서비스 이용 문의: support@myhouse.com

항상 안전한 서비스 이용을 위해 노력하겠습니다! 🔒
      `,
      tags: ['개인정보', '보안', '정책']
    },
    {
      title: '🏠 주택 청약 가이드',
      content: `
# 주택 청약 가이드

MyHouse에서 제공하는 청약 정보 이용 시 다음 가이드를 참고해주세요.

## 🎯 청약 준비사항

### 필수 준비물
- **청약통장**: 주택청약종합저축 가입 필수
- **소득증빙**: 재직증명서, 소득금액증명원 등
- **거주증빙**: 주민등록등본, 거주지 증명서류

### 자격 요건
- **무주택 기간**: 청약 유형별 무주택 기간 충족
- **소득 기준**: 해당 청약의 소득 기준 확인
- **납입 횟수**: 청약통장 납입 회차 확인

## 💡 성공적인 청약 전략

### 청약 원칙
1. **장기 계획**: 꾸준한 청약통장 관리
2. **지역 선택**: 실거주 가능 지역 우선 고려
3. **분양가 검토**: 실제 거주 가능한 가격대 선택
4. **당첨 후 준비**: 중도금 대출, 입주 자금 준비

### 추천 학습 자료
- **LH 청약센터**: apply.lh.or.kr
- **SH 청약포털**: i-sh.co.kr
- **청약홈**: www.applyhome.co.kr

## 🎯 MyHouse 활용법

### 정보 수집
- **최신 청약 공고** 확인
- **당첨자 발표** 실시간 알림
- **커뮤니티 후기** 참고

### 자격 관리
- **청약통장 납입** 관리
- **자격 요건** 체크
- **일정 관리** 기능 활용

성공적인 내 집 마련을 응원합니다! 🏠
      `,
      tags: ['청약', '가이드', '주택']
    }
  ];

  // 공지사항 삽입
  for (const notice of notices) {
    await query(`
      INSERT INTO board_posts (category_id, user_id, title, content, tags, is_notice, is_pinned)
      VALUES ($1, $2, $3, $4, $5, true, true)
      ON CONFLICT DO NOTHING
    `, [categoryId, adminId, notice.title, notice.content, notice.tags]);
  }

  console.log('✅ 관리자 공지사항 생성 완료');
}

// GET 요청으로 상태 확인
export async function GET() {
  try {
    // 테이블 존재 여부 확인
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'board_categories', 'board_posts', 'board_comments')
      ORDER BY table_name
    `);

    // 카테고리 수 확인
    const categoryCount = await query(`
      SELECT COUNT(*) as count FROM board_categories
    `);

    // 게시글 수 확인
    const postCount = await query(`
      SELECT COUNT(*) as count FROM board_posts
    `);

    return NextResponse.json({
      success: true,
      status: {
        tables_created: tables.rows.map(row => row.table_name),
        categories_count: categoryCount.rows[0]?.count || 0,
        posts_count: postCount.rows[0]?.count || 0,
        last_check: new Date().toISOString()
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: '상태 확인 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
