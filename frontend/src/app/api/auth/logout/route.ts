import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    // 세션 삭제 (토큰이 있는 경우)
    if (token) {
      try {
        await query('DELETE FROM user_sessions WHERE token = $1', [token]);
      } catch (error) {
        console.error('세션 삭제 오류:', error);
        // 세션 삭제 실패해도 로그아웃은 진행
      }
    }

    const response = NextResponse.json({
      message: '로그아웃이 완료되었습니다.'
    });

    // 인증 토큰 쿠키 제거
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('로그아웃 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
