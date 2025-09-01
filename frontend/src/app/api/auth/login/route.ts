import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 조회
    const userResult = await query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 세션 저장 (선택적)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await query(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // JWT 토큰을 쿠키에 설정
    const response = NextResponse.json({
      message: '로그인이 완료되었습니다.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('로그인 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
