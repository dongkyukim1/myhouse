import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const OPENBANKING_BASE_URL = 'https://testapi.openbanking.or.kr';
const CLIENT_ID = process.env.OPENBANKING_CLIENT_ID || '63970cd9-dd3b-47b9-99af-795776949491';
const CLIENT_SECRET = process.env.OPENBANKING_CLIENT_SECRET || '9da7395e-de4e-40ee-93e2-bdeb453fa47f';

// 오픈뱅킹 인증 콜백 처리
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // 에러 처리
    if (error) {
      return NextResponse.redirect(
        new URL(`/openbanking?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // 인증 코드가 없는 경우
    if (!code) {
      return NextResponse.redirect(
        new URL('/openbanking?error=no_code', request.url)
      );
    }

    // 사용자 인증 확인
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.redirect(
        new URL('/login?redirect=/openbanking', request.url)
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.redirect(
        new URL('/login?redirect=/openbanking', request.url)
      );
    }

    const userId = decoded.userId;

    // Authorization Code를 Access Token으로 교환
    const tokenResponse = await axios.post(
      `${OPENBANKING_BASE_URL}/oauth/2.0/token`,
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: getCallbackUrl(request),
        grant_type: 'authorization_code',
        code: code
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const tokenData = tokenResponse.data;

    if (tokenData.error) {
      console.error('토큰 교환 오류:', tokenData);
      return NextResponse.redirect(
        new URL(`/openbanking?error=${encodeURIComponent(tokenData.error)}`, request.url)
      );
    }

    // 토큰 정보 데이터베이스에 저장
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    await query(`
      INSERT INTO openbanking_tokens (
        user_id, access_token, refresh_token, user_seq_no, scope, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        user_seq_no = EXCLUDED.user_seq_no,
        scope = EXCLUDED.scope,
        expires_at = EXCLUDED.expires_at,
        updated_at = CURRENT_TIMESTAMP
    `, [
      userId,
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.user_seq_no,
      tokenData.scope,
      expiresAt
    ]);

    // 성공적으로 연결된 후 오픈뱅킹 페이지로 리다이렉트
    return NextResponse.redirect(
      new URL('/openbanking?connected=true', request.url)
    );

  } catch (error) {
    console.error('오픈뱅킹 콜백 처리 오류:', error);
    return NextResponse.redirect(
      new URL('/openbanking?error=callback_failed', request.url)
    );
  }
}

// 콜백 URL 생성 함수
function getCallbackUrl(request: NextRequest): string {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return `${protocol}://${host}/api/openbanking/callback`;
}

// 오픈뱅킹 인증 URL 생성 API
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
    }

    const userId = decoded.userId;
    const callbackUrl = getCallbackUrl(request);
    
    // 상태값 생성 (CSRF 방지)
    const state = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 오픈뱅킹 인증 URL 생성
    const authUrl = new URL(`${OPENBANKING_BASE_URL}/oauth/2.0/authorize`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('scope', 'login inquiry transfer');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('auth_type', '0'); // 0: 공동인증서, 1: 간편인증
    authUrl.searchParams.set('lang', 'ko'); // 언어 설정
    authUrl.searchParams.set('cellphone_cert_yn', 'Y'); // 휴대폰 인증 허용
    authUrl.searchParams.set('authorized_cert_yn', 'Y'); // 공동인증서 허용

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
      state,
      callbackUrl
    });

  } catch (error) {
    console.error('인증 URL 생성 오류:', error);
    return NextResponse.json(
      { error: '인증 URL 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
