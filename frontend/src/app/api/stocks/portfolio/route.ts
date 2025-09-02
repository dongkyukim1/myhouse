import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 포트폴리오 조회
export async function GET(request: NextRequest) {
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

    // 사용자 포트폴리오 조회
    const portfolioResult = await query(`
      SELECT * FROM user_portfolio 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);

    return NextResponse.json({
      success: true,
      portfolio: portfolioResult.rows
    });

  } catch (error) {
    console.error('포트폴리오 조회 오류:', error);
    return NextResponse.json(
      { error: '포트폴리오 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 포트폴리오 종목 추가
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
    const body = await request.json();
    const { symbol, name, quantity, purchase_price, market } = body;

    if (!symbol || !name || !quantity || !purchase_price || !market) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 포트폴리오에 종목 추가
    const result = await query(`
      INSERT INTO user_portfolio (user_id, symbol, name, quantity, purchase_price, market)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, symbol, name, quantity, purchase_price, market]);

    return NextResponse.json({
      success: true,
      portfolio_item: result.rows[0]
    });

  } catch (error: any) {
    console.error('포트폴리오 추가 오류:', error);
    
    if (error.code === '23505') { // unique constraint violation
      return NextResponse.json(
        { error: '이미 포트폴리오에 있는 종목입니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '포트폴리오 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 포트폴리오 종목 수정
export async function PUT(request: NextRequest) {
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
    const body = await request.json();
    const { id, quantity, purchase_price } = body;

    if (!id || !quantity || !purchase_price) {
      return NextResponse.json(
        { error: '필수 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 소유권 확인 및 업데이트
    const result = await query(`
      UPDATE user_portfolio 
      SET quantity = $1, purchase_price = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `, [quantity, purchase_price, id, userId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '포트폴리오 항목을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      portfolio_item: result.rows[0]
    });

  } catch (error) {
    console.error('포트폴리오 수정 오류:', error);
    return NextResponse.json(
      { error: '포트폴리오 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 포트폴리오 종목 삭제
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '포트폴리오 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 소유권 확인 및 삭제
    const result = await query(`
      DELETE FROM user_portfolio 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [id, userId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '포트폴리오 항목을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '포트폴리오에서 삭제되었습니다.'
    });

  } catch (error) {
    console.error('포트폴리오 삭제 오류:', error);
    return NextResponse.json(
      { error: '포트폴리오 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
