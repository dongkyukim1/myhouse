# Vercel 배포 가이드

## 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

### 1. Vercel 대시보드 접속
- https://vercel.com/dashboard
- 프로젝트 선택
- Settings → Environment Variables

### 2. 필수 환경 변수

```bash
# 데이터베이스 연결 (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database

# YouTube API 키
YOUTUBE_API_KEY=your_youtube_api_key_here

# 백엔드 서버 URL
SERVER_URL=http://3.34.52.239:8080

# JWT 시크릿 키 (안전한 랜덤 문자열)
JWT_SECRET=your_secure_jwt_secret_key_here

# Node 환경
NODE_ENV=production
```

### 3. 환경별 설정
- **Production**: 실제 운영 환경용 값
- **Preview**: 미리보기/테스트용 값
- **Development**: 개발용 값 (선택사항)

### 4. 배포 후 확인사항
1. 환경 변수가 올바르게 설정되었는지 확인
2. 데이터베이스 연결 테스트 (`/api/init-db` 호출)
3. API 라우트들이 정상 작동하는지 확인

### 5. 문제 해결
- 빌드 실패시: 로그에서 구체적인 에러 메시지 확인
- 런타임 에러시: Function Logs에서 실시간 에러 확인
- 성능 이슈시: Function 설정에서 memory/duration 조정

## 주의사항
- Puppeteer/Tesseract 등 무거운 라이브러리는 Vercel 제한으로 인해 때때로 실패할 수 있음
- 파일 업로드는 임시 디렉토리 사용 (영구 저장소 아님)
- API 요청 시간이 길어질 수 있음 (크롤링 등)

## 배포 후 필수 작업

### 1. 데이터베이스 초기화
배포 후 반드시 다음 API를 한 번 호출하여 데이터베이스 테이블을 생성하세요:
```
POST https://your-vercel-app.vercel.app/api/init-db
```

### 2. 환경 변수 확인
- Vercel 프로젝트 설정에서 모든 환경 변수가 올바르게 설정되었는지 확인
- 특히 `DATABASE_URL`이 올바른 PostgreSQL 연결 문자열인지 검증

### 3. 일반적인 오류 해결
- **500 에러**: 환경 변수 누락 또는 데이터베이스 연결 실패
- **404 에러**: API 라우트 경로 문제 (정상적인 경우도 있음)
- **401 에러**: 인증되지 않은 요청 (정상적인 동작)
