import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { formatAmount } from '@/lib/openbanking';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 자동납입 설정 조회
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

    // 자동납입 설정 조회
    const autoPaymentsResult = await query(`
      SELECT ap.*, oa.account_alias, oa.bank_name, oa.account_num_masked, oa.fintech_use_num
      FROM auto_payments ap
      JOIN openbanking_accounts oa ON ap.account_id = oa.id
      WHERE ap.user_id = $1
      ORDER BY ap.created_at DESC
    `, [userId]);

    const autoPayments = autoPaymentsResult.rows.map(row => ({
      id: row.id,
      accountId: row.account_id,
      accountAlias: row.account_alias,
      bankName: row.bank_name,
      accountNumMasked: row.account_num_masked,
      fintechUseNum: row.fintech_use_num,
      paymentAmount: row.payment_amount,
      paymentAmountFormatted: formatAmount(row.payment_amount),
      paymentDay: row.payment_day,
      isActive: row.is_active,
      lastPaymentDate: row.last_payment_date,
      nextPaymentDate: row.next_payment_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    // 다음 납입 예정 금액 계산
    const totalMonthlyPayment = autoPayments
      .filter(ap => ap.isActive)
      .reduce((sum, ap) => sum + ap.paymentAmount, 0);

    // 이번 달 남은 납입 일정
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    const thisMonthPayments = autoPayments
      .filter(ap => ap.isActive && ap.paymentDay >= currentDay)
      .map(ap => {
        const nextPaymentDate = new Date(currentYear, currentMonth, ap.paymentDay);
        return {
          ...ap,
          daysUntilPayment: Math.ceil((nextPaymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        };
      })
      .sort((a, b) => a.daysUntilPayment - b.daysUntilPayment);

    return NextResponse.json({
      success: true,
      autoPayments,
      summary: {
        totalSettings: autoPayments.length,
        activeSettings: autoPayments.filter(ap => ap.isActive).length,
        totalMonthlyPayment,
        totalMonthlyPaymentFormatted: formatAmount(totalMonthlyPayment),
        thisMonthPayments,
        nextPaymentDate: thisMonthPayments.length > 0 ? thisMonthPayments[0].nextPaymentDate : null,
        nextPaymentAmount: thisMonthPayments.length > 0 ? thisMonthPayments[0].paymentAmount : 0
      }
    });

  } catch (error) {
    console.error('자동납입 설정 조회 오류:', error);
    return NextResponse.json(
      { error: '자동납입 설정 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 자동납입 설정 생성
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
    const { accountId, paymentAmount, paymentDay } = body;

    // 입력값 검증
    if (!accountId || !paymentAmount || !paymentDay) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    if (paymentAmount <= 0) {
      return NextResponse.json(
        { error: '납입금액은 0보다 커야 합니다.' },
        { status: 400 }
      );
    }

    if (paymentDay < 1 || paymentDay > 31) {
      return NextResponse.json(
        { error: '납입일은 1일부터 31일 사이여야 합니다.' },
        { status: 400 }
      );
    }

    // 해당 계좌가 사용자의 것인지 확인
    const accountResult = await query(
      'SELECT * FROM openbanking_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (accountResult.rows.length === 0) {
      return NextResponse.json(
        { error: '유효하지 않은 계좌입니다.' },
        { status: 404 }
      );
    }

    // 해당 계좌에 이미 활성화된 자동납입이 있는지 확인
    const existingResult = await query(
      'SELECT * FROM auto_payments WHERE account_id = $1 AND is_active = true',
      [accountId]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: '해당 계좌에 이미 활성화된 자동납입 설정이 있습니다.' },
        { status: 400 }
      );
    }

    // 다음 납입일 계산
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    let nextPaymentDate;
    if (paymentDay > currentDay) {
      // 이번 달에 납입
      nextPaymentDate = new Date(currentYear, currentMonth, paymentDay);
    } else {
      // 다음 달에 납입
      nextPaymentDate = new Date(currentYear, currentMonth + 1, paymentDay);
    }

    // 자동납입 설정 생성
    const result = await query(`
      INSERT INTO auto_payments (
        user_id, account_id, payment_amount, payment_day, 
        next_payment_date, is_active
      ) VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [userId, accountId, paymentAmount, paymentDay, nextPaymentDate]);

    const newAutoPayment = result.rows[0];

    return NextResponse.json({
      success: true,
      message: '자동납입 설정이 완료되었습니다.',
      autoPayment: {
        id: newAutoPayment.id,
        paymentAmount: newAutoPayment.payment_amount,
        paymentAmountFormatted: formatAmount(newAutoPayment.payment_amount),
        paymentDay: newAutoPayment.payment_day,
        nextPaymentDate: newAutoPayment.next_payment_date,
        isActive: newAutoPayment.is_active
      }
    });

  } catch (error) {
    console.error('자동납입 설정 생성 오류:', error);
    return NextResponse.json(
      { error: '자동납입 설정 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 자동납입 설정 수정
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
    const { id, paymentAmount, paymentDay, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: '자동납입 설정 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 기존 자동납입 설정 확인
    const existingResult = await query(
      'SELECT * FROM auto_payments WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: '유효하지 않은 자동납입 설정입니다.' },
        { status: 404 }
      );
    }

    const existing = existingResult.rows[0];
    let updateFields = [];
    let updateValues = [];
    let paramIndex = 1;

    // 업데이트할 필드들 동적 구성
    if (paymentAmount !== undefined) {
      if (paymentAmount <= 0) {
        return NextResponse.json(
          { error: '납입금액은 0보다 커야 합니다.' },
          { status: 400 }
        );
      }
      updateFields.push(`payment_amount = $${paramIndex++}`);
      updateValues.push(paymentAmount);
    }

    if (paymentDay !== undefined) {
      if (paymentDay < 1 || paymentDay > 31) {
        return NextResponse.json(
          { error: '납입일은 1일부터 31일 사이여야 합니다.' },
          { status: 400 }
        );
      }
      updateFields.push(`payment_day = $${paramIndex++}`);
      updateValues.push(paymentDay);

      // 납입일이 변경되면 다음 납입일도 재계산
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();

      let nextPaymentDate;
      if (paymentDay > currentDay) {
        nextPaymentDate = new Date(currentYear, currentMonth, paymentDay);
      } else {
        nextPaymentDate = new Date(currentYear, currentMonth + 1, paymentDay);
      }

      updateFields.push(`next_payment_date = $${paramIndex++}`);
      updateValues.push(nextPaymentDate);
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(isActive);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: '수정할 내용이 없습니다.' },
        { status: 400 }
      );
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id, userId);

    const updateQuery = `
      UPDATE auto_payments 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const updatedAutoPayment = result.rows[0];

    return NextResponse.json({
      success: true,
      message: '자동납입 설정이 수정되었습니다.',
      autoPayment: {
        id: updatedAutoPayment.id,
        paymentAmount: updatedAutoPayment.payment_amount,
        paymentAmountFormatted: formatAmount(updatedAutoPayment.payment_amount),
        paymentDay: updatedAutoPayment.payment_day,
        nextPaymentDate: updatedAutoPayment.next_payment_date,
        isActive: updatedAutoPayment.is_active,
        lastPaymentDate: updatedAutoPayment.last_payment_date,
        updatedAt: updatedAutoPayment.updated_at
      }
    });

  } catch (error) {
    console.error('자동납입 설정 수정 오류:', error);
    return NextResponse.json(
      { error: '자동납입 설정 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 자동납입 설정 삭제
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
        { error: '자동납입 설정 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 자동납입 설정 삭제
    const result = await query(
      'DELETE FROM auto_payments WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '유효하지 않은 자동납입 설정입니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '자동납입 설정이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('자동납입 설정 삭제 오류:', error);
    return NextResponse.json(
      { error: '자동납입 설정 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
