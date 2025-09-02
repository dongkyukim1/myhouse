import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 카테고리 목록 조회
export async function GET(request: NextRequest) {
  try {
    const result = await query(`
      SELECT * FROM board_categories 
      WHERE is_active = true 
      ORDER BY order_index ASC, name ASC
    `);

    return NextResponse.json({
      success: true,
      categories: result.rows
    });

  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    return NextResponse.json(
      { error: '카테고리 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 카테고리 생성 (관리자만)
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

    const body = await request.json();
    const { name, slug, description, icon, orderIndex } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: '카테고리명과 슬러그는 필수입니다.' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO board_categories (name, slug, description, icon, order_index)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, slug, description, icon || '📝', orderIndex || 0]);

    return NextResponse.json({
      success: true,
      category: result.rows[0]
    });

  } catch (error: any) {
    console.error('카테고리 생성 오류:', error);
    
    if (error.code === '23505') { // unique constraint violation
      return NextResponse.json(
        { error: '이미 존재하는 슬러그입니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '카테고리 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
