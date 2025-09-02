import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 테스트용 오픈뱅킹 연결 (모의 데이터)
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

    // 모의 토큰 데이터 생성
    const mockTokenData = {
      access_token: `mock_access_token_${Date.now()}`,
      refresh_token: `mock_refresh_token_${Date.now()}`,
      user_seq_no: `mock_user_${userId}_${Date.now()}`,
      scope: 'login inquiry transfer',
      expires_in: 3600
    };

    const expiresAt = new Date(Date.now() + mockTokenData.expires_in * 1000);

    // 토큰 정보 저장
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
    `, [
      userId,
      mockTokenData.access_token,
      mockTokenData.refresh_token,
      mockTokenData.user_seq_no,
      mockTokenData.scope,
      expiresAt
    ]);

    // 모의 계좌 데이터 생성
    const mockAccounts = [
      {
        fintech_use_num: `mock_fintech_${userId}_001`,
        account_alias: '내 청약통장',
        bank_code_std: '004',
        bank_name: 'KB국민은행',
        account_num_masked: '1234-56-******',
        account_holder_name: '홍길동',
        account_type: '1',
        product_name: 'KB 청약저축',
        is_subscription_account: true
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
        is_subscription_account: false
      }
    ];

    // 계좌 정보 저장
    for (const account of mockAccounts) {
      await query(`
        INSERT INTO openbanking_accounts (
          user_id, fintech_use_num, account_alias, bank_code_std, 
          bank_name, account_num_masked, account_holder_name, 
          account_type, product_name, is_subscription_account, 
          inquiry_agree_yn, transfer_agree_yn
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        account.product_name,
        account.is_subscription_account,
        'Y',
        'Y'
      ]);
    }

    // 모의 잔고 히스토리 생성
    const subscriptionAccount = mockAccounts.find(acc => acc.is_subscription_account);
    if (subscriptionAccount) {
      const accountResult = await query(
        'SELECT id FROM openbanking_accounts WHERE fintech_use_num = $1',
        [subscriptionAccount.fintech_use_num]
      );

      if (accountResult.rows.length > 0) {
        const accountId = accountResult.rows[0].id;
        const mockBalance = 15000000 + Math.floor(Math.random() * 10000000); // 1500만원 ~ 2500만원

        await query(`
          INSERT INTO balance_history (user_id, account_id, balance_amt, available_amt)
          VALUES ($1, $2, $3, $4)
        `, [userId, accountId, mockBalance, mockBalance]);
      }
    }

    return NextResponse.json({
      success: true,
      message: '테스트용 오픈뱅킹 계좌가 성공적으로 연결되었습니다.',
      data: {
        token: mockTokenData,
        accounts: mockAccounts
      }
    });

  } catch (error) {
    console.error('테스트 오픈뱅킹 연결 오류:', error);
    return NextResponse.json(
      { error: '테스트 연결 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
