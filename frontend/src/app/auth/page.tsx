"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useEffect } from 'react';
import { FullScreenLoading } from '@/components/LoadingAnimation';

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/home');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <FullScreenLoading 
        text="로딩 중..."
        backgroundColor="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        size={120}
      />
    );
  }

  return (
    <div className="entry-container">
      <div className="entry-card">
        <div className="entry-head">
          <div className="entry-logo" aria-hidden>🏠</div>
          <h1 className="entry-title">MyHouse</h1>
          <p className="entry-subtitle">
            청약 계산과 관리를 위한<br />
            스마트 주택 플랫폼
          </p>
        </div>

        <div className="entry-actions">
          <button
            onClick={() => router.push('/login')}
            className="entry-btn-primary"
          >
            로그인
          </button>

          <button
            onClick={() => router.push('/register')}
            className="entry-btn-outline"
          >
            회원가입
          </button>
        </div>

        <div className="entry-feature-panel">
          <div className="entry-feature-title">MyHouse와 함께하세요</div>
          <div className="entry-feature-list">
            • 청약 자격 확인 및 계산<br />
            • 영상 요약으로 빠른 정보 습득<br />
            • 개인 맞춤 주택 정보 관리
          </div>
        </div>
      </div>
    </div>
  );
}
