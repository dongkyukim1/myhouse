import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { formatAmount } from '@/lib/openbanking';
import axios from 'axios';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const OPENBANKING_BASE_URL = 'https://testapi.openbanking.or.kr/v2.0';

// 대출 한도 조회
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

    // 사용자의 청약통장 정보 조회
    const accountsResult = await query(
      'SELECT * FROM openbanking_accounts WHERE user_id = $1 AND is_subscription_account = true',
      [userId]
    );

    // 청약 자격 정보 조회
    const eligibilityResult = await query(
      'SELECT * FROM subscription_eligibility WHERE user_id = $1',
      [userId]
    );

    const eligibility = eligibilityResult.rows[0] || {};
    const subscriptionAccounts = accountsResult.rows;

    // 청약통장 잔고 합계 계산
    let totalSubscriptionBalance = 0;
    for (const account of subscriptionAccounts) {
      const balanceResult = await query(
        'SELECT balance_amt FROM balance_history WHERE account_id = $1 ORDER BY inquiry_date DESC LIMIT 1',
        [account.id]
      );
      if (balanceResult.rows.length > 0) {
        totalSubscriptionBalance += parseInt(balanceResult.rows[0].balance_amt);
      }
    }

    // 기본 대출 한도 계산 로직
    const baseScore = eligibility.score || 0;
    const deposits = eligibility.deposits || 0;
    const creditScore = eligibility.credit_score || 600;

    // 청약통장 납입 기간 기반 가산점
    let depositBonus = 0;
    if (deposits >= 24) depositBonus = 100; // 24회 이상
    else if (deposits >= 12) depositBonus = 50; // 12회 이상
    else if (deposits >= 6) depositBonus = 25; // 6회 이상

    // 신용점수 기반 가산점
    let creditBonus = 0;
    if (creditScore >= 800) creditBonus = 150;
    else if (creditScore >= 700) creditBonus = 100;
    else if (creditScore >= 600) creditBonus = 50;

    // 청약통장 잔고 기반 가산점 (잔고의 10배까지)
    const balanceBonus = Math.min(totalSubscriptionBalance * 10, 500000000); // 최대 5억

    // 총 대출 한도 계산
    const totalLoanLimit = baseScore * 1000000 + depositBonus * 1000000 + creditBonus * 1000000 + balanceBonus;

    // 실제 오픈뱅킹 API 호출 (테스트 환경에서는 모의 데이터 사용)
    let bankLoanLimits: Array<{
      bankCode: string;
      bankName: string;
      productName: string;
      loanLimitAmt: string;
      loanRate: string;
      loanType: string;
    }> = [];
    
    try {
      // 실제 환경에서는 각 은행별 대출 한도 조회 API를 호출
      // 현재는 모의 데이터로 대체
      bankLoanLimits = [
        {
          bankCode: '004',
          bankName: 'KB국민은행',
          productName: 'KB주택담보대출',
          loanLimitAmt: Math.floor(totalLoanLimit * 0.8).toString(),
          loanRate: '3.2',
          loanType: '주택담보대출'
        },
        {
          bankCode: '088',
          bankName: '신한은행',
          productName: '신한 내집마련 대출',
          loanLimitAmt: Math.floor(totalLoanLimit * 0.75).toString(),
          loanRate: '3.1',
          loanType: '주택담보대출'
        },
        {
          bankCode: '020',
          bankName: '우리은행',
          productName: '우리 주택구입자금대출',
          loanLimitAmt: Math.floor(totalLoanLimit * 0.85).toString(),
          loanRate: '3.3',
          loanType: '주택담보대출'
        }
      ];
    } catch (error) {
      console.error('은행별 대출 한도 조회 실패:', error);
    }

    // 대출 한도 정보 저장/업데이트
    await query(`
      INSERT INTO subscription_eligibility (user_id, loan_limit_amount)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET 
        loan_limit_amount = EXCLUDED.loan_limit_amount,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, totalLoanLimit]);

    // DSR (부채상환비율) 계산을 위한 기존 대출 조회
    const existingLoansResult = await query(`
      SELECT COALESCE(SUM(loan_balance), 0) as total_existing_loan
      FROM (
        SELECT 50000000 as loan_balance  -- 예시 기존 대출
        WHERE 1=0  -- 실제로는 오픈뱅킹 API에서 조회
      ) as existing_loans
    `);

    const existingLoanBalance = parseInt(existingLoansResult.rows[0]?.total_existing_loan || 0);

    // 청약 점수 기반 추천 대출 상품
    const recommendedProducts = [];
    
    if (baseScore >= 70) {
      recommendedProducts.push({
        type: '신혼부부 특별공급',
        description: '신혼부부 대상 우대 대출',
        maxAmount: Math.floor(totalLoanLimit * 1.2),
        interestRate: '2.8%',
        benefits: ['금리 우대', '한도 확대', '중도상환 수수료 면제']
      });
    }

    if (deposits >= 24) {
      recommendedProducts.push({
        type: '청약통장 연계 대출',
        description: '24회 이상 납입자 우대',
        maxAmount: Math.floor(totalLoanLimit * 1.1),
        interestRate: '3.0%',
        benefits: ['장기납입 우대', '추가 한도 제공']
      });
    }

    if (totalSubscriptionBalance >= 30000000) {
      recommendedProducts.push({
        type: '고액납입자 우대 대출',
        description: '3천만원 이상 납입자 특혜',
        maxAmount: Math.floor(totalLoanLimit * 1.15),
        interestRate: '2.9%',
        benefits: ['고액납입 우대', '특별금리 적용']
      });
    }

    return NextResponse.json({
      success: true,
      loanLimit: {
        totalLimit: totalLoanLimit,
        totalLimitFormatted: formatAmount(totalLoanLimit),
        availableLimit: Math.max(0, totalLoanLimit - existingLoanBalance),
        availableLimitFormatted: formatAmount(Math.max(0, totalLoanLimit - existingLoanBalance)),
        existingLoanBalance,
        existingLoanBalanceFormatted: formatAmount(existingLoanBalance)
      },
      calculation: {
        baseScore,
        deposits,
        creditScore,
        totalSubscriptionBalance,
        totalSubscriptionBalanceFormatted: formatAmount(totalSubscriptionBalance),
        depositBonus: depositBonus * 1000000,
        creditBonus: creditBonus * 1000000,
        balanceBonus,
        depositBonusFormatted: formatAmount(depositBonus * 1000000),
        creditBonusFormatted: formatAmount(creditBonus * 1000000),
        balanceBonusFormatted: formatAmount(balanceBonus)
      },
      bankLoanLimits: bankLoanLimits.map(bank => ({
        ...bank,
        loanLimitAmtFormatted: formatAmount(bank.loanLimitAmt),
        loanLimitAmt: parseInt(bank.loanLimitAmt)
      })),
      recommendedProducts: recommendedProducts.map(product => ({
        ...product,
        maxAmountFormatted: formatAmount(product.maxAmount)
      })),
      subscriptionInfo: {
        accountCount: subscriptionAccounts.length,
        totalBalance: totalSubscriptionBalance,
        totalBalanceFormatted: formatAmount(totalSubscriptionBalance),
        deposits,
        score: baseScore
      }
    });

  } catch (error) {
    console.error('대출 한도 조회 오류:', error);
    return NextResponse.json(
      { error: '대출 한도 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 대출 한도 재계산 요청
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
    const { income, existingLoan, purpose } = body;

    // 입력값 검증
    if (income !== undefined && income < 0) {
      return NextResponse.json(
        { error: '소득은 0 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    if (existingLoan !== undefined && existingLoan < 0) {
      return NextResponse.json(
        { error: '기존 대출은 0 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 소득 기반 추가 한도 계산
    let incomeBasedLimit = 0;
    if (income) {
      // 연소득의 8배까지 (DTI 고려)
      incomeBasedLimit = Math.floor(income * 8);
    }

    // DSR 계산 (기존 대출 + 신규 대출의 연간 상환액이 연소득의 40% 이하)
    const maxDSR = 0.4;
    const maxAnnualPayment = income * maxDSR;
    const existingAnnualPayment = existingLoan ? existingLoan * 0.06 : 0; // 6% 가정
    const availableAnnualPayment = maxAnnualPayment - existingAnnualPayment;
    const dsrBasedLimit = availableAnnualPayment > 0 ? Math.floor(availableAnnualPayment / 0.06) : 0;

    // 기존 대출 한도 조회
    const eligibilityResult = await query(
      'SELECT loan_limit_amount FROM subscription_eligibility WHERE user_id = $1',
      [userId]
    );

    const baseLoanLimit = eligibilityResult.rows[0]?.loan_limit_amount || 0;

    // 최종 대출 한도 계산 (가장 낮은 값 적용)
    const finalLoanLimit = Math.min(
      baseLoanLimit,
      incomeBasedLimit || baseLoanLimit,
      dsrBasedLimit || baseLoanLimit
    );

    // 용도별 한도 조정
    let purposeMultiplier = 1.0;
    let purposeDescription = '';
    
    switch (purpose) {
      case 'first_home':
        purposeMultiplier = 1.2;
        purposeDescription = '생애최초 주택구입 우대';
        break;
      case 'newlywed':
        purposeMultiplier = 1.15;
        purposeDescription = '신혼부부 우대';
        break;
      case 'multi_child':
        purposeMultiplier = 1.1;
        purposeDescription = '다자녀 가구 우대';
        break;
      default:
        purposeDescription = '일반 주택구입';
    }

    const adjustedLoanLimit = Math.floor(finalLoanLimit * purposeMultiplier);

    // 재계산된 정보 저장
    await query(`
      UPDATE subscription_eligibility 
      SET loan_limit_amount = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
    `, [adjustedLoanLimit, userId]);

    return NextResponse.json({
      success: true,
      message: '대출 한도가 재계산되었습니다.',
      recalculatedLimit: {
        finalLimit: adjustedLoanLimit,
        finalLimitFormatted: formatAmount(adjustedLoanLimit),
        baseLoanLimit,
        baseLoanLimitFormatted: formatAmount(baseLoanLimit),
        incomeBasedLimit: incomeBasedLimit || null,
        incomeBasedLimitFormatted: incomeBasedLimit ? formatAmount(incomeBasedLimit) : null,
        dsrBasedLimit: dsrBasedLimit || null,
        dsrBasedLimitFormatted: dsrBasedLimit ? formatAmount(dsrBasedLimit) : null,
        purposeMultiplier,
        purposeDescription,
        income: income || null,
        incomeFormatted: income ? formatAmount(income) : null,
        existingLoan: existingLoan || null,
        existingLoanFormatted: existingLoan ? formatAmount(existingLoan) : null,
        maxDSR,
        availableAnnualPayment: availableAnnualPayment > 0 ? availableAnnualPayment : null,
        availableAnnualPaymentFormatted: availableAnnualPayment > 0 ? formatAmount(availableAnnualPayment) : null
      }
    });

  } catch (error) {
    console.error('대출 한도 재계산 오류:', error);
    return NextResponse.json(
      { error: '대출 한도 재계산 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
