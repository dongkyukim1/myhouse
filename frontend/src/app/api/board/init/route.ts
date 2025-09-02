import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 기본 카테고리 생성
export async function POST(request: NextRequest) {
  try {
    const defaultCategories = [
      {
        name: '일반 정보',
        slug: 'general',
        description: '일반적인 청약 관련 정보를 공유하는 게시판입니다.',
        icon: '📝',
        order_index: 1
      },
      {
        name: '청약 팁',
        slug: 'tips',
        description: '청약 성공을 위한 유용한 팁과 노하우를 공유합니다.',
        icon: '💡',
        order_index: 2
      },
      {
        name: '질문/답변',
        slug: 'qna',
        description: '청약 관련 궁금한 점을 질문하고 답변하는 게시판입니다.',
        icon: '❓',
        order_index: 3
      },
      {
        name: '후기/체험담',
        slug: 'reviews',
        description: '청약 신청 후기와 실제 체험담을 공유합니다.',
        icon: '📖',
        order_index: 4
      },
      {
        name: '공지사항',
        slug: 'notice',
        description: '중요한 공지사항과 업데이트 정보입니다.',
        icon: '📢',
        order_index: 0
      }
    ];

    const createdCategories = [];

    for (const category of defaultCategories) {
      try {
        const result = await query(`
          INSERT INTO board_categories (name, slug, description, icon, order_index)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (slug) DO NOTHING
          RETURNING *
        `, [category.name, category.slug, category.description, category.icon, category.order_index]);

        if (result.rows.length > 0) {
          createdCategories.push(result.rows[0]);
        }
      } catch (error) {
        console.error(`카테고리 생성 실패 (${category.slug}):`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: '기본 카테고리가 생성되었습니다.',
      created: createdCategories.length,
      categories: createdCategories
    });

  } catch (error) {
    console.error('기본 카테고리 생성 오류:', error);
    return NextResponse.json(
      { error: '기본 카테고리 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
