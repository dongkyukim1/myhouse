import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';
import axios from 'axios';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 신용점수 조회
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

    // 기존 신용점수 정보 조회
    const eligibilityResult = await query(
      'SELECT credit_score, credit_grade, updated_at FROM subscription_eligibility WHERE user_id = $1',
      [userId]
    );

    let existingCreditInfo = null;
    if (eligibilityResult.rows.length > 0) {
      const existing = eligibilityResult.rows[0];
      existingCreditInfo = {
        score: existing.credit_score,
        grade: existing.credit_grade,
        lastUpdated: existing.updated_at
      };
    }

    // 실제 환경에서는 각 신용평가기관 API 연동
    // 현재는 모의 데이터로 구현
    const creditScores = await getCreditScores(access_token, user_seq_no);

    // 평균 신용점수 계산
    const validScores = creditScores.filter(cs => cs.score > 0);
    const averageScore = validScores.length > 0 
      ? Math.round(validScores.reduce((sum, cs) => sum + cs.score, 0) / validScores.length)
      : 0;

    // 신용등급 계산
    const creditGrade = calculateCreditGrade(averageScore);

    // 신용점수별 혜택 안내
    const benefits = getCreditBenefits(averageScore);

    // 청약 가점 영향도 계산
    const subscriptionImpact = calculateSubscriptionImpact(averageScore);

    // 대출 조건 개선 제안
    const loanImprovements = calculateLoanImprovements(averageScore);

    // 신용점수 정보 저장/업데이트
    if (averageScore > 0) {
      await query(`
        INSERT INTO subscription_eligibility (user_id, credit_score, credit_grade)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id)
        DO UPDATE SET 
          credit_score = EXCLUDED.credit_score,
          credit_grade = EXCLUDED.credit_grade,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, averageScore, creditGrade]);
    }

    return NextResponse.json({
      success: true,
      creditInfo: {
        averageScore,
        grade: creditGrade,
        lastUpdated: new Date().toISOString(),
        previousScore: existingCreditInfo?.score || null,
        scoreChange: existingCreditInfo?.score ? averageScore - existingCreditInfo.score : null
      },
      detailedScores: creditScores,
      benefits,
      subscriptionImpact,
      loanImprovements,
      recommendations: getScoreImprovementTips(averageScore)
    });

  } catch (error) {
    console.error('신용점수 조회 오류:', error);
    return NextResponse.json(
      { error: '신용점수 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 신용점수 개선 계획 생성
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
    const { targetScore, timeframe } = body;

    if (!targetScore || targetScore < 300 || targetScore > 950) {
      return NextResponse.json(
        { error: '목표 점수는 300~950 사이여야 합니다.' },
        { status: 400 }
      );
    }

    if (!timeframe || !['3months', '6months', '1year'].includes(timeframe)) {
      return NextResponse.json(
        { error: '기간은 3개월, 6개월, 1년 중 선택해야 합니다.' },
        { status: 400 }
      );
    }

    // 현재 신용점수 조회
    const eligibilityResult = await query(
      'SELECT credit_score FROM subscription_eligibility WHERE user_id = $1',
      [userId]
    );

    const currentScore = eligibilityResult.rows[0]?.credit_score || 600;

    if (targetScore <= currentScore) {
      return NextResponse.json(
        { error: '목표 점수는 현재 점수보다 높아야 합니다.' },
        { status: 400 }
      );
    }

    const scoreGap = targetScore - currentScore;
    const timeframeMonths = timeframe === '3months' ? 3 : timeframe === '6months' ? 6 : 12;
    const monthlyTarget = Math.ceil(scoreGap / timeframeMonths);

    // 개선 계획 생성
    const improvementPlan = generateImprovementPlan(currentScore, targetScore, timeframeMonths);

    // 예상 혜택 계산
    const expectedBenefits = calculateExpectedBenefits(currentScore, targetScore);

    return NextResponse.json({
      success: true,
      improvementPlan: {
        currentScore,
        targetScore,
        scoreGap,
        timeframeMonths,
        monthlyTarget,
        timeline: improvementPlan.timeline,
        actions: improvementPlan.actions,
        milestones: improvementPlan.milestones
      },
      expectedBenefits,
      riskFactors: improvementPlan.risks,
      monitoringTips: [
        '매월 신용점수 확인',
        '신용카드 사용률 30% 이하 유지',
        '연체 없이 결제 이행',
        '불필요한 신용조회 자제',
        '기존 대출 조기상환 고려'
      ]
    });

  } catch (error) {
    console.error('신용점수 개선 계획 생성 오류:', error);
    return NextResponse.json(
      { error: '개선 계획 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 신용점수 조회 (모의 구현)
async function getCreditScores(accessToken: string, userSeqNo: string) {
  // 실제 환경에서는 각 신용평가기관 API 호출
  // KCB, NICE, 서울신용평가정보 등
  
  const mockScores = [
    {
      provider: 'KCB',
      providerName: '코리아크레딧뷰로',
      score: 720 + Math.floor(Math.random() * 50),
      grade: 'BB',
      updateDate: new Date().toISOString(),
      maxScore: 1000
    },
    {
      provider: 'NICE',
      providerName: '나이스신용평가',
      score: 700 + Math.floor(Math.random() * 60),
      grade: 'B',
      updateDate: new Date().toISOString(),
      maxScore: 1000
    },
    {
      provider: 'SCI',
      providerName: '서울신용평가정보',
      score: 710 + Math.floor(Math.random() * 55),
      grade: 'B+',
      updateDate: new Date().toISOString(),
      maxScore: 1000
    }
  ];

  return mockScores;
}

// 신용등급 계산
function calculateCreditGrade(score: number): string {
  if (score >= 900) return 'AAA';
  if (score >= 850) return 'AA';
  if (score >= 800) return 'A';
  if (score >= 750) return 'BBB';
  if (score >= 700) return 'BB';
  if (score >= 650) return 'B';
  if (score >= 600) return 'CCC';
  if (score >= 550) return 'CC';
  if (score >= 500) return 'C';
  return 'D';
}

// 신용점수별 혜택
function getCreditBenefits(score: number) {
  const benefits = [];

  if (score >= 800) {
    benefits.push({
      category: '대출',
      benefit: '최우대 금리 적용',
      description: '은행권 최저금리로 대출 가능'
    });
    benefits.push({
      category: '신용카드',
      benefit: '프리미엄 카드 발급',
      description: '연회비 면제 및 특별 혜택 제공'
    });
  } else if (score >= 700) {
    benefits.push({
      category: '대출',
      benefit: '우대 금리 적용',
      description: '시장금리 대비 0.3%p 할인'
    });
    benefits.push({
      category: '청약',
      benefit: '대출한도 확대',
      description: '청약통장 연계 대출한도 20% 증액'
    });
  } else if (score >= 600) {
    benefits.push({
      category: '대출',
      benefit: '일반 금리 적용',
      description: '표준 대출 조건 적용'
    });
  } else {
    benefits.push({
      category: '개선 필요',
      benefit: '신용관리 필요',
      description: '신용점수 개선을 통한 조건 향상 권장'
    });
  }

  return benefits;
}

// 청약 가점 영향도 계산
function calculateSubscriptionImpact(score: number) {
  let impact = '';
  let additionalPoints = 0;

  if (score >= 800) {
    impact = '매우 긍정적';
    additionalPoints = 5;
  } else if (score >= 700) {
    impact = '긍정적';
    additionalPoints = 3;
  } else if (score >= 600) {
    impact = '보통';
    additionalPoints = 1;
  } else {
    impact = '부정적';
    additionalPoints = 0;
  }

  return {
    impact,
    additionalPoints,
    description: `신용점수가 청약 가점에 ${additionalPoints}점 추가 영향`
  };
}

// 대출 조건 개선사항
function calculateLoanImprovements(score: number) {
  const improvements = [];

  if (score >= 800) {
    improvements.push('금리 우대 최대 0.5%p');
    improvements.push('대출한도 최대 30% 증액');
    improvements.push('중도상환 수수료 면제');
  } else if (score >= 700) {
    improvements.push('금리 우대 최대 0.3%p');
    improvements.push('대출한도 최대 20% 증액');
  } else if (score >= 600) {
    improvements.push('표준 조건 적용');
  } else {
    improvements.push('신용개선 후 재신청 권장');
  }

  return improvements;
}

// 신용점수 개선 팁
function getScoreImprovementTips(score: number) {
  const tips = [];

  if (score < 700) {
    tips.push({
      priority: 'high',
      action: '연체 해결',
      description: '기존 연체금액 완전 해결',
      expectedImpact: '+50~100점'
    });
  }

  if (score < 800) {
    tips.push({
      priority: 'medium',
      action: '신용카드 사용률 관리',
      description: '한도 대비 30% 이하 사용',
      expectedImpact: '+20~50점'
    });
    tips.push({
      priority: 'medium',
      action: '다양한 금융상품 이용',
      description: '예적금, 보험 등 다양한 상품 보유',
      expectedImpact: '+10~30점'
    });
  }

  tips.push({
    priority: 'low',
    action: '신용정보 관리',
    description: '개인정보 정확성 유지 및 정기 확인',
    expectedImpact: '+5~15점'
  });

  return tips;
}

// 개선 계획 생성
function generateImprovementPlan(currentScore: number, targetScore: number, months: number) {
  const scoreGap = targetScore - currentScore;
  const monthlyTarget = Math.ceil(scoreGap / months);

  const timeline = [];
  for (let i = 1; i <= months; i++) {
    const expectedScore = Math.min(currentScore + (monthlyTarget * i), targetScore);
    timeline.push({
      month: i,
      targetScore: expectedScore,
      actions: getMonthlyActions(i, expectedScore)
    });
  }

  return {
    timeline,
    actions: getAllActions(currentScore),
    milestones: getMilestones(currentScore, targetScore),
    risks: getRiskFactors(scoreGap, months)
  };
}

function getMonthlyActions(month: number, targetScore: number) {
  const actions = [];
  
  if (month === 1) {
    actions.push('기존 연체금 완전 정리');
    actions.push('신용카드 사용률 30% 이하로 조정');
  } else if (month <= 3) {
    actions.push('신용카드 결제 연체 없이 이행');
    actions.push('불필요한 카드 해지');
  } else if (month <= 6) {
    actions.push('새로운 금융상품 개설');
    actions.push('신용정보 정확성 점검');
  } else {
    actions.push('장기 신용관리 패턴 유지');
    actions.push('추가 신용상품 검토');
  }

  return actions;
}

function getAllActions(currentScore: number) {
  return [
    '모든 연체금 즉시 해결',
    '신용카드 사용률 30% 이하 유지',
    '자동이체 설정으로 연체 방지',
    '불필요한 신용조회 자제',
    '다양한 금융상품 보유',
    '정기적인 신용정보 확인'
  ];
}

function getMilestones(currentScore: number, targetScore: number) {
  const gap = targetScore - currentScore;
  return [
    {
      milestone: '1차 목표',
      score: currentScore + Math.floor(gap * 0.3),
      period: '3개월',
      reward: '신용카드 한도 증액'
    },
    {
      milestone: '2차 목표',
      score: currentScore + Math.floor(gap * 0.6),
      period: '6개월',
      reward: '대출 금리 우대 혜택'
    },
    {
      milestone: '최종 목표',
      score: targetScore,
      period: '12개월',
      reward: '프리미엄 금융상품 이용'
    }
  ];
}

function getRiskFactors(scoreGap: number, months: number) {
  const risks = [];

  if (scoreGap > 100) {
    risks.push('목표점수가 너무 높아 달성이 어려울 수 있습니다');
  }

  if (months < 6) {
    risks.push('단기간 점수 상승은 제한적일 수 있습니다');
  }

  risks.push('외부 경제상황에 따른 변동 가능성');
  risks.push('신용평가 기준 변경에 따른 영향');

  return risks;
}

function calculateExpectedBenefits(currentScore: number, targetScore: number) {
  const benefits = [];

  if (targetScore >= 800) {
    benefits.push({
      category: '대출금리',
      current: '연 4.5%',
      expected: '연 3.2%',
      saving: '연간 약 130만원 절약 (1억원 기준)'
    });
  }

  if (targetScore >= 700) {
    benefits.push({
      category: '청약가점',
      current: '+1점',
      expected: '+3점',
      saving: '청약 당첨확률 향상'
    });
  }

  benefits.push({
    category: '신용카드',
    current: '일반등급',
    expected: '우대등급',
    saving: '연회비 면제 및 혜택 확대'
  });

  return benefits;
}
