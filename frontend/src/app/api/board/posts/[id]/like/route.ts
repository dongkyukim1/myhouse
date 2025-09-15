import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 게시글 좋아요 토글
export async function POST(
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

    // 기존 좋아요 확인
    const existingLike = await query(
      'SELECT id FROM board_post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    if (existingLike.rows.length > 0) {
      // 좋아요 제거
      await query(
        'DELETE FROM board_post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      // 게시글의 좋아요 수 감소
      await query(
        'UPDATE board_posts SET like_count = like_count - 1 WHERE id = $1',
        [postId]
      );

      return NextResponse.json({
        success: true,
        action: 'unliked',
        message: '좋아요를 취소했습니다.'
      });
    } else {
      // 좋아요 추가
      await query(
        'INSERT INTO board_post_likes (post_id, user_id) VALUES ($1, $2)',
        [postId, userId]
      );

      // 게시글의 좋아요 수 증가
      await query(
        'UPDATE board_posts SET like_count = like_count + 1 WHERE id = $1',
        [postId]
      );

      return NextResponse.json({
        success: true,
        action: 'liked',
        message: '좋아요를 추가했습니다.'
      });
    }

  } catch (error) {
    console.error('좋아요 토글 오류:', error);
    return NextResponse.json(
      { error: '좋아요 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 게시글 좋아요 상태 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({
        success: true,
        isLiked: false,
        likeCount: 0
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({
        success: true,
        isLiked: false,
        likeCount: 0
      });
    }

    const userId = decoded.userId;
    const postId = params.id;

    // 좋아요 상태 및 총 좋아요 수 조회
    const result = await query(`
      SELECT 
        bp.like_count,
        CASE WHEN bpl.id IS NOT NULL THEN true ELSE false END as is_liked
      FROM board_posts bp
      LEFT JOIN board_post_likes bpl ON bp.id = bpl.post_id AND bpl.user_id = $2
      WHERE bp.id = $1
    `, [postId, userId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const { like_count, is_liked } = result.rows[0];

    return NextResponse.json({
      success: true,
      isLiked: is_liked,
      likeCount: like_count
    });

  } catch (error) {
    console.error('좋아요 상태 조회 오류:', error);
    return NextResponse.json(
      { error: '좋아요 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}