import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 매물 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;

    // 조회수 증가
    await query('UPDATE marketplace_rooms SET view_count = view_count + 1 WHERE id = $1', [roomId]);

    // 매물 상세 조회
    const roomResult = await query(`
      SELECT 
        r.*,
        u.name as owner_name,
        u.phone as owner_phone,
        u.email as owner_email
      FROM marketplace_rooms r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = $1
    `, [roomId]);

    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { error: '매물을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const room = roomResult.rows[0];
    
    // JSON 필드 파싱
    if (room.options) {
      room.options = JSON.parse(room.options);
    }
    if (room.images) {
      room.images = JSON.parse(room.images);
    }

    return NextResponse.json({
      success: true,
      room
    });

  } catch (error) {
    console.error('매물 조회 오류:', error);
    return NextResponse.json(
      { error: '매물 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 매물 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const roomId = params.id;
    const body = await request.json();

    // 매물 소유자 확인
    const roomResult = await query(
      'SELECT user_id FROM marketplace_rooms WHERE id = $1',
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { error: '매물을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (roomResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: '매물을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 업데이트할 필드들 구성
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    const updatableFields = [
      'title', 'description', 'room_type', 'address', 'district', 'neighborhood',
      'monthly_rent', 'deposit', 'maintenance_fee', 'area', 'floor', 'total_floors',
      'building_type', 'room_count', 'bathroom_count', 'available_date',
      'phone_number', 'negotiable', 'status'
    ];

    updatableFields.forEach(field => {
      const snakeCaseField = field;
      const camelCaseField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      if (body[camelCaseField] !== undefined) {
        updateFields.push(`${snakeCaseField} = $${paramIndex++}`);
        values.push(body[camelCaseField]);
      }
    });

    // JSON 필드들 처리
    if (body.options !== undefined) {
      updateFields.push(`options = $${paramIndex++}`);
      values.push(JSON.stringify(body.options));
    }

    if (body.images !== undefined) {
      updateFields.push(`images = $${paramIndex++}`);
      values.push(JSON.stringify(body.images));
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(roomId);

    const updateQuery = `
      UPDATE marketplace_rooms 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    return NextResponse.json({
      success: true,
      room: result.rows[0]
    });

  } catch (error) {
    console.error('매물 수정 오류:', error);
    return NextResponse.json(
      { error: '매물 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 매물 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const roomId = params.id;

    // 매물 소유자 확인
    const roomResult = await query(
      'SELECT user_id FROM marketplace_rooms WHERE id = $1',
      [roomId]
    );

    if (roomResult.rows.length === 0) {
      return NextResponse.json(
        { error: '매물을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (roomResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: '매물을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 매물 삭제 (상태 변경)
    await query(
      "UPDATE marketplace_rooms SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [roomId]
    );

    return NextResponse.json({
      success: true,
      message: '매물이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('매물 삭제 오류:', error);
    return NextResponse.json(
      { error: '매물 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
