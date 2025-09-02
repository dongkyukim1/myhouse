import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 댓글 생성
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
    const { postId, content, parentId } = body;

    if (!postId || !content) {
      return NextResponse.json(
        { error: '게시글 ID와 댓글 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 게시글 존재 확인
    const postResult = await query(
      'SELECT id FROM board_posts WHERE id = $1 AND status = $2',
      [postId, 'published']
    );

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 댓글 생성
    const result = await query(`
      INSERT INTO board_comments (post_id, user_id, parent_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [postId, userId, parentId || null, content]);

    // 게시글의 댓글 수 업데이트
    await query(
      'UPDATE board_posts SET comment_count = comment_count + 1 WHERE id = $1',
      [postId]
    );

    return NextResponse.json({
      success: true,
      comment: result.rows[0]
    });

  } catch (error) {
    console.error('댓글 생성 오류:', error);
    return NextResponse.json(
      { error: '댓글 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 댓글 수정
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
    const { commentId, content } = body;

    if (!commentId || !content) {
      return NextResponse.json(
        { error: '댓글 ID와 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // 댓글 소유자 확인
    const commentResult = await query(
      'SELECT user_id FROM board_comments WHERE id = $1 AND is_deleted = false',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (commentResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: '댓글을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 댓글 수정
    const result = await query(`
      UPDATE board_comments 
      SET content = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING *
    `, [content, commentId]);

    return NextResponse.json({
      success: true,
      comment: result.rows[0]
    });

  } catch (error) {
    console.error('댓글 수정 오류:', error);
    return NextResponse.json(
      { error: '댓글 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 댓글 삭제
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
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { error: '댓글 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 댓글 소유자 확인
    const commentResult = await query(
      'SELECT user_id, post_id FROM board_comments WHERE id = $1 AND is_deleted = false',
      [commentId]
    );

    if (commentResult.rows.length === 0) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (commentResult.rows[0].user_id !== userId) {
      return NextResponse.json(
        { error: '댓글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const postId = commentResult.rows[0].post_id;

    // 댓글 삭제 (소프트 삭제)
    await query(
      'UPDATE board_comments SET is_deleted = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [commentId]
    );

    // 게시글의 댓글 수 업데이트
    await query(
      'UPDATE board_posts SET comment_count = comment_count - 1 WHERE id = $1',
      [postId]
    );

    return NextResponse.json({
      success: true,
      message: '댓글이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    return NextResponse.json(
      { error: '댓글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
