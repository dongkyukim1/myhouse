import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 게시글 좋아요/좋아요 취소
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

    let isLiked = false;
    let likeCount = 0;

    if (existingLike.rows.length > 0) {
      // 좋아요 취소
      await query(
        'DELETE FROM board_post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, userId]
      );

      // 게시글 좋아요 수 감소
      await query(
        'UPDATE board_posts SET like_count = like_count - 1 WHERE id = $1',
        [postId]
      );

      isLiked = false;
    } else {
      // 좋아요 추가
      await query(
        'INSERT INTO board_post_likes (post_id, user_id) VALUES ($1, $2)',
        [postId, userId]
      );

      // 게시글 좋아요 수 증가
      await query(
        'UPDATE board_posts SET like_count = like_count + 1 WHERE id = $1',
        [postId]
      );

      isLiked = true;
    }

    // 현재 좋아요 수 조회
    const countResult = await query(
      'SELECT like_count FROM board_posts WHERE id = $1',
      [postId]
    );

    likeCount = countResult.rows[0].like_count;

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount,
      message: isLiked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.'
    });

  } catch (error) {
    console.error('좋아요 처리 오류:', error);
    return NextResponse.json(
      { error: '좋아요 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 사용자의 좋아요 상태 확인
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ isLiked: false, likeCount: 0 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ isLiked: false, likeCount: 0 });
    }

    const userId = decoded.userId;
    const postId = params.id;

    // 좋아요 상태 확인
    const likeResult = await query(
      'SELECT id FROM board_post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );

    // 총 좋아요 수 조회
    const countResult = await query(
      'SELECT like_count FROM board_posts WHERE id = $1',
      [postId]
    );

    const isLiked = likeResult.rows.length > 0;
    const likeCount = countResult.rows.length > 0 ? countResult.rows[0].like_count : 0;

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount
    });

  } catch (error) {
    console.error('좋아요 상태 확인 오류:', error);
    return NextResponse.json({ isLiked: false, likeCount: 0 });
  }
}
