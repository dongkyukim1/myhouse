import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 게시글 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    // 조회수 증가
    await query('UPDATE board_posts SET view_count = view_count + 1 WHERE id = $1', [postId]);

    // 게시글 상세 조회
    const postResult = await query(`
      SELECT 
        bp.*,
        bc.name as category_name,
        bc.slug as category_slug,
        bc.icon as category_icon,
        u.name as author_name,
        u.email as author_email
      FROM board_posts bp
      LEFT JOIN board_categories bc ON bp.category_id = bc.id
      LEFT JOIN users u ON bp.user_id = u.id
      WHERE bp.id = $1
    `, [postId]);

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const post = postResult.rows[0];

    // 댓글 조회
    const commentsResult = await query(`
      SELECT 
        bc.*,
        u.name as author_name,
        u.email as author_email
      FROM board_comments bc
      LEFT JOIN users u ON bc.user_id = u.id
      WHERE bc.post_id = $1 AND bc.is_deleted = false
      ORDER BY bc.created_at ASC
    `, [postId]);

    return NextResponse.json({
      success: true,
      post,
      comments: commentsResult.rows
    });

  } catch (error) {
    console.error('게시글 조회 오류:', error);
    return NextResponse.json(
      { error: '게시글 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 게시글 수정
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
    const postId = params.id;
    const body = await request.json();

    // 게시글 소유자 확인
    const postResult = await query(
      'SELECT user_id FROM board_posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (postResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: '게시글을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const { 
      title, 
      content, 
      excerpt, 
      categoryId, 
      tags, 
      status,
      metaDescription 
    } = body;

    // 수정할 필드들만 업데이트
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (content !== undefined) {
      updateFields.push(`content = $${paramIndex++}`);
      values.push(content);
    }
    if (excerpt !== undefined) {
      updateFields.push(`excerpt = $${paramIndex++}`);
      values.push(excerpt);
    }
    if (categoryId !== undefined) {
      updateFields.push(`category_id = $${paramIndex++}`);
      values.push(categoryId);
    }
    if (tags !== undefined) {
      updateFields.push(`tags = $${paramIndex++}`);
      values.push(tags);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (metaDescription !== undefined) {
      updateFields.push(`meta_description = $${paramIndex++}`);
      values.push(metaDescription);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(postId);

    const updateQuery = `
      UPDATE board_posts 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    return NextResponse.json({
      success: true,
      post: result.rows[0]
    });

  } catch (error) {
    console.error('게시글 수정 오류:', error);
    return NextResponse.json(
      { error: '게시글 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 게시글 삭제
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
    const postId = params.id;

    // 게시글 소유자 확인
    const postResult = await query(
      'SELECT user_id FROM board_posts WHERE id = $1',
      [postId]
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (postResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: '게시글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 게시글 삭제 (실제로는 상태 변경)
    await query(
      "UPDATE board_posts SET status = 'deleted', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [postId]
    );

    return NextResponse.json({
      success: true,
      message: '게시글이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    return NextResponse.json(
      { error: '게시글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
