import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');
    const featured = searchParams.get('featured') === 'true';
    
    const offset = (page - 1) * limit;

    let whereConditions = ['bp.status = $1'];
    let params: any[] = ['published'];
    let paramIndex = 2;

    // 카테고리 필터
    if (category) {
      whereConditions.push(`bc.slug = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    // 검색 조건
    if (search) {
      whereConditions.push(`(bp.title ILIKE $${paramIndex} OR bp.content ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // 태그 필터
    if (tag) {
      whereConditions.push(`$${paramIndex} = ANY(bp.tags)`);
      params.push(tag);
      paramIndex++;
    }

    // 추천글 필터
    if (featured) {
      whereConditions.push('bp.is_featured = true');
    }

    const whereClause = whereConditions.join(' AND ');

    // 총 개수 조회
    const countQuery = `
      SELECT COUNT(*) as total
      FROM board_posts bp
      LEFT JOIN board_categories bc ON bp.category_id = bc.id
      LEFT JOIN users u ON bp.user_id = u.id
      WHERE ${whereClause}
    `;

    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // 게시글 목록 조회
    const postsQuery = `
      SELECT 
        bp.id,
        bp.title,
        bp.content,
        bp.excerpt,
        bp.slug,
        bp.view_count,
        bp.like_count,
        bp.comment_count,
        bp.is_featured,
        bp.is_pinned,
        bp.tags,
        bp.created_at,
        bp.updated_at,
        bc.name as category_name,
        bc.slug as category_slug,
        bc.icon as category_icon,
        u.name as author_name,
        u.email as author_email
      FROM board_posts bp
      LEFT JOIN board_categories bc ON bp.category_id = bc.id
      LEFT JOIN users u ON bp.user_id = u.id
      WHERE ${whereClause}
      ORDER BY bp.is_pinned DESC, bp.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const postsResult = await query(postsQuery, params);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      posts: postsResult.rows,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: total,
        items_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('게시글 목록 조회 오류:', error);
    return NextResponse.json(
      { error: '게시글 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 게시글 생성
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
    const { 
      title, 
      content, 
      excerpt, 
      categoryId, 
      tags = [], 
      status = 'published',
      isFeatured = false,
      isPinned = false,
      metaDescription 
    } = body;

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: '제목, 내용, 카테고리는 필수입니다.' },
        { status: 400 }
      );
    }

    // 슬러그 생성 (제목 기반)
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-') + '-' + Date.now();

    // 자동 요약 생성 (내용의 첫 200자)
    const autoExcerpt = content
      .replace(/<[^>]*>/g, '')
      .substring(0, 200)
      .trim();

    const result = await query(`
      INSERT INTO board_posts (
        category_id, user_id, title, content, excerpt, slug, 
        status, tags, is_featured, is_pinned, meta_description
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      categoryId,
      userId,
      title,
      content,
      excerpt || autoExcerpt,
      slug,
      status,
      tags,
      isFeatured,
      isPinned,
      metaDescription
    ]);

    return NextResponse.json({
      success: true,
      post: result.rows[0]
    });

  } catch (error) {
    console.error('게시글 생성 오류:', error);
    return NextResponse.json(
      { error: '게시글 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
