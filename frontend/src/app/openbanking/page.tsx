"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Swal from 'sweetalert2';

interface BankAccount {
  id: number;
  fintechUseNum: string;
  accountAlias: string;
  bankName: string;
  accountNumMasked: string;
  accountHolderName: string;
  isSubscriptionAccount: boolean;
  hasAutoPayment: boolean;
}

interface BalanceInfo {
  accountId: number;
  fintechUseNum: string;
  accountAlias: string;
  bankName: string;
  accountNumMasked: string;
  balanceAmt: number;
  availableAmt: number;
  balanceAmtFormatted: string;
  availableAmtFormatted: string;
  inquiryTime: string;
  isFromCache?: boolean;
  error?: string;
}

interface AutoPayment {
  id: number;
  accountId: number;
  accountAlias: string;
  bankName: string;
  paymentAmount: number;
  paymentAmountFormatted: string;
  paymentDay: number;
  isActive: boolean;
  nextPaymentDate: string;
  daysUntilPayment?: number;
}

interface LoanInfo {
  totalLimit: number;
  totalLimitFormatted: string;
  availableLimit: number;
  availableLimitFormatted: string;
}

interface CreditInfo {
  averageScore: number;
  grade: string;
  lastUpdated: string;
  scoreChange: number | null;
}

export default function OpenBankingPage() {
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('accounts');
  
  // 상태 관리
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [balances, setBalances] = useState<BalanceInfo[]>([]);
  const [autoPayments, setAutoPayments] = useState<AutoPayment[]>([]);
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [needAuth, setNeedAuth] = useState(false);

  // 반응형 감지
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/openbanking/accounts');
      const data = await response.json();

      if (data.needAuth) {
        setNeedAuth(true);
        return;
      }

      if (data.success) {
        setAccounts(data.accounts);
        setNeedAuth(false);
        // 계좌가 있으면 잔고와 다른 정보도 로드
        if (data.accounts.length > 0) {
          await Promise.all([
            loadBalances(),
            loadAutoPayments(),
            loadLoanInfo(),
            loadCreditInfo()
          ]);
        }
      }
    } catch (error) {
      console.error('계좌 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async () => {
    try {
      const response = await fetch('/api/openbanking/balance');
      const data = await response.json();
      if (data.success) {
        setBalances(data.balances);
      }
    } catch (error) {
      console.error('잔고 조회 실패:', error);
    }
  };

  const loadAutoPayments = async () => {
    try {
      const response = await fetch('/api/openbanking/auto-payment');
      const data = await response.json();
      if (data.success) {
        setAutoPayments(data.autoPayments);
      }
    } catch (error) {
      console.error('자동납입 조회 실패:', error);
    }
  };

  const loadLoanInfo = async () => {
    try {
      const response = await fetch('/api/openbanking/loan');
      const data = await response.json();
      if (data.success) {
        setLoanInfo(data.loanLimit);
      }
    } catch (error) {
      console.error('대출 한도 조회 실패:', error);
    }
  };

  const loadCreditInfo = async () => {
    try {
      const response = await fetch('/api/openbanking/credit');
      const data = await response.json();
      if (data.success) {
        setCreditInfo(data.creditInfo);
      }
    } catch (error) {
      console.error('신용점수 조회 실패:', error);
    }
  };

  const handleConnectOpenBanking = async () => {
    try {
      // 실제 오픈뱅킹 인증 URL 요청
      const response = await fetch('/api/openbanking/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success && data.authUrl) {
        // 오픈뱅킹 인증 페이지로 리다이렉트
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || '인증 URL 생성 실패');
      }
    } catch (error: any) {
      await Swal.fire({
        title: '❌ 연결 실패',
        text: error.message || '오픈뱅킹 연결 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/openbanking/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (data.success) {
        await Swal.fire({
          title: '✅ 테스트 연결 완료!',
          text: '모의 계좌가 성공적으로 연결되었습니다.',
          icon: 'success',
          confirmButtonText: '확인',
          confirmButtonColor: '#667eea'
        });
        await loadAccountData();
      } else {
        throw new Error(data.error || '테스트 연결 실패');
      }
    } catch (error: any) {
      await Swal.fire({
        title: '❌ 테스트 연결 실패',
        text: error.message || '테스트 연결 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBalance = async (accountId?: number) => {
    try {
      setLoading(true);
      const url = accountId 
        ? `/api/openbanking/balance?accountId=${accountId}`
        : '/api/openbanking/balance';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setBalances(data.balances);
        await Swal.fire({
          title: '✅ 조회 완료!',
          text: '잔고 정보가 업데이트되었습니다.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      await Swal.fire({
        title: '❌ 조회 실패',
        text: '잔고 조회 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAutoPayment = async (accountId: number) => {
    const { value: formValues } = await Swal.fire({
      title: '자동납입 설정',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">납입금액 (원)</label>
          <input id="amount" class="swal2-input" placeholder="예: 500000" type="number" style="margin: 0 0 16px 0;">
          <label style="display: block; margin-bottom: 8px; font-weight: 600;">매월 납입일</label>
          <input id="day" class="swal2-input" placeholder="예: 15" type="number" min="1" max="31" style="margin: 0;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '설정',
      cancelButtonText: '취소',
      confirmButtonColor: '#667eea',
      preConfirm: () => {
        const amount = (document.getElementById('amount') as HTMLInputElement).value;
        const day = (document.getElementById('day') as HTMLInputElement).value;
        
        if (!amount || !day) {
          Swal.showValidationMessage('모든 항목을 입력해주세요');
          return false;
        }
        
        if (parseInt(amount) <= 0) {
          Swal.showValidationMessage('납입금액은 0보다 커야 합니다');
          return false;
        }
        
        if (parseInt(day) < 1 || parseInt(day) > 31) {
          Swal.showValidationMessage('납입일은 1~31일 사이여야 합니다');
          return false;
        }
        
        return { amount: parseInt(amount), day: parseInt(day) };
      }
    });

    if (formValues) {
      try {
        const response = await fetch('/api/openbanking/auto-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId,
            paymentAmount: formValues.amount,
            paymentDay: formValues.day
          })
        });

        const data = await response.json();
        if (data.success) {
          await Swal.fire({
            title: '✅ 설정 완료!',
            text: '자동납입이 설정되었습니다.',
            icon: 'success',
            confirmButtonText: '확인'
          });
          await loadAutoPayments();
        } else {
          throw new Error(data.error);
        }
      } catch (error: any) {
        await Swal.fire({
          title: '❌ 설정 실패',
          text: error.message || '자동납입 설정 중 오류가 발생했습니다.',
          icon: 'error',
          confirmButtonText: '확인'
        });
      }
    }
  };

  const handleToggleAutoPayment = async (autoPaymentId: number, isActive: boolean) => {
    try {
      const response = await fetch('/api/openbanking/auto-payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: autoPaymentId,
          isActive: !isActive
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadAutoPayments();
        await Swal.fire({
          title: '✅ 변경 완료!',
          text: `자동납입이 ${!isActive ? '활성화' : '비활성화'}되었습니다.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      await Swal.fire({
        title: '❌ 변경 실패',
        text: '자동납입 상태 변경 중 오류가 발생했습니다.',
        icon: 'error',
        confirmButtonText: '확인'
      });
    }
  };

  if (needAuth) {
    return (
      <AuthGuard>
        <div className="container" style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          padding: "40px 20px"
        }}>
          <div className="glass" style={{ padding: 40, maxWidth: 600 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🏦</div>
            <h1 style={{ 
              fontSize: 24, 
              fontFamily: 'Pretendard-Bold', 
              marginBottom: 12,
              color: '#fff'
            }}>
              오픈뱅킹 연결 필요
            </h1>
            <p style={{ 
              color: '#ccc', 
              marginBottom: 30,
              lineHeight: 1.6
            }}>
              청약통장 잔고 조회, 자동납입 관리, 대출한도 확인을 위해<br/>
              오픈뱅킹 계좌 연결이 필요합니다.
            </p>
            <button 
              className="button-primary"
              onClick={handleConnectOpenBanking}
              style={{ 
                padding: "12px 32px",
                fontSize: 16,
                fontFamily: 'Pretendard-SemiBold'
              }}
            >
              오픈뱅킹 연결하기
            </button>
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              marginTop: 20,
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <button 
                className="button-primary"
                onClick={handleTestConnection}
                style={{ 
                  padding: "10px 24px",
                  fontSize: 14,
                  fontFamily: 'Pretendard-Medium',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
                }}
              >
                테스트 연결 (개발용)
              </button>
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: '#999', textAlign: 'center' }}>
              실제 연결: 안전한 금융결제원 오픈뱅킹 시스템<br/>
              테스트 연결: 모의 데이터로 기능 체험
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="container" style={{ 
        padding: isMobile ? "10px" : "20px",
        minHeight: "100vh"
      }}>
        {/* 헤더 */}
        <div className="glass" style={{ 
          padding: isMobile ? 20 : 24, 
          marginBottom: 20,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 32 }}>🏦</div>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? 20 : 24,
                fontFamily: 'Pretendard-Bold',
                margin: 0,
                color: '#fff'
              }}>
                오픈뱅킹 관리
              </h1>
              <p style={{ 
                fontSize: 14, 
                color: 'rgba(255,255,255,0.8)', 
                margin: "4px 0 0 0" 
              }}>
                청약통장 잔고 · 자동납입 · 대출한도 · 신용점수
              </p>
            </div>
          </div>

          {/* 요약 카드 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', 
            gap: 12 
          }}>
            <SummaryCard 
              title="연결 계좌"
              value={accounts.length.toString()}
              unit="개"
              icon="🏦"
              color="#22c55e"
            />
            <SummaryCard 
              title="총 잔고"
              value={balances.reduce((sum, b) => sum + b.balanceAmt, 0).toLocaleString()}
              unit="원"
              icon="💰"
              color="#3b82f6"
            />
            <SummaryCard 
              title="대출한도"
              value={loanInfo ? (loanInfo.totalLimit / 10000).toFixed(0) : '0'}
              unit="만원"
              icon="📊"
              color="#8b5cf6"
            />
            <SummaryCard 
              title="신용점수"
              value={creditInfo?.averageScore.toString() || '0'}
              unit="점"
              icon="⭐"
              color="#f59e0b"
            />
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="glass" style={{ 
          padding: isMobile ? "12px 16px" : "16px 20px", 
          marginBottom: 20 
        }}>
          <div style={{ 
            display: 'flex', 
            gap: isMobile ? 8 : 12,
            overflowX: 'auto'
          }}>
            {[
              { id: 'accounts', name: '계좌목록', icon: '🏦' },
              { id: 'balance', name: '잔고조회', icon: '💰' },
              { id: 'autopay', name: '자동납입', icon: '⚡' },
              { id: 'loan', name: '대출한도', icon: '📊' },
              { id: 'credit', name: '신용점수', icon: '⭐' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: isMobile ? "8px 12px" : "10px 16px",
                  borderRadius: 20,
                  border: 'none',
                  background: activeTab === tab.id 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: isMobile ? 12 : 14,
                  fontFamily: 'Pretendard-Medium',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div style={{ 
          display: 'grid', 
          gap: 16,
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))'
        }}>
          {activeTab === 'accounts' && accounts.map(account => (
            <AccountCard 
              key={account.id} 
              account={account} 
              onRefreshBalance={() => handleRefreshBalance(account.id)}
              onCreateAutoPayment={() => handleCreateAutoPayment(account.id)}
              balance={balances.find(b => b.accountId === account.id)}
              isMobile={isMobile}
            />
          ))}
          
          {activeTab === 'balance' && balances.map(balance => (
            <BalanceCard 
              key={balance.accountId} 
              balance={balance} 
              isMobile={isMobile}
            />
          ))}
          
          {activeTab === 'autopay' && autoPayments.map(payment => (
            <AutoPaymentCard 
              key={payment.id} 
              payment={payment}
              onToggle={() => handleToggleAutoPayment(payment.id, payment.isActive)}
              isMobile={isMobile}
            />
          ))}
          
          {activeTab === 'loan' && loanInfo && (
            <LoanCard loanInfo={loanInfo} isMobile={isMobile} />
          )}
          
          {activeTab === 'credit' && creditInfo && (
            <CreditCard creditInfo={creditInfo} isMobile={isMobile} />
          )}
        </div>

        {loading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="glass" style={{ padding: 30, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
              <div style={{ color: '#fff' }}>처리 중...</div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

// 요약 카드 컴포넌트
function SummaryCard({ title, value, unit, icon, color }: {
  title: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="glass" style={{
      padding: 16,
      background: 'rgba(255,255,255,0.1)',
      borderRadius: 12,
      transition: 'all 0.3s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 8
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
          {title}
        </div>
        <span style={{ fontSize: 16, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
          {icon}
        </span>
      </div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'baseline', 
        gap: 4 
      }}>
        <div style={{
          fontSize: 18,
          fontFamily: 'Pretendard-Bold',
          color: '#fff'
        }}>
          {value}
        </div>
        <div style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.7)'
        }}>
          {unit}
        </div>
      </div>
    </div>
  );
}

// 계좌 카드 컴포넌트  
function AccountCard({ account, balance, onRefreshBalance, onCreateAutoPayment, isMobile }: {
  account: BankAccount;
  balance?: BalanceInfo;
  onRefreshBalance: () => void;
  onCreateAutoPayment: () => void;
  isMobile: boolean;
}) {
  return (
    <div className="glass" style={{ padding: isMobile ? 16 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 24 }}>🏦</div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontFamily: 'Pretendard-SemiBold', 
            fontSize: 16, 
            color: '#fff',
            marginBottom: 4
          }}>
            {account.accountAlias || account.bankName}
          </div>
          <div style={{ fontSize: 12, color: '#ccc' }}>
            {account.accountNumMasked} · {account.accountHolderName}
          </div>
        </div>
        {account.isSubscriptionAccount && (
          <div className="badge" style={{ background: '#22c55e', fontSize: 10 }}>
            청약통장
          </div>
        )}
      </div>

      {balance && (
        <div className="glass" style={{ 
          padding: 14, 
          marginBottom: 16,
          background: 'rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#ccc' }}>잔고</span>
            <span style={{ 
              fontSize: 16, 
              fontFamily: 'Pretendard-Bold', 
              color: '#22c55e' 
            }}>
              {balance.balanceAmtFormatted}원
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#ccc' }}>출금가능</span>
            <span style={{ fontSize: 14, color: '#fff' }}>
              {balance.availableAmtFormatted}원
            </span>
          </div>
          {balance.isFromCache && (
            <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 8 }}>
              ⚠️ 캐시된 데이터 (실시간 조회 실패)
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          className="button-primary"
          onClick={onRefreshBalance}
          style={{ flex: 1, padding: "8px 16px", fontSize: 12 }}
        >
          잔고조회
        </button>
        {!account.hasAutoPayment && (
          <button 
            className="button-primary"
            onClick={onCreateAutoPayment}
            style={{ 
              flex: 1, 
              padding: "8px 16px", 
              fontSize: 12,
              background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
            }}
          >
            자동납입설정
          </button>
        )}
      </div>
    </div>
  );
}

// 잔고 카드 컴포넌트
function BalanceCard({ balance, isMobile }: {
  balance: BalanceInfo;
  isMobile: boolean;
}) {
  return (
    <div className="glass" style={{ padding: isMobile ? 16 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 24 }}>💰</div>
        <div>
          <div style={{ 
            fontFamily: 'Pretendard-SemiBold', 
            fontSize: 16, 
            color: '#fff',
            marginBottom: 4
          }}>
            {balance.accountAlias}
          </div>
          <div style={{ fontSize: 12, color: '#ccc' }}>
            {balance.bankName} · {balance.accountNumMasked}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <div className="glass" style={{ 
          padding: 16,
          background: 'linear-gradient(135deg, #22c55e15 0%, rgba(255,255,255,0.05) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.2)'
        }}>
          <div style={{ fontSize: 12, color: '#ccc', marginBottom: 8 }}>현재 잔고</div>
          <div style={{ 
            fontSize: 24, 
            fontFamily: 'Pretendard-Bold', 
            color: '#22c55e' 
          }}>
            {balance.balanceAmtFormatted}원
          </div>
        </div>

        <div className="glass" style={{ 
          padding: 16,
          background: 'rgba(255,255,255,0.05)'
        }}>
          <div style={{ fontSize: 12, color: '#ccc', marginBottom: 8 }}>출금가능금액</div>
          <div style={{ 
            fontSize: 18, 
            fontFamily: 'Pretendard-SemiBold', 
            color: '#fff' 
          }}>
            {balance.availableAmtFormatted}원
          </div>
        </div>
      </div>

      <div style={{ 
        fontSize: 10, 
        color: '#999', 
        marginTop: 16,
        textAlign: 'center'
      }}>
        조회시간: {new Date(balance.inquiryTime).toLocaleString()}
      </div>
    </div>
  );
}

// 자동납입 카드 컴포넌트
function AutoPaymentCard({ payment, onToggle, isMobile }: {
  payment: AutoPayment;
  onToggle: () => void;
  isMobile: boolean;
}) {
  return (
    <div className="glass" style={{ padding: isMobile ? 16 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 24 }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontFamily: 'Pretendard-SemiBold', 
            fontSize: 16, 
            color: '#fff',
            marginBottom: 4
          }}>
            {payment.accountAlias}
          </div>
          <div style={{ fontSize: 12, color: '#ccc' }}>
            {payment.bankName} · 매월 {payment.paymentDay}일
          </div>
        </div>
        <div className={`badge ${payment.isActive ? 'active' : 'inactive'}`} style={{
          background: payment.isActive ? '#22c55e' : '#6b7280',
          fontSize: 10
        }}>
          {payment.isActive ? '활성' : '비활성'}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <div className="glass" style={{ 
          padding: 14,
          background: 'rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#ccc' }}>납입금액</span>
            <span style={{ 
              fontSize: 16, 
              fontFamily: 'Pretendard-Bold', 
              color: '#3b82f6' 
            }}>
              {payment.paymentAmountFormatted}원
            </span>
          </div>
        </div>

        <div className="glass" style={{ 
          padding: 14,
          background: 'rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#ccc' }}>다음 납입일</span>
            <span style={{ fontSize: 14, color: '#fff' }}>
              {new Date(payment.nextPaymentDate).toLocaleDateString()}
              {payment.daysUntilPayment !== undefined && (
                <span style={{ color: '#f59e0b', marginLeft: 8 }}>
                  ({payment.daysUntilPayment}일 후)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      <button 
        className="button-primary"
        onClick={onToggle}
        style={{ 
          width: '100%',
          padding: "10px 16px",
          background: payment.isActive 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
        }}
      >
        {payment.isActive ? '자동납입 중지' : '자동납입 시작'}
      </button>
    </div>
  );
}

// 대출 카드 컴포넌트
function LoanCard({ loanInfo, isMobile }: {
  loanInfo: LoanInfo;
  isMobile: boolean;
}) {
  return (
    <div className="glass" style={{ padding: isMobile ? 16 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 24 }}>📊</div>
        <div>
          <div style={{ 
            fontFamily: 'Pretendard-SemiBold', 
            fontSize: 16, 
            color: '#fff',
            marginBottom: 4
          }}>
            대출 한도 조회
          </div>
          <div style={{ fontSize: 12, color: '#ccc' }}>
            청약통장 기반 대출한도
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <div className="glass" style={{ 
          padding: 16,
          background: 'linear-gradient(135deg, #8b5cf615 0%, rgba(255,255,255,0.05) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <div style={{ fontSize: 12, color: '#ccc', marginBottom: 8 }}>총 대출한도</div>
          <div style={{ 
            fontSize: 24, 
            fontFamily: 'Pretendard-Bold', 
            color: '#8b5cf6' 
          }}>
            {loanInfo.totalLimitFormatted}원
          </div>
        </div>

        <div className="glass" style={{ 
          padding: 16,
          background: 'rgba(255,255,255,0.05)'
        }}>
          <div style={{ fontSize: 12, color: '#ccc', marginBottom: 8 }}>사용가능한도</div>
          <div style={{ 
            fontSize: 18, 
            fontFamily: 'Pretendard-SemiBold', 
            color: '#22c55e' 
          }}>
            {loanInfo.availableLimitFormatted}원
          </div>
        </div>
      </div>

      <button 
        className="button-primary"
        style={{ 
          width: '100%',
          marginTop: 16,
          padding: "10px 16px",
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
        }}
      >
        상세 조건 확인
      </button>
    </div>
  );
}

// 신용점수 카드 컴포넌트
function CreditCard({ creditInfo, isMobile }: {
  creditInfo: CreditInfo;
  isMobile: boolean;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 800) return '#22c55e';
    if (score >= 700) return '#3b82f6';
    if (score >= 600) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="glass" style={{ padding: isMobile ? 16 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 24 }}>⭐</div>
        <div>
          <div style={{ 
            fontFamily: 'Pretendard-SemiBold', 
            fontSize: 16, 
            color: '#fff',
            marginBottom: 4
          }}>
            신용점수
          </div>
          <div style={{ fontSize: 12, color: '#ccc' }}>
            평균 신용점수 및 등급
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <div className="glass" style={{ 
          padding: 16,
          background: 'rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 8 }}>평균 점수</div>
              <div style={{ 
                fontSize: 32, 
                fontFamily: 'Pretendard-Bold', 
                color: getScoreColor(creditInfo.averageScore)
              }}>
                {creditInfo.averageScore}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#ccc', marginBottom: 8 }}>신용등급</div>
              <div style={{ 
                fontSize: 20, 
                fontFamily: 'Pretendard-Bold', 
                color: '#fff' 
              }}>
                {creditInfo.grade}
              </div>
              {creditInfo.scoreChange !== null && (
                <div style={{ 
                  fontSize: 12, 
                  color: creditInfo.scoreChange > 0 ? '#22c55e' : '#ef4444',
                  marginTop: 4
                }}>
                  {creditInfo.scoreChange > 0 ? '↗' : '↘'} {Math.abs(creditInfo.scoreChange)}점
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        fontSize: 10, 
        color: '#999', 
        marginTop: 16,
        textAlign: 'center'
      }}>
        최근 업데이트: {new Date(creditInfo.lastUpdated).toLocaleString()}
      </div>

      <button 
        className="button-primary"
        style={{ 
          width: '100%',
          marginTop: 16,
          padding: "10px 16px",
          background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)'
        }}
      >
        개선 계획 만들기
      </button>
    </div>
  );
}
