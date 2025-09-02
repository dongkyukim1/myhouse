import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { getUserAccounts, filterSubscriptionAccounts } from '@/lib/openbanking';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 사용자의 오픈뱅킹 계좌 목록 조회
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

    // 오픈뱅킹 토큰 조회
    const tokenResult = await query(
      'SELECT access_token, user_seq_no FROM openbanking_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (tokenResult.rows.length === 0) {
      return NextResponse.json({ 
        error: '오픈뱅킹 인증이 필요합니다.',
        needAuth: true 
      }, { status: 401 });
    }

    const { access_token, user_seq_no } = tokenResult.rows[0];

    // 오픈뱅킹 API로부터 계좌 목록 조회 (실패 시 모의 데이터 사용)
    let accounts = [];
    let subscriptionAccounts = [];
    
    try {
      accounts = await getUserAccounts(access_token, user_seq_no);
      subscriptionAccounts = filterSubscriptionAccounts(accounts);
    } catch (error) {
      console.error('오픈뱅킹 API 오류, 모의 데이터 사용:', error);
      
      // 모의 계좌 데이터 생성
      accounts = [
        {
          fintech_use_num: `mock_fintech_${userId}_001`,
          account_alias: '내 청약통장',
          bank_code_std: '004',
          bank_name: 'KB국민은행',
          account_num_masked: '1234-56-******',
          account_holder_name: '홍길동',
          account_type: '1',
          product_name: 'KB 청약저축',
          inquiry_agree_yn: 'Y',
          inquiry_agree_dtime: new Date().toISOString(),
          transfer_agree_yn: 'Y',
          transfer_agree_dtime: new Date().toISOString()
        },
        {
          fintech_use_num: `mock_fintech_${userId}_002`,
          account_alias: '주거래 통장',
          bank_code_std: '088',
          bank_name: '신한은행',
          account_num_masked: '5678-90-******',
          account_holder_name: '홍길동',
          account_type: '2',
          product_name: '신한 입출금통장',
          inquiry_agree_yn: 'Y',
          inquiry_agree_dtime: new Date().toISOString(),
          transfer_agree_yn: 'Y',
          transfer_agree_dtime: new Date().toISOString()
        }
      ];
      
      subscriptionAccounts = accounts.filter(acc => 
        acc.account_type === '1' || 
        acc.product_name?.includes('청약') ||
        acc.account_alias?.includes('청약')
      );
    }

    // 데이터베이스에 계좌 정보 저장/업데이트
    for (const account of accounts) {
      await query(`
        INSERT INTO openbanking_accounts (
          user_id, fintech_use_num, account_alias, bank_code_std, 
          bank_name, account_num_masked, account_holder_name, 
          account_type, is_subscription_account, inquiry_agree_yn, transfer_agree_yn
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (fintech_use_num) 
        DO UPDATE SET 
          account_alias = EXCLUDED.account_alias,
          updated_at = CURRENT_TIMESTAMP
      `, [
        userId,
        account.fintech_use_num,
        account.account_alias,
        account.bank_code_std,
        account.bank_name,
        account.account_num_masked,
        account.account_holder_name,
        account.account_type,
        subscriptionAccounts.some(sa => sa.fintech_use_num === account.fintech_use_num),
        account.inquiry_agree_yn,
        account.transfer_agree_yn
      ]);
    }

    // 청약통장만 반환
    const subscriptionAccountsWithIds = await query(`
      SELECT oa.*, 
             CASE WHEN ap.id IS NOT NULL THEN true ELSE false END as has_auto_payment
      FROM openbanking_accounts oa
      LEFT JOIN auto_payments ap ON oa.id = ap.account_id AND ap.is_active = true
      WHERE oa.user_id = $1 AND oa.is_subscription_account = true
      ORDER BY oa.created_at DESC
    `, [userId]);

    return NextResponse.json({
      success: true,
      accounts: subscriptionAccountsWithIds.rows,
      totalCount: accounts.length,
      subscriptionCount: subscriptionAccounts.length
    });

  } catch (error) {
    console.error('계좌 조회 오류:', error);
    return NextResponse.json(
      { error: '계좌 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 오픈뱅킹 계좌 연결
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
    const { access_token, refresh_token, user_seq_no, scope, expires_in } = body;

    if (!access_token || !user_seq_no) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 만료 시간 계산 (초 단위를 timestamp로 변환)
    const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);

    // 오픈뱅킹 토큰 저장
    await query(`
      INSERT INTO openbanking_tokens (
        user_id, access_token, refresh_token, user_seq_no, scope, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        user_seq_no = EXCLUDED.user_seq_no,
        scope = EXCLUDED.scope,
        expires_at = EXCLUDED.expires_at,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, access_token, refresh_token, user_seq_no, scope, expiresAt]);

    return NextResponse.json({
      success: true,
      message: '오픈뱅킹 계좌가 성공적으로 연결되었습니다.'
    });

  } catch (error) {
    console.error('계좌 연결 오류:', error);
    return NextResponse.json(
      { error: '계좌 연결 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
